import { describe, it, expect, beforeAll, vi } from 'vitest';

let createNewsFetcher;
let DEFAULT_FEED_URL;

beforeAll(async () => {
  // news/newsFetcher.js is a classic worker script that sets a global
  await import('../../news/newsFetcher.js');
  ({ createNewsFetcher, DEFAULT_FEED_URL } = globalThis.ClioNewsFetcher);
});

const FEED = JSON.stringify({ schemaVersion: 1, channel: 'clio-satellite', items: [] });
const HOUR = 3600 * 1000;

function response({ status = 200, body = FEED, headers = {}, bytes } = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: name => headers[name] ?? null },
    text: async () => body,
    arrayBuffer: async () => bytes ?? new TextEncoder().encode(body).buffer,
  };
}

function setup({ local = {}, sync = {}, now = 1_000_000_000_000, fetchImpl } = {}) {
  const store = { ...local };
  const fetchFn = vi.fn(fetchImpl || (async () => response({ headers: { ETag: '"v1"' } })));
  let time = now;
  const fetcher = createNewsFetcher({
    fetchFn,
    storage: { get: async defaults => ({ ...defaults, ...store }), set: async data => Object.assign(store, data) },
    syncGet: async defaults => ({ ...defaults, ...sync }),
    now: () => time,
  });
  return { fetcher, fetchFn, store, advance: ms => { time += ms; } };
}

describe('newsFetcher.getNews', () => {
  it('fetches the feed once and serves it from cache within the TTL', async () => {
    const { fetcher, fetchFn, advance } = setup();
    expect(await fetcher.getNews()).toEqual({ ok: true, raw: FEED });
    advance(5 * HOUR);
    await fetcher.getNews();
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn.mock.calls[0][0]).toBe(DEFAULT_FEED_URL);
  });

  it('refreshes after the TTL with If-None-Match and keeps the cache on 304', async () => {
    const { fetcher, fetchFn, advance } = setup();
    await fetcher.getNews();
    fetchFn.mockImplementation(async () => response({ status: 304, body: '' }));
    advance(7 * HOUR);
    expect(await fetcher.getNews()).toEqual({ ok: true, raw: FEED });
    expect(fetchFn.mock.calls[1][1].headers['If-None-Match']).toBe('"v1"');
  });

  it('uses refreshHours from the feed', async () => {
    const feed = JSON.stringify({ schemaVersion: 1, items: [], refreshHours: 1 });
    const { fetcher, fetchFn, advance } = setup({ fetchImpl: async () => response({ body: feed }) });
    await fetcher.getNews();
    advance(61 * 60 * 1000);
    await fetcher.getNews();
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('does not fetch when news are turned off', async () => {
    const { fetcher, fetchFn } = setup({ sync: { newsEnabled: false } });
    expect((await fetcher.getNews()).ok).toBe(false);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('keeps the last good feed when the network fails', async () => {
    const { fetcher, fetchFn, advance } = setup();
    await fetcher.getNews();
    fetchFn.mockImplementation(async () => { throw new Error('offline'); });
    advance(7 * HOUR);
    expect(await fetcher.getNews()).toEqual({ ok: true, raw: FEED });
  });

  it('rejects oversized or unknown-schema feeds', async () => {
    const { fetcher } = setup({ fetchImpl: async () => response({ body: JSON.stringify({ schemaVersion: 9, items: [] }) }) });
    expect((await fetcher.getNews()).ok).toBe(false);
    const big = setup({ fetchImpl: async () => response({ body: 'x'.repeat(70 * 1024) }) });
    expect((await big.fetcher.getNews()).ok).toBe(false);
  });

  it('follows movedTo on an allowed host and falls back after three failures', async () => {
    const moved = 'https://advance-technologies-foundation.github.io/new-feed/v1/feeds/clio-satellite.json';
    const { fetcher, fetchFn, store, advance } = setup({
      fetchImpl: async () => response({ body: JSON.stringify({ schemaVersion: 1, items: [], movedTo: moved }) }),
    });
    await fetcher.getNews();
    expect(store.newsFeedCache.feedUrl).toBe(moved);
    fetchFn.mockImplementation(async () => { throw new Error('down'); });
    for (let i = 0; i < 3; i++) { advance(7 * HOUR); await fetcher.getNews(); }
    expect(fetchFn.mock.calls[1][0]).toBe(moved);
    expect(store.newsFeedCache.feedUrl).toBe('');
  });

  it('ignores movedTo on other hosts', async () => {
    const { fetcher, store } = setup({
      fetchImpl: async () => response({ body: JSON.stringify({ schemaVersion: 1, items: [], movedTo: 'https://evil.example.com/f.json' }) }),
    });
    await fetcher.getNews();
    expect(store.newsFeedCache.feedUrl).toBe('');
  });
});

describe('newsFetcher.getNewsMedia', () => {
  const IMG = 'https://advance-technologies-foundation.github.io/clio-news-feed/v1/media/2026/10/a.webp';

  it('returns a data URL for an allowed image and caches it', async () => {
    const bytes = new Uint8Array([1, 2, 3]).buffer;
    const { fetcher, fetchFn } = setup({ fetchImpl: async () => response({ headers: { 'Content-Type': 'image/webp' }, bytes }) });
    const first = await fetcher.getNewsMedia(IMG);
    expect(first).toEqual({ ok: true, dataUrl: 'data:image/webp;base64,AQID' });
    await fetcher.getNewsMedia(IMG);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('refuses other hosts, wrong types and large files', async () => {
    const { fetcher, fetchFn } = setup();
    expect((await fetcher.getNewsMedia('https://example.com/a.webp')).ok).toBe(false);
    expect(fetchFn).not.toHaveBeenCalled();

    const html = setup({ fetchImpl: async () => response({ headers: { 'Content-Type': 'text/html' } }) });
    expect((await html.fetcher.getNewsMedia(IMG)).reason).toBe('type');

    const big = setup({ fetchImpl: async () => response({ headers: { 'Content-Type': 'image/png' }, bytes: new ArrayBuffer(301 * 1024) }) });
    expect((await big.fetcher.getNewsMedia(IMG)).reason).toBe('size');
  });
});

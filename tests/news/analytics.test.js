import { describe, it, expect, beforeAll, vi } from 'vitest';

let createAnalytics;
let ENDPOINT;

beforeAll(async () => {
  // analytics/analytics.js is a classic worker script that sets a global
  await import('../../analytics/analytics.js');
  ({ createAnalytics, ENDPOINT } = globalThis.ClioAnalytics);
});

const CONFIG = { measurementId: 'G-TEST', apiSecret: 'secret' };
const MIN = 60 * 1000;

function setup({ sync = {}, config = CONFIG, now = 1_000_000_000_000, fetchImpl } = {}) {
  const store = {};
  const fetchFn = vi.fn(fetchImpl || (async () => ({ ok: true, status: 204 })));
  let time = now;
  let ids = 0;
  const analytics = createAnalytics({
    fetchFn,
    local: { get: async defaults => ({ ...defaults, ...store }), set: async data => Object.assign(store, data) },
    syncGet: async defaults => ({ ...defaults, ...sync }),
    config,
    version: '2.9',
    now: () => time,
    randomId: () => `client-${++ids}`,
  });
  const sent = () => fetchFn.mock.calls.map(([url, init]) => ({ url, body: JSON.parse(init.body) }));
  return { analytics, fetchFn, store, sent, advance: ms => { time += ms; } };
}

describe('analytics.track', () => {
  it('sends an allowed event to GA4 with a random client id, session and version', async () => {
    const { analytics, sent } = setup();
    expect(await analytics.track('menu_click', { menu: 'navigation', item: 'SysSettings' })).toEqual({ ok: true });
    const [{ url, body }] = sent();
    expect(url).toBe(`${ENDPOINT}?measurement_id=G-TEST&api_secret=secret`);
    expect(body.client_id).toBe('client-1');
    expect(body.events).toEqual([{
      name: 'menu_click',
      params: { menu: 'navigation', item: 'SysSettings', extension_version: '2.9', session_id: '1000000000', engagement_time_msec: 100 },
    }]);
  });

  it('is on by default and sends nothing after the user turns it off in Options', async () => {
    const { analytics, fetchFn } = setup({ sync: { analyticsEnabled: false } });
    expect(await analytics.track('news_open', { surface: 'login' })).toEqual({ ok: false, reason: 'disabled' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('sends nothing while the build has no GA4 property (local and unpacked builds)', async () => {
    const { analytics, fetchFn } = setup({ config: { measurementId: '', apiSecret: '' } });
    expect(await analytics.track('news_open', { surface: 'login' })).toEqual({ ok: false, reason: 'not-configured' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('rejects unknown events and values that are not short identifiers', async () => {
    const { analytics, fetchFn } = setup();
    expect((await analytics.track('page_view', { url: 'https://crm.example.com' })).reason).toBe('rejected');
    expect((await analytics.track('menu_click', { menu: 'navigation', item: 'https://crm.example.com/0/Shell' })).reason).toBe('rejected');
    expect((await analytics.track('menu_click', { menu: 'navigation', item: 'Supervisor Admin' })).reason).toBe('rejected');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('drops parameters that are not on the allow-list', async () => {
    const { analytics, sent } = setup();
    await analytics.track('news_open', { surface: 'shell', origin: 'crm.example.com', username: 'Supervisor' });
    expect(Object.keys(sent()[0].body.events[0].params)).toEqual(['surface', 'extension_version', 'session_id', 'engagement_time_msec']);
  });

  it('keeps the client id and the session within 30 minutes, then starts a new session', async () => {
    const { analytics, sent, advance } = setup();
    await analytics.track('news_open', { surface: 'login' });
    advance(10 * MIN);
    await analytics.track('news_open', { surface: 'login' });
    advance(31 * MIN);
    await analytics.track('news_open', { surface: 'login' });
    const calls = sent();
    expect(new Set(calls.map(c => c.body.client_id))).toEqual(new Set(['client-1']));
    expect(calls[0].body.events[0].params.session_id).toBe(calls[1].body.events[0].params.session_id);
    expect(calls[2].body.events[0].params.session_id).not.toBe(calls[1].body.events[0].params.session_id);
  });

  it('turns booleans into strings and never throws on network errors', async () => {
    const { analytics, sent } = setup();
    await analytics.track('news_toggle', { enabled: false });
    expect(sent()[0].body.events[0].params.enabled).toBe('false');
    const offline = setup({ fetchImpl: async () => { throw new Error('offline'); } });
    expect(await offline.analytics.track('news_open', { surface: 'login' })).toEqual({ ok: false, reason: 'network' });
  });
});

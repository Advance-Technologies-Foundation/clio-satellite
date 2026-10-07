import { describe, it, expect } from 'vitest';
import {
  validateFeed, selectVisible, isUnreadSignal, unreadItems, shouldShowDot, pickPeek, pickAutoExpand,
  compareVersions, onboardingSkip, youtubeEmbedUrl, youtubeWatchUrl, youtubePosterUrl, isTrendingNow, MAX_VISIBLE,
} from '../../src/news/newsCore.js';

const NOW = Date.parse('2026-10-10T12:00:00Z');
const HOUR = 3600 * 1000;

function item(id, extra = {}) {
  return {
    id,
    type: 'release',
    title: `Title ${id}`,
    publishedAt: '2026-10-06T00:00:00Z',
    expiresAt: '2026-11-06T00:00:00Z',
    ...extra,
  };
}

const feed = items => ({ schemaVersion: 1, channel: 'clio-satellite', items });
const valid = items => validateFeed(feed(items)).items;

describe('validateFeed', () => {
  it('keeps well-formed items and fills defaults', () => {
    const [i] = valid([item('a')]);
    expect(i).toMatchObject({ id: 'a', priority: 'normal', audiences: ['admin', 'developer', 'other'], surfaces: ['login', 'shell'] });
  });

  it('drops the whole feed for an unknown schema version', () => {
    expect(validateFeed({ schemaVersion: 2, items: [item('a')] }).items).toEqual([]);
    expect(validateFeed(null).items).toEqual([]);
  });

  it('drops items with missing fields or unknown type', () => {
    expect(valid([item('a', { type: 'ad' }), item('b', { title: '' }), item('c', { expiresAt: 'soon' }), { id: 'd' }])).toEqual([]);
  });

  it('accepts only https CTA links on allowed hosts', () => {
    const [ok, bad, http] = valid([
      item('ok', { cta: { label: 'Read', url: 'https://github.com/x' } }),
      item('bad', { cta: { label: 'Read', url: 'https://evil.example.com/x' } }),
      item('http', { cta: { label: 'Read', url: 'http://github.com/x' } }),
    ]);
    expect(ok.cta.url).toBe('https://github.com/x');
    expect(bad.cta).toBeUndefined();
    expect(http.cta).toBeUndefined();
  });

  it('clips long titles and bodies', () => {
    const [i] = valid([item('a', { title: 'x'.repeat(80), body: 'y'.repeat(200) })]);
    expect(i.title.length).toBe(60);
    expect(i.body.length).toBe(140);
  });

  it('keeps media only from allowed hosts and with a valid YouTube id', () => {
    const [img, foreign, yt, badYt] = valid([
      item('img', { media: { type: 'image', url: 'https://advance-technologies-foundation.github.io/clio-news-feed/v1/media/a.webp', alt: 'Shot' } }),
      item('foreign', { media: { type: 'image', url: 'https://example.com/a.webp', alt: 'Shot' } }),
      item('yt', { media: { type: 'youtube', videoId: 'dQw4w9WgXcQ', title: 'Video', start: 30 } }),
      item('badYt', { media: { type: 'youtube', videoId: 'https://youtu.be/x', title: 'Video' } }),
    ]);
    expect(img.media.type).toBe('image');
    expect(foreign.media).toBeUndefined();
    expect(yt.media).toMatchObject({ videoId: 'dQw4w9WgXcQ', player: 'embed', start: 30 });
    expect(badYt.media).toBeUndefined();
  });

  it('ignores trending on critical items', () => {
    const [i] = valid([item('a', { type: 'breaking', priority: 'critical', trending: { hours: 24 } })]);
    expect(i.trending).toBeUndefined();
  });

  it('reads refreshHours and an allowed movedTo', () => {
    const r = validateFeed({ ...feed([]), refreshHours: 2, movedTo: 'https://advance-technologies-foundation.github.io/new/v1/feeds/clio-satellite.json' });
    expect(r.refreshHours).toBe(2);
    expect(r.movedTo).toContain('/new/');
    expect(validateFeed({ ...feed([]), movedTo: 'https://evil.example.com/feed.json' }).movedTo).toBeUndefined();
  });
});

describe('isUnreadSignal and trending', () => {
  it('regular items stay unread until read', () => {
    const i = valid([item('a')])[0];
    expect(isUnreadSignal(i, { now: NOW })).toBe(true);
    expect(isUnreadSignal(i, { now: NOW, read: { a: 1 } })).toBe(false);
  });

  it('trending hours count from the first time the user saw the item', () => {
    const i = valid([item('a', { trending: { hours: 24 } })])[0];
    expect(isUnreadSignal(i, { now: NOW, firstShown: { a: NOW - 23 * HOUR } })).toBe(true);
    expect(isUnreadSignal(i, { now: NOW, firstShown: { a: NOW - 25 * HOUR } })).toBe(false);
    expect(isUnreadSignal(i, { now: NOW })).toBe(true); // never shown yet: window starts now
  });

  it('trending until is absolute and the earliest end wins', () => {
    const i = valid([item('a', { trending: { hours: 72, until: '2026-10-10T10:00:00Z' } })])[0];
    expect(isUnreadSignal(i, { now: NOW, firstShown: { a: NOW - HOUR } })).toBe(false);
  });

  it('an item past its window is quiet but not read, so extending the window brings it back', () => {
    const quiet = valid([item('a', { trending: { hours: 1 } })])[0];
    expect(isUnreadSignal(quiet, { now: NOW, firstShown: { a: NOW - 2 * HOUR } })).toBe(false);
    const extended = valid([item('a', { trending: { hours: 48 } })])[0];
    expect(isUnreadSignal(extended, { now: NOW, firstShown: { a: NOW - 2 * HOUR } })).toBe(true);
  });

  it('isTrendingNow ignores read state', () => {
    const i = valid([item('a', { trending: { hours: 24 } })])[0];
    expect(isTrendingNow(i, { now: NOW, firstShown: {} })).toBe(true);
  });
});

describe('selectVisible', () => {
  const base = { now: NOW, surface: 'login' };

  it('hides items outside their dates', () => {
    const items = valid([item('future', { publishedAt: '2026-10-11T00:00:00Z' }), item('expired', { expiresAt: '2026-10-09T00:00:00Z' }), item('ok')]);
    expect(selectVisible(items, base).map(i => i.id)).toEqual(['ok']);
  });

  it('filters by surface', () => {
    const items = valid([item('login', { surfaces: ['login'] }), item('shell', { surfaces: ['shell'] })]);
    expect(selectVisible(items, base).map(i => i.id)).toEqual(['login']);
    expect(selectVisible(items, { ...base, surface: 'shell' }).map(i => i.id)).toEqual(['shell']);
  });

  it('filters by the roles the user chose, but always shows critical items', () => {
    const items = valid([
      item('admin', { audiences: ['admin'] }),
      item('dev', { audiences: ['developer'] }),
      item('crit', { type: 'breaking', priority: 'critical', audiences: ['admin'] }),
    ]);
    expect(selectVisible(items, { ...base, audiences: ['developer'] }).map(i => i.id).sort()).toEqual(['crit', 'dev']);
  });

  it('hides items that need a newer extension', () => {
    const items = valid([item('new', { minVersion: '2.8' }), item('old', { minVersion: '2.6' })]);
    expect(selectVisible(items, { ...base, extensionVersion: '2.7' }).map(i => i.id)).toEqual(['old']);
  });

  it('sorts critical, then trending, then newest; limits to MAX_VISIBLE', () => {
    const items = valid([
      item('old', { publishedAt: '2026-10-01T00:00:00Z' }),
      item('new', { publishedAt: '2026-10-09T00:00:00Z' }),
      item('trend', { publishedAt: '2026-10-02T00:00:00Z', trending: { hours: 72 } }),
      item('crit', { type: 'breaking', priority: 'critical', publishedAt: '2026-09-30T00:00:00Z' }),
      item('x1'), item('x2'), item('x3'),
    ]);
    const ids = selectVisible(items, base).map(i => i.id);
    expect(ids.slice(0, 3)).toEqual(['crit', 'trend', 'new']);
    expect(ids).toHaveLength(MAX_VISIBLE);
  });

  it('unreadItems keeps only items with an unread signal', () => {
    const visible = selectVisible(valid([item('a'), item('b')]), base);
    expect(unreadItems(visible, { now: NOW, read: { a: 1 } }).map(i => i.id)).toEqual(['b']);
  });
});

describe('Shell dot, peek and auto-expand', () => {
  const unread = valid([item('a'), item('t', { trending: { hours: 24 } })]);

  it('shows the dot for unread items until the menu was opened', () => {
    expect(shouldShowDot(unread, { now: NOW, noticed: {} })).toBe(true);
    expect(shouldShowDot(unread, { now: NOW, noticed: { a: { noticedAt: 1 }, t: { noticedAt: 1 } } })).toBe(false);
  });

  it('a regular item stops lighting the dot after 7 days or 10 loads', () => {
    const regular = valid([item('a')]);
    expect(shouldShowDot(regular, { now: NOW, noticed: { a: { firstDotAt: NOW - 8 * 24 * HOUR, shellLoads: 1 } } })).toBe(false);
    expect(shouldShowDot(regular, { now: NOW, noticed: { a: { firstDotAt: NOW - HOUR, shellLoads: 10 } } })).toBe(false);
    expect(shouldShowDot(regular, { now: NOW, noticed: { a: { firstDotAt: NOW - HOUR, shellLoads: 3 } } })).toBe(true);
  });

  it('trending items are not subject to the load decay', () => {
    const trending = valid([item('t', { trending: { hours: 24 } })]);
    expect(shouldShowDot(trending, { now: NOW, noticed: { t: { firstDotAt: NOW - HOUR, shellLoads: 50 } } })).toBe(true);
  });

  it('peeks one critical item once, at most once a day, only in Shell', () => {
    const crit = valid([item('c', { type: 'breaking', priority: 'critical' })]);
    expect(pickPeek(crit, { now: NOW, pageType: 'shell' })?.id).toBe('c');
    expect(pickPeek(crit, { now: NOW, pageType: 'configuration' })).toBeNull();
    expect(pickPeek(crit, { now: NOW, pageType: 'shell', autoOpened: { c: true } })).toBeNull();
    expect(pickPeek(crit, { now: NOW, pageType: 'shell', lastPeekAt: NOW - HOUR })).toBeNull();
    expect(pickPeek(unread, { now: NOW, pageType: 'shell' })).toBeNull();
  });

  it('auto-expands the login panel once per critical item', () => {
    const crit = valid([item('c', { type: 'breaking', priority: 'critical' })]);
    expect(pickAutoExpand(crit, {})?.id).toBe('c');
    expect(pickAutoExpand(crit, { autoOpened: { c: true } })).toBeNull();
  });
});

describe('onboardingSkip (first run of a new user)', () => {
  const daysAgo = n => new Date(NOW - n * 24 * HOUR).toISOString();

  it('keeps the 3 newest items of the last month and skips the rest of the backlog', () => {
    const items = valid([
      item('d1', { publishedAt: daysAgo(1) }),
      item('d5', { publishedAt: daysAgo(5) }),
      item('d10', { publishedAt: daysAgo(10) }),
      item('d20', { publishedAt: daysAgo(20) }),
      item('d40', { publishedAt: daysAgo(40), expiresAt: daysAgo(-10) }),
    ]);
    expect(onboardingSkip(items, { now: NOW }).sort()).toEqual(['d20', 'd40']);
  });

  it('skips items older than a month even when fewer than 3 are recent', () => {
    const items = valid([
      item('d2', { publishedAt: daysAgo(2) }),
      item('d45', { publishedAt: daysAgo(45), expiresAt: daysAgo(-10) }),
    ]);
    expect(onboardingSkip(items, { now: NOW })).toEqual(['d45']);
  });

  it('never skips critical items', () => {
    const items = valid([
      item('c', { type: 'breaking', priority: 'critical', publishedAt: daysAgo(50), expiresAt: daysAgo(-5) }),
      item('a', { publishedAt: daysAgo(1) }), item('b', { publishedAt: daysAgo(2) }),
      item('c2', { publishedAt: daysAgo(3) }), item('e', { publishedAt: daysAgo(4) }),
    ]);
    const skipped = onboardingSkip(items, { now: NOW });
    expect(skipped).toEqual(['e']);
  });

  it('selectVisible hides skipped items', () => {
    const items = valid([item('a'), item('b')]);
    expect(selectVisible(items, { now: NOW, surface: 'login', skipped: { a: 1 } }).map(i => i.id)).toEqual(['b']);
  });
});

describe('helpers', () => {
  it('compares versions numerically', () => {
    expect(compareVersions('2.10', '2.9')).toBe(1);
    expect(compareVersions('2.7', '2.7.0')).toBe(0);
    expect(compareVersions('1.9', '2')).toBe(-1);
  });

  it('builds YouTube URLs only from the video id', () => {
    const media = { videoId: 'dQw4w9WgXcQ', start: 95 };
    expect(youtubeEmbedUrl(media, 'https://dev.example.com')).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?.*start=95/);
    expect(youtubeEmbedUrl(media, 'https://dev.example.com')).toContain('origin=https%3A%2F%2Fdev.example.com');
    expect(youtubeWatchUrl(media)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=95s');
    expect(youtubePosterUrl(media)).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    expect(youtubePosterUrl({ ...media, poster: 'https://advance-technologies-foundation.github.io/p.webp' })).toContain('p.webp');
  });
});

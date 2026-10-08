// Developer news: feed and media fetching for the background service worker.
// Loaded with importScripts() in background.js (classic worker), so it exposes a global
// instead of ES exports. Content scripts never fetch the feed themselves: the worker is not
// subject to the Creatio page's CSP/CORS, and the page never learns the feed URL.
(function (root) {
  const DEFAULT_FEED_URL = 'https://advance-technologies-foundation.github.io/clio-news-feed/v1/feeds/clio-satellite.json';
  const FEED_HOSTS = ['advance-technologies-foundation.github.io'];
  const MEDIA_HOSTS = ['advance-technologies-foundation.github.io', 'i.ytimg.com'];
  const MEDIA_TYPES = ['image/webp', 'image/png', 'image/jpeg'];
  const DEFAULT_REFRESH_HOURS = 6;
  const MAX_FEED_BYTES = 64 * 1024;
  const MAX_IMAGE_BYTES = 300 * 1024;
  const MAX_MEDIA_CACHE_BYTES = 2 * 1024 * 1024;
  const MOVED_FEED_MAX_FAILURES = 3;
  const HOUR = 60 * 60 * 1000;

  function allowedHost(value, hosts) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && hosts.includes(url.hostname);
    } catch {
      return false;
    }
  }

  function toBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
  }

  // storage: { get(defaults) → Promise<object>, set(object) → Promise } for chrome.storage.local
  // syncGet: (defaults) → Promise<object> for chrome.storage.sync
  function createNewsFetcher({ fetchFn, storage, syncGet, now = () => Date.now() }) {
    let inflight = null;

    async function refresh(cache) {
      const feedUrl = cache.feedUrl && allowedHost(cache.feedUrl, FEED_HOSTS) ? cache.feedUrl : DEFAULT_FEED_URL;
      const headers = cache.etag && cache.raw ? { 'If-None-Match': cache.etag } : {};
      try {
        const response = await fetchFn(feedUrl, { headers, cache: 'no-cache', credentials: 'omit' });
        if (response.status === 304 && cache.raw) {
          const next = { ...cache, fetchedAt: now(), failures: 0 };
          await storage.set({ newsFeedCache: next });
          return next;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const raw = await response.text();
        if (raw.length > MAX_FEED_BYTES) throw new Error('feed too large');
        const parsed = JSON.parse(raw);
        if (parsed.schemaVersion !== 1) throw new Error('unknown schema');
        const next = {
          raw,
          etag: response.headers.get('ETag') || '',
          fetchedAt: now(),
          refreshHours: Number.isInteger(parsed.refreshHours) && parsed.refreshHours >= 1 && parsed.refreshHours <= 24
            ? parsed.refreshHours : DEFAULT_REFRESH_HOURS,
          feedUrl: allowedHost(parsed.movedTo, FEED_HOSTS) ? parsed.movedTo : (cache.feedUrl || ''),
          failures: 0,
        };
        await storage.set({ newsFeedCache: next });
        return next;
      } catch (error) {
        // A moved feed that keeps failing falls back to the URL compiled into the extension
        const failures = (cache.failures || 0) + 1;
        const next = { ...cache, failures, fetchedAt: cache.fetchedAt || 0 };
        if (cache.feedUrl && failures >= MOVED_FEED_MAX_FAILURES) next.feedUrl = '';
        await storage.set({ newsFeedCache: next });
        return next;
      }
    }

    async function getNews() {
      // Preview feature: nothing is downloaded until news are turned on in Options
      const { newsEnabled } = await syncGet({ newsEnabled: true });
      if (newsEnabled === false) return { ok: false, reason: 'disabled' };
      const { newsFeedCache: cache = {} } = await storage.get({ newsFeedCache: {} });
      const ttl = (cache.refreshHours || DEFAULT_REFRESH_HOURS) * HOUR;
      let current = cache;
      if (!cache.raw || now() - (cache.fetchedAt || 0) >= ttl) {
        inflight = inflight || refresh(cache).finally(() => { inflight = null; });
        current = await inflight;
      }
      return current.raw ? { ok: true, raw: current.raw } : { ok: false, reason: 'unavailable' };
    }

    async function getNewsMedia(url) {
      if (!allowedHost(url, MEDIA_HOSTS)) return { ok: false, reason: 'host' };
      const { newsMediaCache: cache = {} } = await storage.get({ newsMediaCache: {} });
      if (cache[url]) return { ok: true, dataUrl: cache[url].dataUrl };
      try {
        const response = await fetchFn(url, { credentials: 'omit' });
        if (!response.ok) return { ok: false, reason: `HTTP ${response.status}` };
        const type = (response.headers.get('Content-Type') || '').split(';')[0].trim();
        if (!MEDIA_TYPES.includes(type)) return { ok: false, reason: 'type' };
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > MAX_IMAGE_BYTES) return { ok: false, reason: 'size' };
        const dataUrl = `data:${type};base64,${toBase64(buffer)}`;
        const next = { ...cache, [url]: { dataUrl, at: now() } };
        // Keep the cache under its budget, oldest first
        const entries = Object.entries(next).sort((a, b) => a[1].at - b[1].at);
        let total = entries.reduce((sum, [, e]) => sum + e.dataUrl.length, 0);
        while (total > MAX_MEDIA_CACHE_BYTES && entries.length > 1) {
          const [oldUrl, old] = entries.shift();
          total -= old.dataUrl.length;
          delete next[oldUrl];
        }
        await storage.set({ newsMediaCache: next });
        return { ok: true, dataUrl };
      } catch {
        return { ok: false, reason: 'network' };
      }
    }

    return { getNews, getNewsMedia };
  }

  const ARCHIVE_URL = 'https://advance-technologies-foundation.github.io/clio-news-feed/';
  root.ClioNewsFetcher = { createNewsFetcher, DEFAULT_FEED_URL, MEDIA_HOSTS, FEED_HOSTS, ARCHIVE_URL };
})(typeof self !== 'undefined' ? self : globalThis);

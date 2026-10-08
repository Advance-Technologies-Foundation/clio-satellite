// Anonymous usage statistics for the background service worker: which Clio satellite menu items
// are used and how often people use developer news. Sent to Google Analytics 4 with the
// Measurement Protocol (a plain HTTPS POST); no remote script is loaded.
// Loaded with importScripts() in background.js (classic worker), so it exposes a global.
//
// Privacy: only events and parameters from EVENTS are sent, and every value must be a short
// identifier (menu item name, news id, page type). Site addresses, user names, profile names and
// page contents are never sent. The client id is a random UUID, not tied to the Google account.
(function (root) {
  const ENDPOINT = 'https://www.google-analytics.com/mp/collect';
  const SESSION_IDLE_MS = 30 * 60 * 1000;
  const VALUE = /^[A-Za-z0-9_.-]{1,64}$/;

  // event name → allowed parameter names
  const EVENTS = {
    menu_open: ['menu'],
    menu_click: ['menu', 'item'],
    news_open: ['surface'],
    news_cta_click: ['surface', 'news_id'],
    news_video_play: ['surface', 'news_id'],
    news_mark_all_read: ['surface'],
    news_archive_open: ['surface'],
    news_topics_open: ['surface'],
    news_toggle: ['enabled'],
  };

  function cleanParams(name, params) {
    const allowed = EVENTS[name];
    if (!allowed) return null;
    const out = {};
    for (const key of allowed) {
      let value = params?.[key];
      if (value === undefined) continue;
      if (typeof value === 'boolean') value = String(value);
      if (typeof value !== 'string' || !VALUE.test(value)) return null;
      out[key] = value;
    }
    return out;
  }

  // local: { get(defaults) → Promise<object>, set(object) → Promise } for chrome.storage.local
  // syncGet: (defaults) → Promise<object> for chrome.storage.sync
  function createAnalytics({ fetchFn, local, syncGet, config, version = '', now = () => Date.now(), randomId = () => crypto.randomUUID() }) {
    const configured = () => Boolean(config?.measurementId && config?.apiSecret);

    async function identity() {
      const stored = await local.get({ analyticsClientId: '', analyticsSession: null });
      const time = now();
      const clientId = stored.analyticsClientId || randomId();
      const last = stored.analyticsSession;
      const session = last && time - last.lastAt < SESSION_IDLE_MS
        ? { id: last.id, lastAt: time }
        : { id: String(Math.floor(time / 1000)), lastAt: time };
      await local.set({ analyticsClientId: clientId, analyticsSession: session });
      return { clientId, sessionId: session.id };
    }

    async function track(name, params = {}) {
      if (!configured()) return { ok: false, reason: 'not-configured' };
      const { analyticsEnabled } = await syncGet({ analyticsEnabled: true });
      if (analyticsEnabled === false) return { ok: false, reason: 'disabled' };
      const clean = cleanParams(name, params);
      if (!clean) return { ok: false, reason: 'rejected' };
      const { clientId, sessionId } = await identity();
      const body = {
        client_id: clientId,
        non_personalized_ads: true,
        events: [{
          name,
          params: { ...clean, extension_version: version, session_id: sessionId, engagement_time_msec: 100 },
        }],
      };
      const url = `${ENDPOINT}?measurement_id=${encodeURIComponent(config.measurementId)}&api_secret=${encodeURIComponent(config.apiSecret)}`;
      try {
        await fetchFn(url, { method: 'POST', body: JSON.stringify(body), credentials: 'omit', keepalive: true });
        return { ok: true };
      } catch {
        return { ok: false, reason: 'network' };
      }
    }

    return { track };
  }

  root.ClioAnalytics = { createAnalytics, EVENTS, ENDPOINT };
})(self);

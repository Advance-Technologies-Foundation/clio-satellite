# analytics

**Purpose:** Anonymous usage statistics: which Clio satellite menu items are used and how often people use developer news. Sent to Google Analytics 4 with the Measurement Protocol; on by default, with a "Send anonymous usage statistics" switch in Options.

**Files and public API:**
- `analytics/analytics.js` — classic worker script loaded by `background.js` with `importScripts`; exposes `self.ClioAnalytics = { createAnalytics, EVENTS, ENDPOINT }`. `createAnalytics({ fetchFn, local, syncGet, config, version, now, randomId }).track(name, params)` → `{ ok }` or `{ ok: false, reason: 'not-configured' | 'disabled' | 'rejected' | 'network' }`. Never throws.
- `analytics/config.js` — `self.ClioAnalyticsConfig = { measurementId, apiSecret }`. Empty in git; the release workflow ("Fill analytics config") fills it from the `GA_MEASUREMENT_ID` and `GA_API_SECRET` repository secrets. Empty → nothing is sent, so local and unpacked builds never report.
- `src/analytics.js` — `track(name, params)` for content scripts: `chrome.runtime.sendMessage({ action: 'trackEvent', name, params })`, silent when the extension context is gone.
- `background.js` handles `trackEvent` by calling `analytics.track`. `options.js` sends `news_toggle` directly and owns the `analyticsEnabled` switch.

**Events (allow-list `EVENTS`):** `menu_open {menu}`, `menu_click {menu, item}` (menuBuilder: `navigation` items by script name, `actions` items by action name); `news_open {surface}`, `news_cta_click {surface, news_id}`, `news_video_play {surface, news_id}`, `news_mark_all_read`, `news_archive_open`, `news_topics_open` (`{surface}`), from `newsCards.trackPanelClicks(panel, surface)` and the open handlers in `loginStrip`/`shellIndicator`; `news_toggle {enabled}` from Options. Every event also gets `extension_version`, `session_id` and `engagement_time_msec`.

**Key decisions:**
- Privacy by construction: unknown events and unknown parameters are dropped, and every value must match `^[A-Za-z0-9_.-]{1,64}$`, so a URL, a host name with a scheme, or a name with spaces can never be sent by accident.
- Measurement Protocol from the service worker instead of `gtag.js`: MV3 forbids remote code, and the Creatio page CSP cannot block it.
- `client_id` is a random UUID in `chrome.storage.local.analyticsClientId` (per browser profile, not synced); `session_id` lives in `analyticsSession` and restarts after 30 minutes without events.
- Setting: `chrome.storage.sync.analyticsEnabled`, default `true`; only an explicit `false` stops sending (same rule as `newsEnabled`).
- News panel clicks are tracked with one capture-phase listener per panel (the video poster stops propagation of its click); head and foot controls declare their event in `data-track`.

**Dependencies:** `fetch` and `chrome.storage` (injected for tests); no extra manifest permission (`<all_urls>`).

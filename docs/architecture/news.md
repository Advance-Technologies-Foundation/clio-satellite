## news (src/news/*, news/newsFetcher.js, styles/news.css)

**Purpose:** Show developer news from the public `clio-news-feed` on the Creatio login page (strip + panel) and inside Creatio (dot, news column of the menu panel, peek for critical items), with read state shared across surfaces, tabs and devices. Product spec: `docs/features/developer-news.md`.

**Modules and public API:**
- `src/news/newsCore.js` — pure rules, no DOM/chrome:
  - `validateFeed(json) → { items, refreshHours, movedTo }`: drops malformed items one by one, unknown schema → empty; only `https` CTA links on `CTA_HOSTS`, media on `MEDIA_HOSTS`, YouTube by 11-char id; clips title (60) and body (140); fills `audiences` and `surfaces` defaults; no trending on critical items.
  - `selectVisible(items, { now, surface, audiences, extensionVersion, read, firstShown, skipped })`: date window, surface, role filter (critical items bypass it), `minVersion`, onboarding skips; sorts critical → trending → newest; max 5.
  - `isUnreadSignal`, `unreadItems`, `isTrendingNow`: unread = not read and, for trending items, inside the window (`hours` from `firstShown`, `until` absolute, earliest wins).
  - `onboardingSkip(items, { now })`: first run of a new user keeps the 3 newest items of the last 30 days, skips the rest (never critical).
  - `shouldShowDot` (noticed / 7 days / 10 Shell loads for regular items), `pickPeek` (critical, once per item, once a day, Shell only), `pickAutoExpand` (critical, once per item).
  - `youtubeEmbedUrl`, `youtubeWatchUrl`, `youtubePosterUrl`: all YouTube URLs are built from the validated id.
- `src/news/newsStore.js` — `chrome.storage` and messaging. `loadState`, `markRead`, `recordFirstShown`, `markAutoOpened`, `recordDotShown`, `markNoticed`, `completeOnboarding`, `pruneTo`, `onNewsStorageChange`, `requestFeed`, `requestMedia`, `openOptions`, `openNewsArchive`. Never throws; a dead extension context means "no news".
- `src/news/newsModel.js` — `loadSurface(surface) → { visible, unread, ctx, state } | null`; runs onboarding on the first feed of a profile and prunes state of items that left the feed.
- `src/news/newsCards.js` — `renderCards(list, items, ctx, { onVideoStart })`; text via `textContent` only; images and posters through `requestMedia` (data URLs from the worker).
- `src/news/videoDialog.js` — `openVideoDialog(media, { returnFocus })`, `closeVideoDialog()`: modal on `<html>`, focus trap, Esc, iframe removed on close; falls back to "Watch on YouTube" on a CSP violation or a player `onError` (postMessage protocol, no `iframe_api` script).
- `src/news/loginStrip.js` — `initLoginNews()`: waits for `.creatio-satelite-login-profiles-container` (built by `login/login.js`), inserts the strip after it (not shown when the page loads with nothing unread; once shown it stays until reload, `ui.seen`), re-renders on storage changes and every 10 min.
- `src/news/shellIndicator.js` — `attachShellNews({ menuButton, menuContainer, menuBody, buttonWrapper, pageType, onLayoutChange })`, called by `menuBuilder.createScriptsMenu()` on every (re)build: dot in the button wrapper, the news column `.csl-news-column` prepended to `menuBody` (left of the navigation items, shown only while there are unread news; `onLayoutChange` is called whenever it appears or disappears so the open menu is placed again), peek in the extension container. `newsListMaxHeight({ viewportHeight, columnTop, chromeHeight })` caps the list.
- `news/newsFetcher.js` — classic script for the service worker (`importScripts` in `background.js`), exposes `self.ClioNewsFetcher.createNewsFetcher({ fetchFn, storage, syncGet, now })` with `getNews()` and `getNewsMedia(url)`, plus `ARCHIVE_URL`.

**Background messages:** `getNews` → `{ ok, raw }`; `getNewsMedia { url }` → `{ ok, dataUrl }`; `openNewsArchive` → opens the public feed site in a new tab.

- `options.js` → `initNewsDebug()` / `renderNewsDebug()`: the Troubleshooting part of the Developer news card. It reads `newsFeedCache` and the sync state directly and mirrors the visibility checks of `newsCore.selectVisible()` / `isUnreadSignal()` in plain words (options.js is not part of the content bundle, so the logic is duplicated on purpose and kept to the user-visible reasons). Download news now = remove the caches + `getNews` message; Mark all as unread = reset the read-state keys below.

**Storage:** sync — `newsEnabled` (default `true` since v2.8; `newsStore.loadState()` and `newsFetcher.getNews()` treat only an explicit `false` as off), `newsAudiences`, `newsRead`, `newsFirstShown`, `newsAutoOpened` (+ `lastPeekAt`), `newsSkipped`, `newsOnboardedAt`; local — `newsNoticed`, `newsFeedCache`, `newsMediaCache`.

**Key decisions:**
- One bundle, two surfaces: `content.js` already runs on login pages, so `src/index.js` calls `initLoginNews()` there instead of returning; validation and state logic exist once.
- The worker fetches the feed (TTL 6 h or `refreshHours`, `ETag`, ≤ 64 KB, last good copy kept) so the Creatio page's CSP/CORS never apply and the page never sees the feed URL. It stores raw text; content scripts validate it.
- Images are fetched by the worker and returned as `data:` URLs (≤ 300 KB, png/jpeg/webp, cache ≤ 2 MB) because page `img-src` CSP of self-hosted instances may block them.
- `movedTo` is followed only to `FEED_HOSTS`; after three failed refreshes the compiled URL is used again.
- Every state write is followed by an explicit re-render; `storage.onChanged` additionally syncs other tabs.
- The news column is part of the menu panel, not a flyout beside it: it opens and moves with the menu, `adjustMenuPosition` keeps the whole panel on screen, and the outside-click logic needs nothing extra. It replaced the `What's new` row + flyout, which needed a click to see the news and marked them read when the menu closed; now only `Mark as read` (or starting a video) marks them read, so news are not lost by closing the menu, and a read column does not keep taking space. The open-book icon in the menu header (built by `menuBuilder`) leads to all news.
- The news list uses a slim rounded scrollbar in the colours of the panel (`::-webkit-scrollbar*` in `styles/news.css`, light and `--dark` variants). `scrollbar-width`/`scrollbar-color` are deliberately not set: in Chrome they override the `::-webkit-scrollbar` rules.
- Column height follows its cards: when the menu opens with the column (and on window resize) `fitColumnHeight()` caps the list so the whole column is at most `NEWS_MAX_SHARE` (80%) of the window height and never past its bottom edge (`newsListMaxHeight`, min 120 px). Few news → no scrollbar; many → only the list scrolls, head and foot stay. CSS keeps `calc(80vh - 96px)` as the fallback.
- CSS: `.csl-news-*` classes; Shell rules carry `!important` because Creatio styles are aggressive, and `[hidden]` rules come after them so `hidden` still wins.
- Not implemented yet (see spec): the extension-page player fallback (step 2, needs a spike), reactions (needs the API).

**Dependencies:** `newsCore` ← `newsStore` ← `newsModel` ← `newsCards`/`videoDialog` ← `loginStrip`/`shellIndicator`; `menuBuilder.js` imports `attachShellNews`; `index.js` imports `initLoginNews`.
- Usage statistics: `news_open` when the user opens a panel (login) or opens the menu while the news column is shown (Shell); the menu book icon sends `news_archive_open`; and panel clicks via `newsCards.trackPanelClicks(panel, surface)` (card links, videos, `data-track` controls). See `analytics.md`.

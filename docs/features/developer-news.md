# Developer News

**Status:** design in progress (v1 mockups), not implemented yet.
**Mockups** (open in a browser, no build step):
- [`mockup.html`](../design/developer-news/mockup.html) — login page strip.
- [`shell-mockup.html`](../design/developer-news/shell-mockup.html) — indicator inside Creatio (Clio satellite button, menu row, flyout, peek card).

## Goal

Show short news about development tools (clio, Creatio dev tooling, webinars, breaking changes) to extension users in two places:

1. **Login page** — a strip under the Clio Satellite profile row. People are about to start work and have a second to read.
2. **Inside Creatio (Shell and Configuration)** — on the Clio satellite button. People are working, so the signal is much quieter.

The news are managed on a shared server, so publishing or removing an item does not require an extension release. Both surfaces read the same feed and share one read state.

Constraints:
- Takes almost no space: one 32 px line on the login page, one 8 px dot inside Creatio.
- The login line cannot be collapsed, so users can always see that something new arrived.
- The feed panel is collapsed by default and opens on click.
- Follows the announcement patterns of large products (see Research) and avoids banner blindness.

## Login surface

### Collapsed strip (always visible)

A 32 px button, full width of the login form, placed 6 px under the profile selector row.

| Part | Content |
|---|---|
| Icon | 16 px news icon; pulses 3 times when there are unread items, then stops |
| Counter pill | `N new`, shown only when there are unread items |
| Headline | Title of the newest unread item; when all are read: `What's new · <latest title>` |
| Chevron | Rotates when the panel is open |

### Expanded panel

Attached under the strip (no gap, shared border).

- Header: `Dev tools news` + `Mark all as read`.
- Item list: up to 3 cards visible (max-height 252 px), the rest scrolls. Max 5 active items.
- Card: unread dot · type tag · date · title (1–2 lines) · body (clamped to 2 lines) · one CTA link `<label> →`.
- Footer: `All news →` (full changelog page) and `Turn off in options`.

### States

| State | Trigger | Look |
|---|---|---|
| `unread` | At least one item not seen | Orange tint (`#fff3ee`, border `#ffd7c7`), orange pill, pulsing icon |
| `read` | All items seen | White background, grey text, no pill |
| `critical` | An unseen item with `priority: "critical"` | Red tint, red pill; panel auto-expands **once** for that item |
| `none` | Feed disabled, empty, invalid or never loaded | Nothing rendered; page looks as today |

### Login read rules

- Opening and then closing the panel marks every visible item as read (Facebook pattern: the badge clears after the list was opened, not per item).
- `Mark all as read` marks everything read immediately.
- A critical item that was auto-expanded once is remembered, so it never auto-expands again (on either surface).

## Shell surface

Inside Creatio the user is in the middle of a task. The rule here: **inform, never interrupt**. The signal escalates in levels, and normal news never go above level 2.

| Level | When | UI |
|---|---|---|
| 0 · nothing new | No unread items | Button looks exactly as today |
| 1 · ambient | Unread items, menu not opened since they arrived | 8 px dot (10 px with a 2 px ring in the toolbar colour) on the top-right corner of the `Clio satellite` button. No number. Orange; red when a critical item is unread |
| 2 · in context | Menu opened | First menu row `What's new` with a count pill and the newest headline as a second line; separator under it. Click opens the flyout |
| 3 · critical only | Unread critical item, peek not shown yet | One-time peek card under the button group |

### Dot on the button (level 1)

- Material "small badge": no count, because the exact number does not matter and a number reads as a to-do list.
- `aria-label` of the button becomes `Clio satellite, N unread news`.
- **Clears when the menu is opened** (items become *noticed*, not *read*). The count stays in the `What's new` row until the flyout is opened.
- **Decays when ignored:** the dot stops showing for an item 7 days after its first display or after 10 Shell page loads, whichever comes first. The item stays in the `What's new` row. This prevents a permanent dot that people learn to ignore.
- No pulse or animation inside Shell.

### What's new row and flyout (level 2)

- The row is shown only while there are unread items; when everything is read it disappears and the menu looks as today. All news stay reachable from Options and the `All news →` page.
- The flyout uses the same glass as the menu (`--crt-glass-color-dark-800`), 320 px wide, opens beside the menu when there is room and over it otherwise (same logic as `adjustMenuPosition`).
- Cards are the same as on the login page, in a dark variant: unread dot, tag, date, title, body, one CTA.
- Closing the flyout (click outside, Esc, menu closes) marks the shown items read. `Mark all as read` does it immediately.
- CTA links open in a new tab and close the menu.

### Peek card (level 3)

- Only for `priority: "critical"`, only once per item across both surfaces (if the login panel already auto-expanded it, no peek), and at most one peek per day.
- 300 px glass card with a red border, anchored under the button group: tag, title, body, `Read` (opens menu + flyout) and `Dismiss`.
- `role="status"`, `aria-live="polite"`; it never takes focus.
- Auto-hides after 10 s; the timer pauses on hover and restarts with 3 s on mouse leave. `Dismiss` hides it; the red dot stays until the menu is opened.
- Not shown on the Configuration page while a schema designer is open (`pageType === "configuration"`), only on Shell.

## Shared state model

One store for both surfaces, so reading news on the login page clears the dot inside Creatio and vice versa.

| Key (`chrome.storage`) | Area | Content |
|---|---|---|
| `newsFeedCache` | `local` | `{ fetchedAt, etag, raw }` — last valid feed as text, max 64 KB |
| `newsRead` | `sync` | `{ [id]: readAt }` — pruned to ids present in the feed |
| `newsFirstShown` | `sync` | `{ [id]: firstShownAt }` — when this user first saw the item on any surface; drives the trending window |
| `newsNoticed` | `local` | `{ [id]: { noticedAt, shellLoads } }` — for the Shell dot and its decay |
| `newsAutoOpened` | `sync` | ids of critical items already auto-expanded or peeked, plus `lastPeekAt` |
| `newsMediaCache` | `local` | `{ [url]: { dataUrl, fetchedAt } }` — images and posters, ≤ 2 MB total, pruned with the feed |
| `newsEnabled` | `sync` | boolean, default `true` |

- `read` is global (sync), `noticed` is per device (local): a dot on a second laptop is fine, a re-appearing unread item is not.
- All open tabs react to `chrome.storage.onChanged`, so reading in one tab clears the dot in others without a reload.

## Trending news

The news administrator can mark an item as **trending**: it is shown as unread (counter, tint, dot, `What's new` row, unread dot on the card) only during a time window the administrator sets. When the window ends the item goes quiet by itself: it stays in the list until `expiresAt`, but looks read and no longer counts anywhere, even if the user never opened it.

This exists because some news are only worth attention for a short time (a webinar next week, a release in its first days), and an unread marker that outlives the moment teaches people to ignore markers.

### Item kinds

| Kind | Unread signal shown | Ends when |
|---|---|---|
| Regular (no `trending`) | Until the user reads it | Read, or `expiresAt` |
| Trending | Only inside the trending window | Read, window over, or `expiresAt` — whichever comes first |

### How the administrator sets the window

`trending` is an object with one or both fields:

| Field | Meaning | Use for |
|---|---|---|
| `until` | Absolute end, ISO date-time in UTC. Same moment for everybody | Things tied to a date: a webinar (until it starts), a migration deadline, a promo |
| `hours` | Relative length, counted per user from the moment **that user** first saw the item (`newsFirstShown`) | Releases and tips: someone who logs in once a week still gets the full window |

- Both set: the window ends at whichever comes first.
- `trending: {}` or a window that already ended at publish time is a validation error for that item (dropped, logged in the feed CI).
- Limits enforced by the client: `hours` 1–720 (30 days); `until` not later than `expiresAt`.
- Feed-level default: `defaults.trendingHours` applies when an item has `"trending": true` instead of an object, so the administrator can mark items trending with one word and tune the length in one place.

Suggested windows (guidance for administrators, not enforced):

| Item | Window |
|---|---|
| Release | `hours: 72`–`168` |
| Tip | `hours: 48` |
| Webinar / event | `until` = event start |
| Breaking change | Do not use trending; critical items stay unread until read |

`priority: "critical"` and `trending` are mutually exclusive: a breaking change must not go quiet on its own. The validator rejects items with both.

### How it looks

- While trending, the card shows a small `Trending` chip (arrow-up icon) next to the type tag, and trending items sort above regular ones, newest first. The collapsed login strip and the Shell `What's new` row use the newest trending item as their headline when there is one.
- No countdown is shown to the user. The window is an editorial tool, not urgency marketing.
- After the window: no chip, no unread dot, normal sort by date, not counted in `N new`, no Shell dot. The item is **not** written to `newsRead`; if the administrator extends the window, it becomes unread again for users who never read it.
- The Shell dot decay (7 days / 10 loads) applies only to regular items. For trending items the trending window is the decay.

### Evaluation

`newsCore.isUnreadSignal(item, { now, read, firstShown })`:

```
if read[item.id]                      → false
if item.trending is absent            → true
start = firstShown[item.id] ?? now    // first render records firstShown
end   = min(item.trending.until, start + item.trending.hours)
return now < end
```

- `now` is the local clock. `until` is absolute UTC, so a skewed client clock shifts the end by the skew. This is accepted: windows are hours or days long.
- `firstShown` is recorded the first time an item is rendered on any surface (strip, row or flyout), not when the feed is fetched, so the relative window starts when the user could actually see it.
- The surfaces re-evaluate on render and every 10 minutes while a page is open, so a window that ends while Creatio is open clears the dot without a reload.

## Media: images and YouTube videos

Any item may carry **one** optional `media` block: an image or a YouTube video. Most items will have none, and the card then looks exactly as described above.

### Where media appears

- Only in the expanded login panel and in the Shell flyout. Never in the collapsed strip, the `What's new` row or the peek card: those stay one line of text.
- Under the title, above the body, full card width, 120 px high, image cropped to fill (`object-fit: cover`, source 16:9), 4 px radius.
- Nothing is downloaded until the panel or flyout is opened for the first time, so the login page and Shell load exactly as fast as without news.
- If the media fails to load, it is left out silently; the card falls back to text only.

### Image

```json
"media": { "type": "image", "url": "https://news.example.com/img/clio-8-1.webp", "alt": "Terminal output of clio pushw showing two changed packages" }
```

- `url`: `https://`, on the feed host (same origin as `news.json`), `png`, `jpg` or `webp`, ≤ 300 KB, recommended 640×360.
- `alt` is required (≤ 120 chars); it is the accessible name and the fallback text.
- Clicking the image opens the item CTA when there is one; otherwise it does nothing (no lightbox in v1).

### YouTube video

```json
"media": { "type": "youtube", "videoId": "dQw4w9WgXcQ", "title": "Composable apps for Freedom UI", "poster": "https://news.example.com/v1/media/webinar.webp", "player": "embed", "start": 95 }
```

| Field | Required | Rules |
|---|---|---|
| `videoId` | yes | Exactly 11 characters `[A-Za-z0-9_-]`. Full URLs are not accepted; the client builds every YouTube URL itself, so a video entry cannot point anywhere else |
| `title` | yes | ≤ 120 chars; accessible name of the poster and the player dialog title |
| `poster` | no | Same rules as an image `url`. Fallback: `https://i.ytimg.com/vi/<id>/hqdefault.jpg` (a request to Google when the panel opens, so prefer an own poster) |
| `player` | no | `embed` (default): play inside Creatio in the built-in player. `link`: open youtube.com in a new tab |
| `start` | no | Start offset in seconds (0–36000) |

The card shows a **poster with a play button and the duration-free YouTube label**. The video never plays inside the 300 px card.

### Built-in player

Clicking the poster of an `embed` video opens a **player dialog** over the current page (login or Shell):

- Centered modal, 16:9, width `min(960px, 92vw)`, dark backdrop (`rgba(0,0,0,.72)`), title above the video, `Watch on YouTube ↗` and a close button. Same glass style as the Shell menus.
- Opens from a click, so it autoplays with sound (`autoplay=1`). Esc, the close button or a backdrop click close it.
- Focus moves into the dialog and is trapped there; on close it returns to the poster. `role="dialog"`, `aria-modal="true"`, labelled by the title.
- On close the player iframe is **removed**, so audio stops and nothing keeps running in the CRM page.
- The news panel/flyout stays open underneath; the item is marked read when the video starts.
- Uses `https://www.youtube-nocookie.com/embed/<id>?autoplay=1&rel=0&playsinline=1&start=<start>&enablejsapi=1&origin=<page origin>` with `referrerpolicy="strict-origin-when-cross-origin"` and `allow="autoplay; encrypted-media; picture-in-picture; fullscreen"`. Nothing is requested from YouTube until the user clicks play (the poster comes from our host).

#### Why it is not trivial, and how it is solved

1. **Host CSP.** A self-hosted Creatio may send `Content-Security-Policy: frame-src` that does not list YouTube; then an iframe added to the page is blocked.
2. **YouTube's referrer check.** Since 2025 the embedded player refuses to play without an HTTP `Referer` (error 153, "Video player configuration error"). An embed whose referrer is missing or unusual can fail.

The dialog therefore tries three ways, in order, and stops at the first that works:

| Step | How | Works when | Detected failure |
|---|---|---|---|
| 1. Direct embed | `youtube-nocookie` iframe in the dialog, inside the Creatio page. Referer = the Creatio origin, which YouTube accepts | Host CSP allows `frame-src` for YouTube or has no `frame-src` | `securitypolicyviolation` event for the frame URL, or no `onReady` from the player within 8 s |
| 2. Extension player frame | The dialog hosts an iframe of `chrome-extension://<id>/news/player.html` (web-accessible). Chrome exempts extension resources from the page's CSP. `player.html` embeds the `youtube-nocookie` iframe itself | Host CSP blocks YouTube, and YouTube accepts the extension origin as referrer | Player `onError` (e.g. 150/153) via postMessage, or no `onReady` within 8 s |
| 3. Link out | The dialog shows the poster and "This video can't play here. Watch on YouTube ↗" | Always | — |

- Readiness and errors are read with YouTube's **postMessage protocol** (`enablejsapi=1`, listen for `onReady` / `onError` messages). The extension does **not** load YouTube's `iframe_api` script: that would be remote code, which MV3 forbids.
- The working step is remembered per origin (`newsPlayerMode` in `storage.local`), so the next video on the same Creatio instance opens directly in the right mode.
- Step 2 is a spike: YouTube's acceptance of a `chrome-extension://` referrer must be verified before release. If it fails, step 2 is dropped and the chain is 1 → 3.
- Videos whose owner disabled embedding return error 150/101 in step 1; the dialog goes straight to step 3.
- `player: "link"` skips the dialog entirely (for long webinars where YouTube's own page with chapters and comments is better).

### How media is loaded

Images are fetched by the **service worker**, not by an `<img src>` in the page:

1. The surface asks the background `getNewsMedia(itemId)` when the panel opens.
2. The worker checks the URL against the allowlist (feed host, `i.ytimg.com`), fetches it, checks `Content-Type` and size, and returns a `data:` URL.
3. The result is cached in `chrome.storage.local` (`newsMediaCache`, keyed by URL, pruned with the feed; total ≤ 2 MB).

This avoids the page's `img-src` CSP, which on some self-hosted Creatio instances blocks external images, and keeps the page from learning the feed host.

### Content guidelines for media

- Use media only when it explains something faster than text: a screenshot of new UI, a terminal output, a recorded webinar.
- At most two items with media at a time, so the panel stays scannable.
- No text baked into images that is needed to understand the news; the title and body must work alone.

### Item types

| `type` | Tag | Colour |
|---|---|---|
| `release` | Release | orange |
| `tip` | Tip | blue |
| `event` | Webinar / Event | violet |
| `breaking` | Breaking | red |

## Content guidelines

- **Title ≤ 60 chars, benefit first.** "Deploy packages 2× faster with clio 8.1", not "clio 8.1 released". The title doubles as the teaser in the collapsed strip.
- **Body ≤ 140 chars**, one sentence, plain text.
- **One CTA per item**, a verb: "Read release notes", "Register", "See migration steps".
- **No images.** The login page is a task screen.
- **Max 5 active items, max 1 critical.** Prefer one useful item per week over several per day.
- **Always set `expiresAt`** (default 30 days); expired items are dropped by the client.
- **Use `trending` for anything whose value fades fast** (see Trending news). Prefer `hours` for releases and tips, `until` for dated events.

## Feed format

Static JSON served over HTTPS at `https://<news-domain>/v1/news.json`. How it is authored, built, scheduled and hosted is described in [`developer-news-hosting.md`](developer-news-hosting.md). Optional feed-level `refreshHours` (1–24, default 6) overrides the client refresh interval.

```json
{
  "schemaVersion": 1,
  "items": [
    {
      "id": "2026-10-clio-8-1",
      "type": "release",
      "priority": "normal",
      "title": "Deploy packages 2× faster with clio 8.1",
      "body": "pushw now uploads only the packages that changed since the last deploy.",
      "cta": { "label": "Read release notes", "url": "https://example.com/clio/8.1" },
      "publishedAt": "2026-10-06",
      "expiresAt": "2026-11-06",
      "minExtensionVersion": "2.7",
      "surfaces": ["login", "shell"],
      "trending": { "hours": 72 }
    },
    {
      "id": "2026-10-webinar-composable",
      "type": "event",
      "title": "Live: building composable apps for Freedom UI",
      "cta": { "label": "Register", "url": "https://example.com/webinar" },
      "publishedAt": "2026-10-07",
      "expiresAt": "2026-10-22",
      "trending": { "until": "2026-10-21T14:00:00Z" },
      "media": { "type": "youtube", "videoId": "dQw4w9WgXcQ", "title": "Composable apps for Freedom UI" }
    }
  ],
  "defaults": { "trendingHours": 72 }
}
```

| Field | Required | Rules |
|---|---|---|
| `id` | yes | Unique, stable; used for read state |
| `type` | yes | `release` \| `tip` \| `event` \| `breaking` |
| `priority` | no | `normal` (default) \| `critical` |
| `title` | yes | Plain text, ≤ 60 chars (longer is truncated) |
| `body` | no | Plain text, ≤ 140 chars |
| `cta.label` / `cta.url` | no | `https://` only, host must be in the allowlist |
| `publishedAt` | yes | ISO date; items sorted newest first |
| `expiresAt` | no | ISO date; item hidden after it |
| `minExtensionVersion` | no | Item hidden on older extension versions |
| `trending` | no | `true` (uses `defaults.trendingHours`) or `{ "hours"?: 1–720, "until"?: ISO UTC }`; not allowed with `priority: "critical"` |
| `media` | no | One of: `{ "type": "image", "url", "alt" }` or `{ "type": "youtube", "videoId", "title", "poster"?, "player"?, "start"? }` (see Media) |
| `surfaces` | no | `["login", "shell"]` (default both). Use `["login"]` for news that are not worth a dot inside Creatio |

Feed-level `defaults.trendingHours` (optional, 1–720, default 72) is used for `"trending": true`.

Unknown fields are ignored. Items failing validation are dropped individually; a feed with an unknown `schemaVersion` is ignored as a whole.

## Architecture (planned)

### Where the code runs today

- `content.js` is the esbuild bundle of `src/` (ES modules). It is injected on **all** pages, login included, but `src/index.js` returns early on login pages.
- `login/login.js` is a plain script (IIFE, not bundled) that builds the profile row.
- `background.js` is a plain service worker (not bundled).

### Proposed layout

```
news.json (GitHub Pages)
   │  GET, no params, no cookies, If-None-Match
   ▼
background.js  "getNews" and "getNewsMedia" handlers
   TTL 6 h → fetch → size check (≤ 64 KB) → JSON.parse → store raw in newsFeedCache
   on error: keep last cache
   │
   ▼  chrome.runtime.sendMessage / storage.onChanged
src/news/newsCore.js        pure: validateFeed, selectVisible, isUnreadSignal,
                            unreadItems, shouldShowDot, shouldPeek,
                            markRead, markNoticed, markFirstShown
src/news/newsStore.js       chrome.storage wrapper, onChanged subscription
src/news/loginStrip.js      login surface: waits for .creatio-satelite-login-profiles-container
src/news/shellIndicator.js  shell surface: dot, What's new row, flyout, peek
src/news/newsCards.js       shared card renderer (textContent only), light/dark variants,
                            media block (poster + play button, lazy on first open)
```

- **One bundle, two surfaces.** The news code lives in `src/news/` and ships inside `content.js`. `src/index.js` mounts `loginStrip` on login pages (instead of returning immediately) and `shellIndicator` from `menuBuilder` when the button group is built. `login/login.js` stays as is; the strip attaches under its container. This avoids duplicating validation and state logic in a non-bundled script.
- **Fetch in the service worker, not in the content script.** The Creatio page's CSP and CORS do not apply, and the page never sees the feed URL.
- **Background stores raw text; content validates.** Validation lives only in `newsCore.js` (unit-tested once). The worker checks size and JSON syntax only. This keeps `background.js` free of a bundling step.
- **Refresh by TTL when a Creatio page opens** (cache older than 6 h → refetch). No `alarms` permission needed.
- **Render with `textContent` only.** No HTML from the feed; CTA links must be `https://` and on the allowlist in `newsCore.js`.
- **Media through the worker.** Images and posters are returned as `data:` URLs by `getNewsMedia`; YouTube URLs are built from a validated `videoId`.
- **Player:** `src/news/videoDialog.js` (dialog, focus trap, fallback chain, postMessage listener) and `news/player.html` + `news/player.js` (extension page for step 2, listed in `web_accessible_resources` with `use_dynamic_url: true` so other sites cannot frame it by a fixed URL).
- **Cross-tab sync** through `chrome.storage.onChanged`; both surfaces re-render from the store.
- **Shell integration points:** the dot is a child of `.scripts-menu-button`; the `What's new` row is prepended in `buildNavMenu()`; the flyout is a sibling of `.scripts-menu-container` positioned with `adjustMenuPosition`. `monitorButtons` re-creates the button group, so the indicator must re-mount idempotently.
- **Options page:** toggle `Show developer news` (`newsEnabled`, default on). When off, no request is made and nothing renders on either surface.
- **Styles:** login in `styles/login.css` (`--csl-*` variables); Shell in `menu-item.css`, reusing the glass tokens of the menus.

## Chrome Web Store

- Allowed: MV3 policy forbids remote **code**, but allows fetching remote configuration/data when all logic ships in the package. The feed is plain-text data.
- `web_accessible_resources` gains `news/player.html` (and its script), needed to play videos on Creatio instances whose CSP blocks YouTube frames. Justify in the release notes and in `CLAUDE.md`.
- No new permissions: `host_permissions: <all_urls>` already covers the fetch (feed, images, `i.ytimg.com` posters), `storage` is already declared.
- Images are explicitly allowed remote resources under MV3 ("remote resources that are not used to evaluate logic, such as images"). YouTube videos play in a YouTube iframe (a web page, not extension code); YouTube's JS API script is never loaded.
- Privacy policy must mention: images are loaded from the news host only when the news panel is opened; YouTube posters may be loaded from `i.ytimg.com` (Google) unless the item has its own poster; playing a video loads the YouTube player from `youtube-nocookie.com` (no cookies until playback), only after the user clicks play; "Watch on YouTube" goes to youtube.com.
- Must be disclosed in the release notes and the privacy policy (`docs/PRIVACY_POLICY.md`): feed URL, refresh interval, no user data sent, how to turn it off.
- Draft release-note lines:
  - *"Added a collapsible developer news strip under the login profile selector."*
  - *"Added an unread-news dot to the Clio satellite button and a What's new entry at the top of its menu that opens the news list."*
  - *"News items can include an image or a YouTube video. Videos play in a built-in player dialog (youtube-nocookie.com) after the user clicks play, or open on youtube.com if the page does not allow embedded video."*
  - *"News are loaded as plain text from https://… every 6 hours; no user data is sent. News can be turned off in Options."*
- When the feed domain is chosen, add it to the permission justification in `CLAUDE.md` and the other agent instruction files.

## Tests (planned)

- Unit (`newsCore`): `validateFeed` (valid, missing fields, bad URL scheme, unknown schema, oversize text), `selectVisible` (expiry, min version, `surfaces`, sort, limit), `unreadItems`, `isUnreadSignal` (regular vs trending; `hours` from first shown; `until`; both → earliest; window over → quiet but not read; window extended → unread again), `validateFeed` trending rules (`{}`, out-of-range hours, `until` after `expiresAt`, trending + critical), `shouldShowDot` (noticed, 7-day and 10-load decay for regular items only), `validateFeed` media rules (image host not the feed host, missing `alt`, bad `videoId`, full YouTube URL instead of id, two media blocks), `shouldPeek` (critical only, once per item, once per day, not on configuration).
- Unit (`newsStore`): read state pruning, `onChanged` re-render.
- Unit (`videoDialog`): fallback chain (CSP violation → step 2; `onError` 153 → step 3; 150 → step 3; timeout), remembered mode per origin, iframe removed on close, focus returns to the poster.
- Unit (`background` media handler): allowlist, wrong `Content-Type`, oversize image, cache hit, cache pruning.
- E2E (mock, feed served by `tests/e2e/server.js`): login strip four states, expand/collapse, mark all as read, persistence across reload; Shell dot appears and clears on menu open, `What's new` row opens the flyout, closing marks read, peek shows once and not again after reload; reading on login clears the Shell dot; a trending item with an ended window shows no counter, chip or dot (clock mocked with `page.clock`); media: no image request before the panel opens, image shown after, broken image falls back to text, YouTube `embed` card opens the dialog with a `youtube-nocookie` iframe (network stubbed), Esc closes it and removes the iframe, a page served with `frame-src 'self'` falls back to the extension player frame, `player: "link"` opens a new tab; toggle off in Options removes both.

## Research

All large products use the same two-level pattern: a small persistent indicator plus details on click. They differ in signal strength and in when the signal clears.

| Product | Indicator | Clears | What we take |
|---|---|---|---|
| Facebook | Red counter on the bell | When the list is opened | Counter clears on open |
| X | Blue dot on the tab, "See new posts" pill | When viewed | Pill with a content preview instead of a bare number |
| Google (Material, Workspace) | In-content banner, "What's new" in help | On explicit dismiss | Message inside the task flow; benefit-first title |
| GitHub | Dot on avatar, Feature preview, changelog | When the section is opened | Item types, link to full changelog |
| Linear, Notion, Beamer, Headway | "What's new" badge + dropdown feed | When the feed is opened | Compact cards: tag, date, title, one line, one CTA |

Inside a working app the same products are much quieter: GitHub and Linear show a dot without a number, Chrome puts a "New" chip on a menu entry, and Material's small badge (no label) is meant exactly for "there is something unread, the count does not matter". Nudge guidelines add frequency caps (1–2 nudges per session at most) and say "new" markers should expire after a few releases or once the user has interacted.

Principles:
- **Position beats colour.** Banner blindness is learned for screen regions that were never useful. The strip sits right under the login button, where the eye already goes.
- **Signal only what is new.** A badge that is always on gets ignored (badge blindness).
- **Benefit-first titles** and **one CTA** per item.
- **User control:** can be turned off; items expire; critical items auto-open only once.
- **Inform, never interrupt, while the user works:** dot only, no animation, decay if ignored; a peek card only for breaking changes.

Sources:
- [AnnounceKit — in-app messaging best practices](https://announcekit.app/guides/in-app-messaging-best-practices)
- [Kompassify — banner blindness](https://kompassify.com/blog/banner-blindness-guide)
- [Braze — red dot blindness](https://www.braze.com/resources/articles/beware-red-dot-badging)
- [Atlassian — feature discovery](https://atlassian.design/content/designing-messages/feature-discovery)
- [ReleasePad — changelog widgets](https://www.releasepad.io/blog/in-app-changelog-widgets-build-vs-buy/)
- [Angular Material — badge](https://material.angular.io/components/badge)
- [Material Components — BadgeDrawable (small vs large badge)](https://gitea.com/784622644/material-components-android/src/branch/master/docs/components/BadgeDrawable.md)
- [AppStorys — in-app nudges guide (frequency capping)](https://appstorys.com/blog-In-App-Nudges-Ultimate-Guide)
- [Chrome Web Store — MV3 requirements](https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements)

## Open questions

- Storage and publishing: see [`developer-news-hosting.md`](developer-news-hosting.md) (recommended: git repo + CI + GitHub Pages behind an own domain, Pages CMS later).

- Trending window per user (`hours`) needs `newsFirstShown` in `storage.sync`. With ~5 active items this is far below the sync quota, but should we cap it (e.g. prune ids no longer in the feed)? Current plan: prune on every feed refresh.

- Should the Shell dot be shown on the Configuration page too, or only in Shell?
- Is a 7-day / 10-load decay right for the dot, or should normal news never show a dot at all (row only)?

- Which domain hosts the feed, and who are the first CODEOWNERS (see hosting doc)?
- Do we need per-host targeting (e.g. only for `*.krylov.cloud` stands)?

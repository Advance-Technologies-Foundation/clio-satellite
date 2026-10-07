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
| `newsNoticed` | `local` | `{ [id]: { firstShownAt, shellLoads } }` — for the dot and its decay |
| `newsAutoOpened` | `sync` | ids of critical items already auto-expanded or peeked, plus `lastPeekAt` |
| `newsEnabled` | `sync` | boolean, default `true` |

- `read` is global (sync), `noticed` is per device (local): a dot on a second laptop is fine, a re-appearing unread item is not.
- All open tabs react to `chrome.storage.onChanged`, so reading in one tab clears the dot in others without a reload.

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

## Feed format

Static JSON served over HTTPS. Recommended host: a separate repository published with GitHub Pages, so every news item is a pull request with review and history. Any server or CMS can serve the same format later.

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
      "surfaces": ["login", "shell"]
    }
  ]
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
| `surfaces` | no | `["login", "shell"]` (default both). Use `["login"]` for news that are not worth a dot inside Creatio |

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
background.js  "getNews" handler
   TTL 6 h → fetch → size check (≤ 64 KB) → JSON.parse → store raw in newsFeedCache
   on error: keep last cache
   │
   ▼  chrome.runtime.sendMessage / storage.onChanged
src/news/newsCore.js        pure: validateFeed, selectVisible, unreadItems,
                            shouldShowDot, shouldPeek, markRead, markNoticed
src/news/newsStore.js       chrome.storage wrapper, onChanged subscription
src/news/loginStrip.js      login surface: waits for .creatio-satelite-login-profiles-container
src/news/shellIndicator.js  shell surface: dot, What's new row, flyout, peek
src/news/newsCards.js       shared card renderer (textContent only), light/dark variants
```

- **One bundle, two surfaces.** The news code lives in `src/news/` and ships inside `content.js`. `src/index.js` mounts `loginStrip` on login pages (instead of returning immediately) and `shellIndicator` from `menuBuilder` when the button group is built. `login/login.js` stays as is; the strip attaches under its container. This avoids duplicating validation and state logic in a non-bundled script.
- **Fetch in the service worker, not in the content script.** The Creatio page's CSP and CORS do not apply, and the page never sees the feed URL.
- **Background stores raw text; content validates.** Validation lives only in `newsCore.js` (unit-tested once). The worker checks size and JSON syntax only. This keeps `background.js` free of a bundling step.
- **Refresh by TTL when a Creatio page opens** (cache older than 6 h → refetch). No `alarms` permission needed.
- **Render with `textContent` only.** No HTML from the feed; CTA links must be `https://` and on the allowlist in `newsCore.js`.
- **Cross-tab sync** through `chrome.storage.onChanged`; both surfaces re-render from the store.
- **Shell integration points:** the dot is a child of `.scripts-menu-button`; the `What's new` row is prepended in `buildNavMenu()`; the flyout is a sibling of `.scripts-menu-container` positioned with `adjustMenuPosition`. `monitorButtons` re-creates the button group, so the indicator must re-mount idempotently.
- **Options page:** toggle `Show developer news` (`newsEnabled`, default on). When off, no request is made and nothing renders on either surface.
- **Styles:** login in `styles/login.css` (`--csl-*` variables); Shell in `menu-item.css`, reusing the glass tokens of the menus.

## Chrome Web Store

- Allowed: MV3 policy forbids remote **code**, but allows fetching remote configuration/data when all logic ships in the package. The feed is plain-text data.
- No new permissions: `host_permissions: <all_urls>` already covers the fetch, `storage` is already declared.
- Must be disclosed in the release notes and the privacy policy (`docs/PRIVACY_POLICY.md`): feed URL, refresh interval, no user data sent, how to turn it off.
- Draft release-note lines:
  - *"Added a collapsible developer news strip under the login profile selector."*
  - *"Added an unread-news dot to the Clio satellite button and a What's new entry at the top of its menu that opens the news list."*
  - *"News are loaded as plain text from https://… every 6 hours; no user data is sent. News can be turned off in Options."*
- When the feed domain is chosen, add it to the permission justification in `CLAUDE.md` and the other agent instruction files.

## Tests (planned)

- Unit (`newsCore`): `validateFeed` (valid, missing fields, bad URL scheme, unknown schema, oversize text), `selectVisible` (expiry, min version, `surfaces`, sort, limit), `unreadItems`, `shouldShowDot` (noticed, 7-day and 10-load decay), `shouldPeek` (critical only, once per item, once per day, not on configuration).
- Unit (`newsStore`): read state pruning, `onChanged` re-render.
- E2E (mock, feed served by `tests/e2e/server.js`): login strip four states, expand/collapse, mark all as read, persistence across reload; Shell dot appears and clears on menu open, `What's new` row opens the flyout, closing marks read, peek shows once and not again after reload; reading on login clears the Shell dot; toggle off in Options removes both.

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

- Should the Shell dot be shown on the Configuration page too, or only in Shell?
- Is a 7-day / 10-load decay right for the dot, or should normal news never show a dot at all (row only)?

- Feed host: GitHub Pages in a separate repo, or an internal server?
- Who can publish news (repo maintainers, reviewers)?
- Full changelog page for `All news →`: a GitHub Pages page next to the feed?
- Do we need per-host targeting (e.g. only for `*.krylov.cloud` stands)?

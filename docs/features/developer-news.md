# Developer News Strip

**Status:** design approved as a starting point (v1 mockup), not implemented yet.
**Mockup:** [`docs/design/developer-news/mockup.html`](../design/developer-news/mockup.html) — open in a browser, click the strip, switch scenarios.

## Goal

Show short news about development tools (clio, Creatio dev tooling, webinars, breaking changes) on the Creatio login page, right under the Clio Satellite profile row. The news are managed on a shared server, so publishing or removing an item does not require an extension release.

Constraints:
- Takes almost no space: one 32 px line when collapsed.
- The line itself cannot be collapsed, so users can always see that something new arrived.
- The feed panel is collapsed by default and opens on click.
- Follows the announcement patterns of large products (see Research) and avoids banner blindness.

## UI

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

### Read-state rules

- Opening and then closing the panel marks every visible item as seen (Facebook pattern: the badge clears after the list was opened, not per item).
- `Mark all as read` marks everything seen immediately.
- Seen item ids are stored in `chrome.storage.sync` so an item does not reappear on another machine.
- A critical item that was auto-expanded once is remembered, so it never auto-expands again.

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
      "minExtensionVersion": "2.7"
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

Unknown fields are ignored. Items failing validation are dropped individually; a feed with an unknown `schemaVersion` is ignored as a whole.

## Architecture (planned)

```
news.json (GitHub Pages)
   │  GET, no params, no cookies
   ▼
background.js ── message "getNews" ──► TTL cache (6 h) in chrome.storage.local
   │                                   fallback: last valid cached feed
   ▼
login/news.js (content script, login page only)
   validateFeed → selectVisible → render strip + panel (textContent only)
```

- **Fetch in the service worker, not in the content script.** The Creatio page's CSP and CORS do not apply, and the page never sees the feed URL.
- **Refresh by TTL when the login page opens** (cache older than 6 h → refetch). No `alarms` permission needed.
- **Pure functions in `login/news.js`:** `validateFeed(json)`, `selectVisible(items, { now, extensionVersion })` (expiry, version, sort, limit 5), `unreadCount(items, seenIds)`. Rendering is separate so the logic is unit-testable.
- **Render with `textContent` only.** No HTML from the feed; CTA links must be `https://` and on the allowlist.
- **Options page:** toggle `Show developer news` (`storage.sync`, default on). When off, no request is made.
- **Styles** in `styles/login.css`, using the existing `--csl-*` variables.

## Chrome Web Store

- Allowed: MV3 policy forbids remote **code**, but allows fetching remote configuration/data when all logic ships in the package. The feed is plain-text data.
- No new permissions: `host_permissions: <all_urls>` already covers the fetch, `storage` is already declared.
- Must be disclosed in the release notes and the privacy policy (`docs/PRIVACY_POLICY.md`): feed URL, refresh interval, no user data sent, how to turn it off.
- Draft release-note line: *"Added a collapsible developer news strip under the login profile selector. News are loaded as plain text from https://… every 6 hours; no user data is sent. The strip can be turned off in Options."*
- When the feed domain is chosen, add it to the permission justification in `CLAUDE.md` and the other agent instruction files.

## Tests (planned)

- Unit: `validateFeed` (valid, missing fields, bad URL scheme, unknown schema), `selectVisible` (expiry, min version, sort, limit), `unreadCount`, critical auto-expand-once.
- E2E (mock): intercept the feed with `page.route` and cover the four states, expand/collapse, mark all as read, persistence across reload, toggle off in options.

## Research

All large products use the same two-level pattern: a small persistent indicator plus details on click. They differ in signal strength and in when the signal clears.

| Product | Indicator | Clears | What we take |
|---|---|---|---|
| Facebook | Red counter on the bell | When the list is opened | Counter clears on open |
| X | Blue dot on the tab, "See new posts" pill | When viewed | Pill with a content preview instead of a bare number |
| Google (Material, Workspace) | In-content banner, "What's new" in help | On explicit dismiss | Message inside the task flow; benefit-first title |
| GitHub | Dot on avatar, Feature preview, changelog | When the section is opened | Item types, link to full changelog |
| Linear, Notion, Beamer, Headway | "What's new" badge + dropdown feed | When the feed is opened | Compact cards: tag, date, title, one line, one CTA |

Principles:
- **Position beats colour.** Banner blindness is learned for screen regions that were never useful. The strip sits right under the login button, where the eye already goes.
- **Signal only what is new.** A badge that is always on gets ignored (badge blindness).
- **Benefit-first titles** and **one CTA** per item.
- **User control:** can be turned off; items expire; critical items auto-open only once.

Sources:
- [AnnounceKit — in-app messaging best practices](https://announcekit.app/guides/in-app-messaging-best-practices)
- [Kompassify — banner blindness](https://kompassify.com/blog/banner-blindness-guide)
- [Braze — red dot blindness](https://www.braze.com/resources/articles/beware-red-dot-badging)
- [Atlassian — feature discovery](https://atlassian.design/content/designing-messages/feature-discovery)
- [ReleasePad — changelog widgets](https://www.releasepad.io/blog/in-app-changelog-widgets-build-vs-buy/)
- [Chrome Web Store — MV3 requirements](https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements)

## Open questions

- Feed host: GitHub Pages in a separate repo, or an internal server?
- Who can publish news (repo maintainers, reviewers)?
- Full changelog page for `All news →`: a GitHub Pages page next to the feed?
- Do we need per-host targeting (e.g. only for `*.krylov.cloud` stands)?

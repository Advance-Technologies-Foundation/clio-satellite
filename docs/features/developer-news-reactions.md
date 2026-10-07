# Developer News — Reactions (Like)

**Status:** proposal, not implemented. Related: [`developer-news.md`](developer-news.md) (UI), [`developer-news-hosting.md`](developer-news-hosting.md) (static feed), [`clio-news-repository.md`](clio-news-repository.md) (authoring).

## Goal

Let users react to a news item with a single **thumbs up** (like YouTube, without a dislike). Two purposes:

1. **For users:** a lightweight way to say "this was useful", and social proof that others found it useful too.
2. **For news authors:** a signal of which topics and formats work, so the team publishes more of what people value.

No dislike, no comments, no other emoji.

## What popular products do

| Product | Mechanic | Negative option | Count shown | Notes |
|---|---|---|---|---|
| YouTube | 👍 like, 👎 dislike | Yes, but the dislike **count is hidden** since Nov 2021 | Likes only | Dislike kept as a private signal for recommendations; public negativity removed |
| Product Hunt | ▲ upvote | **No downvote, by design** | Yes | Founder: people downvoted competitors, so only upvotes were kept to keep the community positive |
| X (Twitter) | ♥ like | No | Yes | One tap, toggles, animated heart |
| Instagram | ♥ like | No | Yes, **can be hidden** since 2021 | Hiding counts reduced pressure; likes still work |
| GitHub Discussions | ▲ upvote on posts and answers | No | Yes | Sorts by usefulness, not by popularity contest |
| Medium | 👏 clap (up to 50 per reader) | No | Yes | Intensity instead of a binary like; harder to read as a metric |
| Beamer, AnnounceKit (changelog widgets) | Emoji reactions on posts | Some offer 😐/🙁 | Yes | Built exactly for product-update feeds; used as feedback for product teams |
| Slack, Microsoft Teams | Any emoji | Possible | Yes | Too open for a news card; fine for conversations |
| LinkedIn, Facebook | Several reaction types | No explicit negative | Total | More choice → more thinking before tapping |

What to take from it:
- **Positive-only is the norm** for content feeds (Product Hunt, X, Instagram, GitHub). Removing the negative option avoids pile-ons and "downvote what I don't need", which on a news feed mostly means "not relevant to me".
- **One tap, toggle, instant feedback.** The like state flips immediately; the network happens in the background.
- **Small numbers look sad.** Products either hide counts (Instagram option) or show them only when they mean something. For an internal developer audience, "1 like" on a week-old item reads as "nobody cared".
- **Reaction ≠ read.** Liking implies the user saw the item, so it also marks it read.

## UX

### In the card (login panel and Shell flyout)

```
RELEASE · Oct 6 · ↗ Trending
Deploy packages 2× faster with clio 8.1
pushw now uploads only the packages that changed.
Read release notes →                              👍 12
```

- Thumbs-up button at the right of the CTA row, same line. Outline icon in the muted text colour; count next to it in tabular numerals.
- **Liked:** filled icon and count in the news blue (`#1a6fd6` on login, `#7cb2ff` on the dark Shell glass), count +1 immediately. A short scale "pop" (150 ms, none with `prefers-reduced-motion`).
- **Toggle:** a second click removes the like (count −1). No confirmation.
- **Count threshold:** the number is shown only from `showLikesFrom` (channel setting, default 3). Below it the button shows only the icon. The user's own like is always visible as the filled state.
- **Accessibility:** `<button aria-pressed="true|false" aria-label="Like this news, 12 likes">`. Keyboard: Enter/Space.
- **Where it is not:** the collapsed login strip, the Shell `What's new` row and the peek card. Reactions belong to reading, not to the teaser.
- **Video dialog:** the same button in the dialog footer, next to `Watch on YouTube ↗`.
- Liking marks the item read.

### Per item control

- `reactions: false` on an item hides the button. Default: on for `release`, `tip`, `event`; **off for `breaking`** (liking a breaking change reads as sarcasm).

## Architecture

The feed is static and read-only, so reactions need **one small write endpoint**. Everything else stays static.

```
Clio Satellite                       Reactions API (serverless)                clio-news (private)
 content script                        PUT  /v1/likes/{itemId}  {installId}       hourly publish job
   │ click 👍                           DELETE /v1/likes/{itemId} {installId}      GET /v1/counts (token)
   ▼                                    GET  /v1/counts?ids=a,b,c (public)          │
 background.js ── queue + retry ─────► store: (item_id, install_hash) unique        ▼
   ▲                                    counts per item                         embeds "likes" into
   │ feed (every ≤ 6 h) with likes ◄──────────────────────────────────────────── v1/feeds/*.json + archive
 clio-news-feed (public Pages)
```

### Identity without accounts

- On install the extension creates a random `installId` (UUID v4) and keeps it in `chrome.storage.sync`, so one person on several machines (same Chrome profile) counts once.
- It identifies a browser profile, not a person: no user name, no Creatio URL, no CRM data is ever sent.
- The API stores only `SHA-256(installId + server pepper)`, so raw ids never sit in the database.
- Turning news off in Options stops all reaction requests.

### API

| Method | Path | Body | Result |
|---|---|---|---|
| `PUT` | `/v1/likes/{itemId}` | `{ "installId": "<uuid>" }` | `204`; idempotent |
| `DELETE` | `/v1/likes/{itemId}` | `{ "installId": "<uuid>" }` | `204`; idempotent |
| `GET` | `/v1/counts?ids=a,b,c` | — | `{ "a": 12, "b": 3 }`, cached 60 s at the edge |

- `itemId` must exist in the current public feed (the API keeps a cached index of `all.json`), so nobody can create counters for arbitrary ids.
- Rate limit per IP (e.g. 30 writes per minute) and per `installId` (e.g. 100 per day).
- CORS: writes accepted only with `Origin: chrome-extension://<extension id>` (Chrome Web Store id and the unpacked dev id). Not a security boundary, but it stops casual scripted abuse from web pages.
- The `installId` can be forged by someone determined; likes are a sentiment signal, not a vote with consequences. That trade-off is accepted.

### How counts reach users

Two options; **A is recommended**:

| | A. Counts embedded in the feed | B. Client asks the API |
|---|---|---|
| How | The hourly `clio-news` publish job calls `GET /v1/counts` and writes `likes` into every item of every channel feed | When the panel/flyout opens, the background calls `GET /v1/counts?ids=…` |
| Freshness | ≤ 1 h + client refresh | Live |
| Extra requests per user | None | One per panel open |
| Works if the API is down | Yes (last published counts) | Counts disappear |

With A the user's own like must still show immediately: the extension stores `{ itemId: likedAt }` and adds +1 to the feed count when `likedAt` is later than the feed's `likesUpdatedAt`. After the next hourly publish the server count includes it and the local adjustment stops.

### Reliability

- Writes go through the background service worker (no page CSP/CORS issues), are queued in `chrome.storage.local` and retried on the next feed refresh if the API is unreachable. The UI never shows a network error for a like.
- The like state is local-first: even if the API is down for a day, the user sees their like.

### Hosting the API

| Option | Fit | Cost | Notes |
|---|---|---|---|
| **Cloudflare Workers + D1** | One worker (~150 lines) + one table | Free tier: 100,000 requests/day; D1 has daily row read/write limits (enforced on the free plan since Sep 2026) | Global edge, built-in rate limiting rules. **Recommended** unless the company prefers Azure |
| Azure Functions + Table Storage | Same design | Consumption plan, near zero at this volume | Good if Creatio infrastructure is on Azure and ops want one cloud |
| Supabase (Postgres + REST) | Works | Free tier | Anonymous key in the extension makes abuse control harder |
| A Creatio instance (anonymous web service) | Dogfooding | Existing instance | Couples every user's like to one instance's uptime; rejected for now |
| GitHub reactions on an issue per item | No backend | Free | Requires every user to sign in to GitHub; rejected |
| Third-party like widget | No backend | Varies | Sends users' data to a vendor; rejected |

Estimated volume: a few thousand installs × a few likes per month — far inside any free tier.

### Data model

```sql
CREATE TABLE likes (
  item_id      TEXT NOT NULL,
  install_hash TEXT NOT NULL,
  created_at   TEXT NOT NULL,          -- ISO UTC
  PRIMARY KEY (item_id, install_hash)
);
-- counts: SELECT item_id, COUNT(*) FROM likes WHERE item_id IN (...) GROUP BY item_id
```

Retention: rows of items that left the archive more than a year ago are deleted; counts are copied into the archive page first.

## Feed and repository changes

- Feed item (v1, additive): `"likes": 12`, feed-level `"likesUpdatedAt": "<ISO>"`. Old clients ignore both.
- `clio-news` item: optional `reactions: false`. `channels.yml`: `showLikesFrom: 3`, `reactions: true` per channel.
- `clio-news` publish job: new step "fetch counts" with a read token (`REACTIONS_READ_TOKEN` secret); if the API is unreachable, the previous counts are kept and the publish continues.
- Archive page: shows likes per item; a monthly summary (top items by likes per type) goes to the authors.

## Extension changes

- `src/news/reactions.js`: install id, local like state, optimistic count, toggle.
- `background.js`: `likeNews` / `unlikeNews` handlers, retry queue.
- Card renderer: thumbs-up button; video dialog footer button.
- Options: nothing new (the news toggle covers reactions).

## Chrome Web Store and privacy

- No new permissions: `host_permissions: <all_urls>` covers the API host.
- Privacy policy: "When you like a news item, the extension sends the item id and a random identifier created on install to `<api-host>`. No name, email, Creatio address or other personal data is sent. Turning off news in Options stops these requests."
- Release note: *"Added a thumbs-up button to developer news so you can mark items as useful; only the item id and a random install identifier are sent."*

## Tests (planned)

- Unit: toggle, optimistic count with `likesUpdatedAt`, threshold display, `reactions: false`, breaking default, queue + retry, no requests when news are disabled.
- Unit (API): idempotent PUT/DELETE, unknown item id → 404, rate limit, hash instead of raw id, CORS origin check.
- E2E (mock API with `page.route`): like → filled + count; unlike; API down → like persists, request retried later; count hidden below the threshold.

## Open questions

- Cloudflare or Azure for the API (who owns the account)?
- Threshold `showLikesFrom`: 3, 5, or never show numbers (likes as a private signal for authors only, like YouTube's dislikes)?
- Do we want to show "Liked by N people from your company"? It would need a tenant identifier and is out of scope for now.

## Sources

- [Inc. — Why Reddit and Product Hunt decided to keep it simple](https://www.inc.com/christine-lagorio/reddit-product-hunt-upvotes.html)
- [GitHub Docs — participating in a discussion (upvotes)](https://docs.github.com/en/discussions/collaborating-with-your-community-using-discussions/participating-in-a-discussion)
- [Beamer for Intercom — reactions on posts](https://www.getbeamer.com/blog/beamer-for-intercom)
- [AnnounceKit — emoji feedback on changelog posts](https://help.announcekit.app/en/articles/5550462-creating-and-customizing-your-announcekit-changelog-page)
- [FeatureOS — hide vote counts](https://help.featureos.app/en/articles/hide-vote-counts-on-posts.md)
- [Cloudflare — Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare — D1 free tier limit enforcement (Sep 2026)](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/)

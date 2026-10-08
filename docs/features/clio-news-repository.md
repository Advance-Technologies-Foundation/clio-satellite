# clio-news — Repository Structure and Authoring Guide

**Status:** set up in `Advance-Technologies-Foundation/clio-news` (private) with the public output in `Advance-Technologies-Foundation/clio-news-feed`. The repository's own README and CONTRIBUTING are the living version of this document.
Related: [`developer-news-hosting.md`](developer-news-hosting.md) (why a static feed and how it is delivered), [`developer-news.md`](developer-news.md) (how Clio Satellite shows news).

`clio-news` holds **all news about the clio tool family**: the clio CLI, Clio Satellite, and any future clio tooling. Each place that shows news is a **channel** and gets its own feed built from the same pool of news items. Today there are two channels: `clio-satellite` (the Chrome extension) and `web` (archive site and RSS). The clio CLI does not get its own news command; news about clio reach users through these channels. A new channel can be added later without touching existing items.

The sections "Writing news" and later are meant to become `CONTRIBUTING.md` of the repository.

---

## Concepts

| Term | Meaning |
|---|---|
| **Item** | One news entry, one file in `news/` |
| **Product** | What the item is *about*: `clio`, `clio-satellite`, `creatio-dev-tools`, … Used for tags and the archive filter |
| **Channel** | Who *shows* the item: `clio-satellite` (extension), `web` (archive site and RSS). Defined in `channels.yml` |
| **Feed** | Built JSON file per channel, `v1/feeds/<channel>.json`. Clients read only their own feed |
| **Status** | `draft` (local preview and PR artifact only), `published`, `withdrawn` |

## Repository layout

```
clio-news/
├── README.md                     what the repo is, channels, feed URLs, status badge
├── CONTRIBUTING.md               this authoring guide
├── CODEOWNERS                    who approves news (per channel folder rules below)
├── channels.yml                  registry of channels and their limits
├── news/
│   └── 2026/
│       └── 10/
│           ├── 2026-10-06-clio-8-1-pushw.yml
│           └── 2026-10-21-webinar-composable-apps.yml
├── media/
│   └── 2026/
│       └── 10/
│           ├── clio-8-1-pushw.webp
│           └── webinar-composable-apps.webp
├── templates/                    copy one to start a new item
│   ├── release.yml
│   ├── tip.yml
│   ├── event.yml
│   └── breaking.yml
├── schema/
│   ├── news-item.schema.json     source-of-truth for an item file (authors)
│   └── feed-v1.schema.json       contract of a built feed (clients)
├── scripts/
│   ├── validate.mjs              schema + extra rules; `npm run validate`
│   ├── build.mjs                 news/ + media/ → dist/ (feeds, media, archive, RSS)
│   └── preview.mjs               local preview server: cards as each channel renders them
├── site/                         archive page and RSS templates
├── .pages.yml                    Pages CMS config (web editor over this repo), optional
├── .github/
│   ├── PULL_REQUEST_TEMPLATE.md  author checklist
│   └── workflows/
│       ├── validate.yml          on PR: validate, comment with card previews
│       ├── publish.yml           on merge to main + hourly cron: build and deploy Pages
│       └── withdraw.yml          manual: withdraw an item by id and deploy now
└── package.json
```

Rules behind the layout:
- **One item = one file**, named `YYYY-MM-DD-<slug>.yml`. The file name without extension **is the item id**; there is no separate `id` field to get wrong. Never rename a published file: renaming creates a new item and resets everyone's read state.
- **Year/month folders** keep `news/` browsable after years of items.
- **Media next to the month** of the item that introduced it, referenced by file name only.
- **YAML, not JSON**, for authoring: comments are allowed, multi-line text is readable, Pages CMS edits it natively. The build emits JSON.

## Published output (GitHub Pages)

```
https://advance-technologies-foundation.github.io/clio-news-feed/
├── index.html                         archive: all items, filter by product and type
├── feed.xml                           RSS/Atom of channel `web`, for humans and Teams/Slack bots
└── v1/
    ├── feeds/
    │   ├── clio-satellite.json        read by the extension
    │   └── all.json                   every published item, all channels
    └── media/2026/10/clio-8-1-pushw.webp
```

- `v1` is the feed format version (`feed-v1.schema.json`). A breaking format change is published as `v2/` next to `v1/`; old clients keep working.
- Each channel feed contains only items that list that channel, are `published`, have reached `publishAt` and have not passed `expiresAt`. Channel-specific options are flattened into the item (see `channelOptions`).
- Clio Satellite reads `https://advance-technologies-foundation.github.io/clio-news-feed/v1/feeds/clio-satellite.json`.

## `channels.yml`

Registry of channels (who shows news) and products (what news are about).

```yaml
products: [clio, clio-satellite, creatio-dev-tools]

channels:
  clio-satellite:
    name: Clio Satellite (Chrome extension)
    owners: ["@Advance-Technologies-Foundation/clio-satellite-maintainers"]
    maxActive: 5          # build fails if more items would be active at once
    maxCritical: 1
    trendingHours: 72     # used for `trending: true`
    title: { max: 60 }
    body:  { max: 140 }
    media: [image, youtube]
    options:              # allowed keys in channelOptions.clio-satellite
      surfaces: { values: [login, shell], default: [login, shell] }

  web:
    name: Archive site and RSS
    owners: ["@Advance-Technologies-Foundation/clio-maintainers"]
    maxActive: 1000
    title: { max: 100 }
    body:  { max: 600 }
    media: [image, youtube]
```

Adding a new tool = adding a channel here; no other change to existing items is needed.

---

## Writing news

### 1. Before you start

Ask yourself: **would a clio user lose something by not knowing this in the next two weeks?** If not, it belongs in release notes or docs, not in news. Good news: a release with a visible benefit, a breaking change, a useful tip people don't know, an event. Not news: internal refactoring, minor fixes, marketing without a concrete benefit.

### 2. Steps

1. Create a branch `news/<slug>`.
2. Copy a template from `templates/` to `news/<YYYY>/<MM>/<YYYY-MM-DD>-<slug>.yml`. The date is the planned publish date; the slug is 3–6 lowercase words with hyphens.
3. Fill the fields (reference below). Put images into `media/<YYYY>/<MM>/`.
4. Run `npm run validate` and `npm run preview`, check the card in every channel you target.
5. Open a PR. CI validates again and comments with a preview of the card per channel.
6. A CODEOWNER of each targeted channel approves. Merge = publish (or schedule, if `publishAt` is in the future).
7. Drafts (`status: draft`) can be merged safely: they are never published. Preview them with `npm run preview` (local server at `http://localhost:4300`); Clio Satellite can point its admin preview switch at that address.

Without git: open the repository in Pages CMS, choose **News → New**, fill the form; it creates the same file and a PR.

### 3. Item file reference

```yaml
# news/2026/10/2026-10-06-clio-8-1-pushw.yml
status: published            # draft | published | withdrawn
type: release                # release | tip | event | breaking
product: clio                # what it is about (one of `products` in channels.yml)
channels: [clio-satellite, web]

title: Deploy packages 2× faster with clio 8.1
body: pushw now uploads only the packages that changed since the last deploy.

cta:
  label: Read release notes
  url: https://github.com/Advance-Technologies-Foundation/clio/releases/tag/8.1.0

publishAt: 2026-10-06T09:00:00Z   # optional; default = merge time
expiresAt: 2026-11-06T00:00:00Z   # required; max 90 days after publishAt

priority: normal             # normal | critical (critical only for type: breaking)
trending:                    # optional; omit for regular items
  hours: 72                  # per user, from first time they saw it
  # until: 2026-10-10T00:00:00Z   # absolute end; earliest of the two wins

media:                       # optional, at most one
  type: image
  src: clio-8-1-pushw.webp   # file in media/<YYYY>/<MM>/ of this item
  alt: Terminal output of clio pushw showing two changed packages

minVersions:                 # optional; hide from older clients
  clio-satellite: "2.7"

channelOptions:              # optional; keys allowed per channel in channels.yml
  clio-satellite:
    surfaces: [login, shell]

owner: "@v.nikonov"          # who to ask about this item; not published
```

| Field | Required | Notes |
|---|---|---|
| `status` | yes | `draft` is never published (local preview and PR artifact only); `withdrawn` removes it everywhere on the next build |
| `type` | yes | Sets the tag and colour in clients |
| `product` | yes | One value; drives the archive filter |
| `channels` | yes | At least one; each must exist in `channels.yml` |
| `title` | yes | Plain text; length limit is the strictest of the targeted channels |
| `body` | no | Plain text, one or two sentences |
| `cta` | no | One link; `https://` only; host must be on the allowlist in `scripts/validate.mjs` (GitHub, clio docs, Creatio academy/community, YouTube, the news site) |
| `publishAt` | no | UTC; the hourly build publishes it. Not visible anywhere before that time, also not in the public JSON |
| `expiresAt` | yes | UTC; after it the item leaves channel feeds and stays only in the archive |
| `priority` | no | `critical` is allowed only with `type: breaking`, never with `trending` |
| `trending` | no | `true` (default length from `channels.yml`), or `hours` (1–720) and/or `until` |
| `media` | no | `image` (`src`, `alt`) or `youtube` (`videoId`, `title`, optional `poster`, `player: embed` or `link`, `start` seconds) |
| `minVersions` | no | Per channel minimum client version |
| `channelOptions` | no | Per channel; validated against `channels.yml` |
| `owner` | yes | GitHub handle; kept in the repo, stripped from feeds |

### 4. Writing rules

**Title**
- Lead with the benefit to the user, not the event. ✅ "Deploy packages 2× faster with clio 8.1" ❌ "clio 8.1 released".
- Concrete numbers and names beat adjectives. ❌ "Huge performance improvements".
- No ending period, no emoji, no ALL CAPS, no "NEW!" — the client already marks new items.
- Sentence case.

**Body**
- One or two sentences that answer "what changes for me?". If it needs three, link to docs with the CTA.
- Plain text only. No Markdown, no HTML: clients render text as is.
- Commands and names exactly as typed: `clio pushw`, not "the push command".

**CTA**
- One verb phrase: "Read release notes", "Register", "See migration steps", "Try it".
- The link must work without login when possible.

**Media**
- Only if it explains faster than text: a screenshot of new UI, terminal output, a recorded demo.
- Images: 640×360 (16:9), WebP preferred, ≤ 300 KB, no text that is required to understand the news.
- `alt` describes what the image shows, not "screenshot".
- YouTube: use `videoId` only (the 11 characters after `v=`). Prefer an own `poster` in `media/` so clients do not call Google before the user presses play. Use `player: link` for long recordings where YouTube chapters help.

**Choosing type, priority and trending**

| Situation | type | priority | trending | expiresAt |
|---|---|---|---|---|
| New clio release with a visible feature | `release` | normal | `hours: 72`–`168` | 30 days |
| Useful tip, existing feature | `tip` | normal | `hours: 48` | 30 days |
| Webinar, meetup, office hours | `event` | normal | `until:` event start | day after the event |
| Breaking change, required action, deadline | `breaking` | `critical` | — (never) | the deadline + 7 days |
| Security advisory | `breaking` | `critical` | — | 60 days |

**Frequency**
- Clio Satellite shows at most 5 active items and 1 critical; CI fails the PR if merging would exceed the limits of any targeted channel.
- Aim for one item a week at most per channel. Fewer, better items keep people reading.

### 5. Changing and withdrawing

- **Fix a typo:** edit the file and merge. The id does not change, read state is kept.
- **Change the meaning** (new date, different content): withdraw the old item and create a new file, so people who already read the old one see the new one as unread.
- **Withdraw:** set `status: withdrawn` and merge, or run the `withdraw` workflow with the id for an immediate deploy. Do not delete the file: the archive keeps a record that the item existed.
- **Extend trending:** raise `hours` or move `until`. Users who never read the item see it as new again; users who read it do not.

### 6. PR checklist (in the PR template)

- [ ] File name is `YYYY-MM-DD-<slug>.yml` in the right `news/YYYY/MM/` folder
- [ ] Title leads with the benefit, within the limit, no period
- [ ] Body is plain text and answers "what changes for me?"
- [ ] CTA link opens without login
- [ ] `expiresAt` set; `trending` set for time-sensitive items; no `trending` on critical items
- [ ] Images ≤ 300 KB with meaningful `alt`; YouTube uses `videoId` and an own poster
- [ ] Previewed in every targeted channel (`npm run preview` or the PR comment)

---

## Validation rules (CI)

`scripts/validate.mjs` fails the PR when:
- the file does not match `schema/news-item.schema.json`, or its name is not `YYYY-MM-DD-<slug>.yml`;
- a channel is unknown, or `channelOptions` uses a key the channel does not allow;
- title/body exceed the strictest limit of the targeted channels;
- `cta.url` is not `https://` or its host is not on the allowlist;
- `expiresAt` is missing, before `publishAt`, or more than 90 days after it;
- `priority: critical` is used with a type other than `breaking`, or together with `trending`;
- `trending.hours` is outside 1–720, or `trending.until` is after `expiresAt`;
- an image file is missing, larger than 300 KB, or not WebP/PNG/JPEG; `alt` is missing;
- a YouTube `videoId` is not 11 characters `[A-Za-z0-9_-]`, or (network check) the video does not exist or does not allow embedding while `player: embed`;
- merging would exceed `maxActive` or `maxCritical` of a channel at any moment between now and the item's `expiresAt`.

## Build (`scripts/build.mjs`)

1. Read all `news/**/*.yml`, validate, derive `id` from the file name.
2. For each channel: keep items that list it, are `published`, `publishAt ≤ now < expiresAt`; flatten `channelOptions[channel]` into the item; apply `minVersions[channel]` as `minExtensionVersion`/`minVersion`; drop media types the channel does not allow; turn `media.src` into an absolute URL; strip `owner`, `status`, `channels`, `channelOptions`.
3. Write `v1/feeds/<channel>.json` and `v1/feeds/all.json`, copy only the media referenced by live items, render `index.html` and `feed.xml`. Drafts and future items exist only in the preview build, which is never deployed.
4. Write `Cache-Control`-friendly files (stable order, no timestamps inside unless content changed) so `ETag` changes only when news change.

---

## Open questions

- First CODEOWNERS per channel (`clio-satellite`, `web`).

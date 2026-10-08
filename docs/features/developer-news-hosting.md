# Developer News — Storage and Publishing Architecture

**Status:** decision taken 2026-10-07; `clio-news` pipeline set up, extension side not implemented. Companion to [`developer-news.md`](developer-news.md) (UI, feed format, client behaviour).

## Decision (2026-10-07, updated)

- **Two repositories.** `clio-news` is **private**: sources, drafts, scheduled items, images, CI. `clio-news-feed` is **public** and contains only the build output (live items and their images), deployed by CI as a single force-pushed commit. Reason: the organization is on the GitHub Free plan, where Pages cannot publish from a private repository, and the team wants drafts and embargoed news to stay invisible until their time. Even with private Pages the site itself would be public, so the embargo has to be enforced by the build anyway.
- `clio-news` holds news for the whole clio tool family; each place that shows news is a channel with its own feed (`clio-satellite`, `web`). Publishing a news item never touches the extension repo or its release workflow. Structure and authoring rules: [`clio-news-repository.md`](clio-news-repository.md).
- Feed URL, served by GitHub Pages of `clio-news-feed` without a custom domain:
  `https://advance-technologies-foundation.github.io/clio-news-feed/v1/feeds/clio-satellite.json`
- A custom domain is postponed. To keep the option open without stranding old extension versions on the `github.io` URL, the feed carries a `movedTo` field (see "Moving the feed later").
- Authoring starts with option A (pull requests). Pages CMS can be added on top of the same repository later.

## Problem

News must be published, edited, scheduled and withdrawn without an extension release. The people writing news are mostly developers today, but product and DevRel people should be able to publish later. Images and video posters must be hosted somewhere. The extension must keep working when the publishing side is down or replaced.

## Requirements

| # | Requirement | Why |
|---|---|---|
| R1 | Extension reads one static HTTPS URL; no API, no auth | Simple client, works behind corporate proxies, no secrets in the extension |
| R2 | The URL never changes even if hosting or tooling does | The URL is compiled into published extension versions that live for months |
| R3 | Every change is reviewed and reversible | News are shown inside a CRM to developers; a bad link is a phishing vector |
| R4 | Validation before publish (schema, lengths, images, YouTube ids, trending rules) | The client drops invalid items silently; the author must learn about errors before users don't see the item |
| R5 | Scheduling: publish at a date/time, expire at a date/time | Webinars, releases timed with announcements |
| R6 | Preview before publish | Authors must see the card as users will |
| R7 | Images hosted next to the feed | Media rules in the spec require the feed host |
| R8 | Archive page for `All news →` | Expired items stay readable |
| R9 | Near-zero cost and operations | Side project of a dev-tools team |
| R10 | Emergency withdrawal within ~1 hour | A wrong or harmful item must disappear fast |

## Key decision: split delivery from authoring

```
        AUTHORING (replaceable)                       DELIVERY (stable contract)
  +------------------------------------+       +------------------------------------------+
  | git repo  clio-news                |       | <feed-host>/v1/feeds/<channel>.json      | <- clients (every <= 6 h)
  |   news/YYYY/MM/*.yml   media/*     |  CI   | (drafts and future items stay private)   |
  | editors: PR in GitHub, or          | ----> | <feed-host>/v1/media/*                   |
  |          Pages CMS web UI          | build | <feed-host>/ (archive)  /feed.xml (RSS)  |
  | CODEOWNERS review per channel      |       |                                          |
  +------------------------------------+       +------------------------------------------+
```

- **Delivery** is static files on a CDN (GitHub Pages now, a custom domain later via `movedTo`) (R1, R2). The extension only knows this URL and the feed schema version in the path (`/v1/`). A breaking schema change publishes `/v2/feeds/...` side by side; old extension versions keep reading `/v1/`.
- **Authoring** is whatever produces those files. It can change (git only → web CMS → Creatio app) without touching the extension.

## Options compared

| Option | How authors publish | R3 review | R6 preview | R9 cost/ops | Verdict |
|---|---|---|---|---|---|
| **A. Git repo + CI + GitHub Pages** | PR with a JSON file per item | ✅ PR review, CODEOWNERS, revert | ✅ local preview + PR artifact | ✅ free, no servers | **Recommended start** |
| B. A + Pages CMS (web UI over the same repo) | Form in a browser, saves commits/PRs to the repo | ✅ same as A | ✅ same as A | ✅ free, hosted or self-hosted | **Add when non-developers publish** |
| C. Headless SaaS CMS (Contentful, Sanity, Strapi Cloud) | Web UI | ⚠️ roles, but no git history | ✅ | ❌ paid plan or a server to run | Not needed for ~5 items/month |
| D. Creatio app as CMS ("Clio News" section) | Creatio form + approval business process; on approval a process exports JSON to the repo/host | ✅ approval process | ⚠️ needs custom preview | ⚠️ needs a Creatio instance and an export process | Good dogfooding story; consider as phase 3 if the team wants it |
| E. Own backend (DB + admin UI + API) | Custom UI | ⚠️ build it | ⚠️ build it | ❌ servers, auth, on-call | Rejected |
| F. Extension reads an API of a live Creatio instance | Creatio UI | ✅ | ⚠️ | ❌ couples every user's login page to one instance's uptime and opens an anonymous endpoint | Rejected |

C, D and E all still publish into the same delivery layer if chosen later, so starting with A loses nothing.

## Recommended setup (option A, ready for B)

### Repository `clio-news`

Layout, item file format, channels and the authoring guide are in [`clio-news-repository.md`](clio-news-repository.md). Key points: one YAML file per item (`news/YYYY/MM/YYYY-MM-DD-<slug>.yml`, file name = id), media next to it, `channels.yml` as the registry of consumers, one built feed per channel under `v1/feeds/`.

### CI pipeline

| Trigger | Steps |
|---|---|
| Pull request | `validate.mjs` (schema; title ≤ 60, body ≤ 140; CTA host allowlist; image exists, ≤ 300 KB, webp/png/jpg; YouTube `videoId` format and, with a network call, that the video exists and allows embedding; trending rules; max 5 active, max 1 critical after merge) → comment with a rendered preview of the card |
| Merge to `main` | build → deploy channel feeds, media of live items, archive page, Atom feed |
| Hourly cron | rebuild so `publishAt` items go live and expired items leave channel feeds without anyone merging |
| Manual "withdraw" workflow | sets `status: withdrawn` on one id and deploys immediately (R10) |

### Scheduling and embargo

- `publishAt` is applied **by the build**, not by the client: an item is not in channel feeds before its time, so embargoed news are never visible in the public file. The hourly cron gives ≤ 1 h precision, which is enough for news.
- `expiresAt` and `trending.until` are applied **by the client** (they are already in the feed format) and also by the build, so expired items disappear from the file and move to the archive.

### Preview

- Drafts and future items are **never deployed**: there is no public staging feed, because anything on GitHub Pages is public.
- `npm run preview` in `clio-news` serves feeds with drafts and scheduled items at `http://localhost:4300`. A hidden admin switch in Clio Satellite Options can read the feed from there, so authors see their draft on a real login page and in Shell.
- Every PR gets a `news-preview` artifact (feeds and archive page with drafts) for reviewers without a local checkout.

### Hosting and domain

- Now: GitHub Pages of the `clio-news` repository at its default `github.io` address (see Decision). GitHub Pages serves with HTTPS, a CDN and `ETag`, so the extension's conditional requests cost almost nothing.
- Later: the same Pages site behind a custom domain, using `movedTo` below.
- If Pages limits are ever a problem, or the repo must be private: move the same `dist/` to Azure Static Web Apps / Cloudflare Pages / S3 + CloudFront. Only DNS changes; the extension is untouched (R2).
- Never use `raw.githubusercontent.com`: it is not a CDN, has no stable caching and is rate-limited.

### Moving the feed later

The `github.io` URL is compiled into every extension version released now. To move without a forced update:

1. Publish the feed at the new URL as well (same content).
2. Add `"movedTo": "https://<new-url>/v1/feeds/clio-satellite.json"` to the feed at the old URL.
3. The extension reads `movedTo`, checks it against a short allowlist compiled into the extension (`https://` + hosts the team controls), stores it as `newsFeedUrl` in `storage.local`, and fetches from there from then on. If the new URL fails three refreshes in a row, it falls back to the compiled URL.
4. Keep the old URL alive with `movedTo` for at least six months, until old extension versions are gone from the Chrome Web Store statistics.

`movedTo` only changes where the feed is read from; it can never point to a host outside the compiled allowlist, so a compromised feed cannot redirect clients to an arbitrary server.

### Freshness and emergency withdrawal

- Client TTL is 6 h by default. The feed may carry `"refreshHours": 1–24` so the team can temporarily speed up refreshes (e.g. during a release week) without an extension release.
- Withdrawal path: run the withdraw workflow → deploy in ~2 min → clients pick it up on their next refresh (≤ `refreshHours`). For a harmful link, also temporarily set `refreshHours: 1`.
- CDN cache: `Cache-Control: max-age=300` on channel feeds (Pages default is 600 s; acceptable).

### Integrity (phase 2)

The CTA host allowlist in the extension already limits what a compromised feed can do. For stronger protection the build can sign each channel feed with an Ed25519 key kept in CI secrets and publish `<channel>.json.sig`; the extension ships the public key and drops a feed whose signature does not match. Cost: one secret, ~30 lines of code on each side, key rotation through an extension release. Worth doing once more than a handful of people can merge.

### Roles

| Role | Who | Can |
|---|---|---|
| Author | Anyone in the org | Open a PR or use Pages CMS (creates a PR) |
| Reviewer | `CODEOWNERS` (2–3 people from the dev-tools team) | Approve and merge, i.e. publish |
| Admin | Repo admins | Withdraw workflow, domain, secrets |

## Phases

| Phase | Scope | Unlocks |
|---|---|---|
| 1 | Repo, schema, validate + build + deploy, custom domain, local preview, archive page | Extension v1 of the news feature |
| 2 | Pages CMS config, PR preview comment, feed signing | Non-developer authors, stronger integrity |
| 3 (optional) | Creatio "Clio News" app exporting to the repo through the GitHub API | Authoring inside Creatio with approval processes |

## Impact on the extension

- Feed URL constant: `https://advance-technologies-foundation.github.io/clio-news-feed/v1/feeds/clio-satellite.json`.
- `movedTo` handling and the `newsFeedUrl` override (see Moving the feed later).
- Media allowlist = the feed host (`advance-technologies-foundation.github.io` now) (plus `i.ytimg.com` for fallback posters).
- New optional feed field `refreshHours` (1–24, default 6).
- Options: hidden admin switch to read a preview feed from `http://localhost:4300` (the `npm run preview` server of `clio-news`).
- `CLAUDE.md` and the other agent instruction files: justify the news domain under the permissions section once it is chosen.

## Open questions

- Custom domain: which one, and when (not blocking; `movedTo` covers the switch)?
- Who are the first `CODEOWNERS`?

## Sources

- [Pages CMS — introduction](https://pagescms.org/docs/)
- [Pages CMS on GitHub (MIT)](https://github.com/pages-cms/pages-cms)

## 2026-10-07 — Developer news strip: research and design

**What changed:** Added the spec `docs/features/developer-news.md` and the v1 interactive mockup `docs/design/developer-news/mockup.html` for a developer news strip on the login page. No extension code changed yet.

**Why:** We want to announce development-tool news (clio releases, tips, webinars, breaking changes) to extension users without shipping an extension release for every item, and without taking room from the login form.

**Decision:** A 32 px always-visible strip under the profile row with a collapsible panel, rather than a bell icon or a full banner. Research across Facebook, X, Google, GitHub and changelog widgets showed the same two-level pattern; placement inside the task flow beats a stronger colour, and the signal must appear only for new items to avoid badge blindness. The feed is a static JSON file (GitHub Pages) fetched by the service worker with a 6 h TTL: it is data, not code, so it complies with MV3 remote-code rules and needs no new permissions.

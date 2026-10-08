# PR #14 review: safety and backward-compatibility fixes

**What changed:**
- `src/positionManager.js` — dropped the always-true `floatingContainer &&` check flagged by GitHub code quality; the sibling walk applies only to the search, the `action-button` fallback keeps its old `right + 20` anchor.
- `src/observer.js` — the drift check in `monitorButtons()` expects the buttons after the search's group (`anchorRightEdge`), not at `search.right + 20`; before, it re-ran positioning on every check on CPQ.
- `src/menuBuilder.js`, `src/index.js` — developer news calls are isolated: errors are logged and never mark the menu as failed.

**Why:** Review of PR #14 for pages without the new elements and for older layouts.

**Checked, no change needed:** every `styles/news.css` selector is scoped to `.csl-*` / `.creatio-satelite*` (the file is injected on all sites); `news/newsFetcher.js` is in the release ZIP (packaging test); news are opt-in, so with the default settings nothing is fetched; new storage keys only, no existing key changed.

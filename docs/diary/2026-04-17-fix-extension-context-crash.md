## 2026-04-17 — Fix: Extension context invalidated crash

**What changed:** Added `getLastError()` helper to `src/debug.js`. Replaced all direct `chrome.runtime.lastError` accesses (7 occurrences across `positionManager.js`, `floatingContainer.js`, `menuBuilder.js`) with calls to this helper.

**Why:** When Chrome reloads the extension while a content script is still alive, the extension context is invalidated. Any subsequent access to `chrome.runtime` throws `"Uncaught Error: Extension context invalidated."` — including the `lastError` checks inside storage callbacks. The crash was surfacing in plugin logs.

**Decision:** A single safe wrapper (`try/catch` around the property access) centralises the fix and keeps each callback clean. Wrapping the full callback body would be noisier and would also swallow real logic errors.

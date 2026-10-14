# Removed the grey blob on dark backgrounds

**What changed:** `edgeBlob.js` no longer looks at the page under the blob; the blob is always `BLOB_COLOR`. Removed `colorLuminance`, `gradientLuminance`, `shadeAt`, `isDarkAt`, the page watch after a restore (`SHADE_WATCH_MS`), the `csl-edge-on-dark` styles and their tests.

**Why:** the user asked to remove it: on a live Creatio card it kept turning grey and back to black. Hit testing (`elementsFromPoint`) sometimes found only `body` under the dark header, and the header is redrawn for seconds after load; each fix (gradients, re-checks, a page watch, a lookup by element boxes) still left wrong answers.

**Decision:** removed instead of tuned further: the feature is a nicety and a wrong colour is worse than a constant one. If it comes back, reading the real pixels (e.g. `chrome.tabs.captureVisibleTab` from the background worker) would avoid guessing from the DOM, at the cost of a screenshot permission path.

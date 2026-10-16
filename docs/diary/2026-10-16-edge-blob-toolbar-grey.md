# Edge blob in the grey of the browser toolbar

**What changed:** `BLOB_COLOR` in `src/edgeBlob.js` is now `#393b43` instead of `#151515` and is exported; the blob, the wet spot and the pool take it. A unit test checks that the injected stylesheet paints them with it.

**Why:** a blob docked on the top edge sits right under Chrome's dark toolbar. The near-black blob next to the dark grey toolbar read as two different colours, as if a dark notch hung from the browser.

**Decision:** a fixed colour. A content script cannot read the colour of the browser toolbar (Chrome has no theme API for extensions), and reading the page under the blob was already tried and removed (2026-10-14). An eyedropper in Options or a light/dark switch were considered and left out as more code for the same result with the default dark theme.

# Grey blob on a dark background

**What changed:** `edgeBlob.js` checks the page background under the middle of the blob each time the blob is shown or moved (`isDarkAt`, `colorLuminance`). On a dark background the blob gets `csl-edge-on-dark` and turns dark grey (#555 → #2a2a2a) instead of black.

**Why:** a black blob on a dark panel (for example a dark navigation bar along the edge) could hardly be seen.

**Decision:** the colour is read from the computed background of the topmost page element under the blob, not from pixels (a content script cannot read page pixels without a screenshot permission). It is checked only on show and move, not on a timer, by the user's choice: polling every few seconds costs work on every page for a rare case. Images, canvases and iframes are not looked into — the blob stays black over them.

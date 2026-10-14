# Pool shaped like the blob; flat colour; quieter restore; right edge

**What changed** (`edgeBlob.js`, `floatingContainer.js`):
- The blob, the wet spot and the pool are one flat colour, no gradients or shine.
- The pool under the buttons out of the blob is no longer a rounded rectangle: it is drawn like the resting bell (a rounded box merged with a thin skirt by a smooth union of distance fields), so it flows into the edge, and it grows out of the dome by morphing the shape frame by frame; at the end of a peek it shrinks back into the dome and the blob takes its place. The buttons are uncovered from the blob's side while it grows, instead of popping in on their own.
- A blob restored on page load slides out of the edge with a small overshoot; no drops.
- Edges are measured without scrollbars, and the blob, pool and buttons sit above the page's fixed panels (z-index 9996–9998, inline `!important` on the buttons to beat the stylesheets' `1000 !important`).

**Why:** user feedback: the gradient read as black and grey; the pool came out with its own animation instead of out of the blob, and its hard edges did not look like the blob; the restore splat was too busy; on the right edge the blob was not fully visible.

**Decision:** the right-edge report could not be checked on a live Creatio (the stand was unreachable); the mock page shows the blob in full. Both likely causes are handled: a vertical scrollbar (`innerWidth` counts it) and a fixed page panel above z-index 1000. To confirm on a stand.

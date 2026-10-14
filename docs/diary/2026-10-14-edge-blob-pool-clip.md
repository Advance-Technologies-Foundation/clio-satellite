# Buttons clipped to the pool; drag along the edge moves the blob; better dark check

**What changed:**
- `edgeBlob.js`: while the pool grows out of the blob or shrinks back, the buttons are clipped to the pool on every frame (`clipToPool`), instead of a separate clip circle (coming out) and a squash (going back). The buttons get `data-edge-docked` when the pool is back in the dome. The orange dot flies from the icon into the dome while the pool shrinks.
- `floatingContainer.js`: the pool is built around the button wrapper, not the container: with the real page stylesheets the container is padded and lies elsewhere, so the pool stood off the buttons. The buttons are centred on the blob by their own box.
- Dragging the buttons out of the blob along the edge (less than a button height away from it) moves the blob there: `releaseButtons` keeps the move along the edge, saves the new spot and brings the buttons back to the edge.
- The dark-background check also reads gradients and non-rgb colours (canvas), runs when the mouse enters the blob, and once 3 s after a restore on page load.

**Why:** user feedback: on the top and bottom edges the buttons stuck out of the pool while appearing and hiding; dragging the buttons in the pool always snapped them back; the blob never turned grey on their dark background.

**Decision:** the dark background was not reproduced on a live Creatio (the stand could not be opened in Chrome); the likely causes handled are a gradient or `oklch()` background, which the check skipped, and the blob being restored before Creatio drew its dark panel. A one-shot re-check, not polling, as the user asked to avoid periodic checks.

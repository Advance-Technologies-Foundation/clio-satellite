# Restored blob splats out of the edge

**What changed:** `edgeBlob.dock()` (called by `floatingContainer` when the blob was saved on a previous visit) now runs `splat()`: the blob grows out of the screen edge with a small overshoot and the orange dot fades in. Before, the blob was shown at once, about a second after the page opened.

**Why:** the blob appeared with no motion while the page was still loading, so it was easy to miss that the buttons were docked there.

**Decision:** reuse the splat of a freshly made blob instead of a separate animation, so a restored blob looks the same as one the user just made. The dot cannot fly from the icon here — the buttons are not on screen — so it fades in, as in the splat without an icon dot.

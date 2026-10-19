# Restored edge blob: only the dome rises

**What changed:** `src/edgeBlob.js` — `dock()` no longer slides the whole blob out of the edge. The skirt is drawn at once and only the dome rises (`riseDome` rebuilds the bell path every frame from `bellHeight(d, sink)` with the dome sunk less and less into the edge, easeOutBack, `DOME_RISE_MS` = 480 ms). The orange dot still fades in after it.

**Why:** on page load the thin ends of the skirt slid in from behind the edge together with the dome; a drop lying on a surface should keep its edges where they are and only swell in the middle.

**Decision:** morph the path instead of scaling the bell SVG: a scale away from the edge would also flatten and then grow the skirt, the same fault in a different form.

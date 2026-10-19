# Easier docking at a screen edge

**What changed:** `src/edgeBlob.js` — the cursor counts as held against an edge within `EDGE_CURSOR_SLACK` (4 px) instead of the last 1–2 px; the hold also starts when the buttons only touch the edge (new `cursorEdge`), and the wet spot is shown at least half grown during the hold. Unit tests for the slack, the wobble and the touch-only hold; an e2e test for the bottom edge.

**Why:** docking at the bottom was hard when the window ends at the screen edge. The cursor cannot go past the screen, so only the 600 ms hold can dock there, and the hold restarted on every wobble of a pixel or two away from the edge. Grabbed at their lower edge, the buttons never crossed the edge at all, so the hold did not even start.

**Decision:** a wider "held" zone rather than a shorter hold: a shorter hold would dock buttons that are only being moved along the edge. Not reproduced on a real screen (no browser was connected to the session); the e2e test reproduces the touch-only case, which fails without the change.

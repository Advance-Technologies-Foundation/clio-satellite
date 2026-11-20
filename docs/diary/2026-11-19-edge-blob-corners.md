# Edge blob can be docked right in a corner

**What changed** — `src/edgeBlob.js`: `clampAlong` lets the blob centre go to `CORNER_INSET` (= `DOME_C`, 7 px) from the end of the edge and sticks it there within `CORNER_SNAP` (30 px). `alongForRect` docks into the corner when the buttons are pushed past both edges at once. A blob slid along the edge, pushed diagonally into a corner or restored from storage sits right in the corner.

**Why** — the whole 100 px blob box was kept on screen, so the blob stopped 50 px short of the corner; users want to park it in the corner, out of the way of the page.

**Decision** — the dome centre is `DOME_C` from the edge it sits on; putting it as far from the other edge makes the dome fill the corner while the orange dot stays whole. No separate corner shape: the skirt past the corner is clipped by the viewport (the blob is `position: fixed`, nothing scrolls). The snap makes "stick it into the corner" work without pixel precision. Taking the blob round the corner onto the other edge was left out.

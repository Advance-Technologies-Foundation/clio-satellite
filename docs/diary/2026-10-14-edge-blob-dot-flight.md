# Orange dot flies between the blob and the icon; flatter blob

**What changed**
- `src/edgeBlob.js`: when the blob turns into the buttons (peek or tear-off) a separate orange dot (`.csl-edge-flydot`) flies from the blob's dot to the dot on the "Clio satellite" icon along a small arc; when the buttons go back into the blob it flies the other way. Both real dots are hidden during the 420 ms flight. New option `iconDot()`, constant `DOT_FLIGHT_MS`.
- The blob is flatter: it sticks out about 11 px from the edge instead of 14 and is spread along it. The dot, the hover area and the neck constants of the pull follow the new core centre.
- `src/menuBuilder.js`: the icon's orange circle got the class `csl-icon-dot`.

**Why**
The orange dot is the same object in both states; jumping from the blob to the buttons made the two look unrelated.

**Decision**
The target is measured on every animation frame, not once: the buttons are still popping in (scale animation) or follow the mouse after a tear-off, so a fixed end point would land next to the icon.

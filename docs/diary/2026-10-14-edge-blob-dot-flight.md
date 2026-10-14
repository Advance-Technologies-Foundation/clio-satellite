# Orange dot flies between the blob and the icon; bell-shaped blob

**What changed**
- `src/edgeBlob.js`: when the blob turns into the buttons (peek or tear-off) a separate orange dot (`.csl-edge-flydot`) flies from the blob's dot to the dot on the "Clio satellite" icon along a small arc; when the buttons go back into the blob it flies the other way. Both real dots are hidden during the 420 ms flight. New option `iconDot()`, constant `DOT_FLIGHT_MS`.
- The resting blob is now a bell like a drop of liquid on a surface: a low dome in the middle of a long skirt that thins out to nothing along the edge (36×100 box instead of 36×54). It is drawn as a crisp SVG path (`bellHeight`: a circle merged with a gaussian skirt by a smooth union of distance fields, so the dome is round, not pointed as a plain gaussian is), because the goo filter rounds off thin tails; the goo shapes stay inside it and form the neck only while the blob is pulled.
- `src/menuBuilder.js`: the icon's orange circle got the class `csl-icon-dot`.

**Why**
The orange dot is the same object in both states; jumping from the blob to the buttons made the two look unrelated.

**Decision**
The target is measured on every animation frame, not once: the buttons are still popping in (scale animation) or follow the mouse after a tear-off, so a fixed end point would land next to the icon.

The bell shape follows a sketch from the user: a dome with long thin edges along the screen edge.

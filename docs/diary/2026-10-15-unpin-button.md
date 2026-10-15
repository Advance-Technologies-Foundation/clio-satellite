# Unpin button for the buttons out of the edge blob

**What changed**
- `src/floatingContainer.js`: a `pin.slash` icon button joins the right side of the "Clio satellite" button while it is out of the docked blob. A click frees the button for good where it stands (blob state removed, position saved). Its tooltip is a separate fixed element beside the buttons.
- `src/edgeBlob.js`: `unpin()` runs the existing undock (the same as tearing the pool by a drag).
- `menu-item.css`: the button group gets a right segment during a peek; tooltip styles.

**Why**
Leaving the blob needed a drag of the buttons further than a button is high, which users did not discover. An explicit unpin control, visible only when the button belongs to the blob, makes it one click.

**Decision**
The tooltip is not a CSS pseudo-element: the buttons sit under their menus (z-index 9997 vs 9999), so a tooltip below the button was covered by the menus the peek opens. It stands beside the buttons instead. The slash of the icon is cut out of the pin with a stroke in the button colour (`--csl-unpin-bg`), like SF Symbols, without SVG masks or ids.

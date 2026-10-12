# Buttons stick to a screen edge as a blob; drags no longer open menus

**What changed:** new `src/edgeBlob.js`; `src/floatingContainer.js` passes every drag move to it. Dragging the buttons past any screen edge shows a black wet spot; 20 px past the edge (or holding the cursor at the screen edge for 0.6 s) they turn into a small black blob with an orange dot, without releasing the mouse. The blob slides along the edge while held, tears off into the buttons when pulled 70 px away, and turns back into the buttons on a click. The blob is remembered per page type and origin. Also: the click that ends a drag is swallowed, a press counts as a drag only after 4 px, and double-click no longer moves the buttons back next to the search.

**Why:** users wanted to park the buttons out of the way without losing them. Every drag opened a menu because the release landed on a button and fired its click; every plain click also marked the buttons as user-positioned. The double-click reset moved the buttons unexpectedly.

**Decision:** the concept was agreed on a local prototype first (`dev/prototype-edge-blob.html`, not shipped). Edge detection uses the union of the container and button boxes, because the buttons are absolutely positioned and the container box alone is almost empty — the right and bottom edges would only trigger with the buttons already off screen.

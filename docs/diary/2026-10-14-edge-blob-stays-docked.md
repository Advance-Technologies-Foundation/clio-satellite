# Edge blob stays docked; click or 2 s hover only peeks

**What changed:** `src/edgeBlob.js` no longer undocks the buttons on a click. A click on the blob, or resting the mouse on it for 2 s (`PEEK_HOVER_MS`), brings the buttons out next to the edge ("peek") while the blob state stays stored. The buttons go back into the blob 10 s (`PEEK_IDLE_MS`) after the mouse left them and their menus; the countdown is paused while the mouse is on any part of the extension. The only way to undock is to pull the blob away from the edge further than a button is high (was a fixed 70 px). `src/floatingContainer.js` measures the button height for the tear distance, does not save peek positions, and ignores drags on peeked buttons.

**Why:** after v2.10 users had to click the blob to reach the menu, and that click undocked the buttons for good, so docking had to be redone after every use.

**Decision:** peeked buttons cannot be dragged — otherwise a drag would be a second way to undock and the rule "only pulling the blob undocks" would not hold. The idle timer is driven by `mouseover` inside the extension root rather than by activity events, so a user who reads an open menu without moving the mouse does not lose it.

**Also fixed (found while checking in Chrome):** releasing the mouse within ~200 ms after the buttons became a blob opened the Clio satellite menu while the buttons were already hidden. The buttons were still squashing under the cursor, and the drag that ended in `onBlob` had removed its own `mouseup` handler, so the closing click was not swallowed. `endDrag` in `src/floatingContainer.js` now swallows the click that ends this press. The bug existed since v2.10.

**Follow-up — both menus open from the blob:** buttons that come out of the docked blob (click or 2 s hover) now open the navigation and the actions menu at once, side by side (`placeMenusSideBySide` in `src/menuVisibility.js`, `openBothMenus` in `src/menuBuilder.js`). Every action is now two clicks away in every mode: blob + item when docked, button + item otherwise. The menus open when the pop-in ends, because their position is computed from the button boxes that the pop-in scales; the outside-click handler ignores the click on the blob that opened them.

**Follow-up — a click on the page closes the peek:** a press anywhere outside the extension while the buttons are out of the blob now squashes them back into it at once, not only their menus. `src/edgeBlob.js` listens to `mousedown` on the document in the capture phase, so a Creatio handler that stops the event cannot keep the buttons out.

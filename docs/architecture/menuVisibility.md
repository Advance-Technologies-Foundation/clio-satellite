## menuVisibility.js

**Purpose:** Shows, hides and places the drop-down menu of the one "Clio satellite" button.

**Public API:**
- `showMenuContainer(menu)`, `hideMenuContainer(menu)` — toggle the `visible` / `hidden` classes
- `adjustMenuPosition(button, menu)` — fixed position 8 px under the button; at the right screen edge shifted left so it ends in line with the last button (the unpin button when it is shown), flipped above the button at the bottom edge, and opened beside the buttons when it fits neither below nor above them

**Key decisions:**
- When the menu fits neither below nor above the button (a short window, or buttons halfway down a side edge), it opens beside the buttons: right of them, or left when there is no room on the right, with its top kept on screen. Before, it went above the button with a negative top, and its first items (What's new, navigation) were off screen. It is placed beside the buttons, not over them, so it never covers the button or the unpin button. The box of the buttons is measured on their wrapper (`.creatio-satelite`, the menu button plus the unpin button): the floating container itself has no size. The same box is used at the right screen edge: lined up with the menu button alone, the menu stopped a button's width short of the unpin button and left a gap to the screen edge.
- Placement measures the menu after a forced reflow while it is `visibility: hidden` and at the left edge of the screen, so there is no visible jump. Measured under a button near the right edge, the fixed menu was squeezed to the room left of the screen edge and reported a narrower box; it then ended a few pixels short of the unpin button.

**Dependencies:** `debug.js`

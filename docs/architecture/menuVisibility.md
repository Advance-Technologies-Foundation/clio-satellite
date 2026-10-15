## menuVisibility.js

**Purpose:** Shows, hides and places the two drop-down menus (navigation and actions) under the one "Clio satellite" button.

**Public API:**
- `showMenuContainer(menu)`, `hideMenuContainer(menu)` — toggle the `visible` / `hidden` classes
- `adjustMenuPosition(button, menu)` — fixed position 8 px under the button; shifted left at the right screen edge, flipped above the button at the bottom edge
- `sideBySideLefts(first, second, vw, gap?)` — pure: left offsets for two open menus so the second starts right of the first; the pair moves left together at the right edge, and the first menu stays on screen when the pair is wider than the screen
- `placeMenusSideBySide(button, firstMenu, secondMenu)` — places both menus under the same button with `adjustMenuPosition`, then corrects their `left` with `sideBySideLefts` so the second sits right of the first

**Key decisions:**
- Both menus hang off one button, so the plain placement would put the actions menu on top of the navigation menu. Only the horizontal position is corrected; each menu keeps its own vertical flip.
- Placement measures the menus after a forced reflow while they are `visibility: hidden`, so there is no visible jump.

**Dependencies:** `debug.js`

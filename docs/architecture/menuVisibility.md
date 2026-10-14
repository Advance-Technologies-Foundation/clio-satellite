## menuVisibility.js

**Purpose:** Shows, hides and places the two drop-down menus (navigation and actions) next to their buttons.

**Public API:**
- `showMenuContainer(menu)`, `hideMenuContainer(menu)` — toggle the `visible` / `hidden` classes
- `adjustMenuPosition(button, menu)` — fixed position 8 px under the button; shifted left at the right screen edge, flipped above the button at the bottom edge
- `sideBySideLefts(first, second, vw, gap?)` — pure: left offsets for two open menus so the second starts right of the first; the pair moves left together at the right edge, and the first menu stays on screen when the pair is wider than the screen
- `placeMenusSideBySide(firstButton, firstMenu, secondButton, secondMenu)` — places both menus with `adjustMenuPosition`, then corrects their `left` with `sideBySideLefts`

**Key decisions:**
- The navigation menu is wider than its button, so with both menus open the plain per-button placement would put the actions menu on top of it. Only the horizontal position is corrected; each menu keeps its own vertical flip.
- Placement measures the menus after a forced reflow while they are `visibility: hidden`, so there is no visible jump.

**Dependencies:** `debug.js`

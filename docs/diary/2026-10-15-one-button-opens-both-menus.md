# One button opens both menus

**What changed**
- `src/menuBuilder.js`: removed the separate "Quick actions" (lightning) button. The "Clio satellite" button now opens the navigation and the actions menus together, side by side, and a second click closes both. Picking an item in either menu, or clicking on the page, closes both.
- `src/menuVisibility.js`: `placeMenusSideBySide(button, firstMenu, secondMenu)` places both menus under one button.
- `src/observer.js`: `monitorButtons` no longer requires `.actions-button` to consider the menu intact.
- `menu-item.css`, `styles/shell.css`: dropped the actions button rules; the main button is rounded on all corners now that it is not the left half of a group.

**Why**
The docked edge blob already opened both menus with one click, while the free buttons needed a click on the right one. One button gives the same UX in both modes and removes a decision for the user.

**Decision**
The two menus stay separate (navigation vs. actions) instead of being merged into one list, so the actions stay visually apart from navigation and the existing `menu_open`/`menu_click` analytics values (`navigation`, `actions`) keep their meaning.

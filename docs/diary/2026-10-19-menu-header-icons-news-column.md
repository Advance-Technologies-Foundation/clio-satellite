# Menu header icons and a news column in the menu panel

**What changed**
- `src/menuBuilder.js`, `src/menuConfig.js`, `menu-item.css`: Settings is no longer the last navigation row. The panel has a header with two icon buttons in its top-right corner: a gear (tooltip "Settings", opens Options) and, to its right, an open book (tooltip "Developer news", opens the news page on GitHub Pages in a new tab).
- `src/news/shellIndicator.js`, `styles/news.css`: the "What's new" row and its flyout are gone. While there are unread news, the panel has a news column on the left of the navigation column with the cards, a count, "Mark as read" and "Choose topics". "Mark as read" hides the column; closing the menu no longer marks news as read.

**Why**
Requested after reviewing PR #30 (one menu panel): Settings as a row took a line among the navigation items, and the news needed a click on a row to be seen, then disappeared as read as soon as the menu closed.

**Decision**
The column is part of the panel (prepended to `.csl-menu-body`) rather than a flyout, so `adjustMenuPosition` places one box and nothing drifts apart. `attachShellNews` gets an `onLayoutChange` callback to place the open menu again when the column appears or disappears.

**Follow-up: placement tests**
- New `tests/e2e/menuPlacement.spec.js` (registered in `playwright.config.js`): the panel opened from a blob docked at each edge (near both corners and in the middle) and from free buttons dragged near each corner, with and without the news column. Each case checks that the panel is fully on screen, covers no button, keeps the header icons in its top-right corner, and that the news column sits left of the items and ends inside the window. Also covered: a 480 px window and "Mark as read" at the right edge.
- Checked by hand that cards with an image or a YouTube poster fit the 300 px column (media 260×120, cropped).

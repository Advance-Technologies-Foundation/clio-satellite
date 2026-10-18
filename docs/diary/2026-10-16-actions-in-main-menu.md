# Actions in a column of the main menu, App Hub caption

**What changed:**
- `src/menuBuilder.js`: the separate actions menu (`.actions-menu-container`) is gone. Restart App, Flush Redis DB and the autologin toggle are the right-hand column (`.csl-actions-section`) of the one menu panel; navigation and Settings are the left-hand column (`.csl-nav-column`).
- `src/menuConfig.js`: `Application_Managment` is shown as "App Hub" (the script file name is unchanged).
- `src/menuVisibility.js`: `placeMenusSideBySide` and `sideBySideLefts` removed; `adjustMenuPosition` opens the menu beside the buttons when it fits neither below nor above them, and at the right screen edge lines its right edge up with the unpin button instead of the menu button (it used to leave a 34 px gap to the screen edge).
- `src/news/shellIndicator.js`: `raiseMenu` removed — it only kept the flyout above the actions menu.
- Dead `.actions-menu-container` selectors removed from `menu-item.css` and `styles/shell.css`.

**Why:** two menus opened by one button were placed differently on every page (side by side, one under the other, off the screen edge) and the actions menu covered the news flyout. "App Hub" is what Creatio calls the page the item opens.

**Decision:** two columns in one panel. Tiles cut long captions. One list with the actions between Configuration and Settings was the first version of this change; review (Vladimir Nikonov) rejected it: unsafe actions must stay apart from navigation, close to the button, and five items in a column are easier to scan than ten. Both columns have the same width, the wider of their longest captions plus 20 px; the fixed widths the two menus had left the navigation column with an empty strip on the right. The merged menu is taller, so in a short window it went above the button with its top off screen; it now opens beside the buttons instead — over them it would cover the unpin button. `menu_click` keeps `menu: 'actions'` for the actions so usage reports stay comparable; the separate `menu_open {menu: 'actions'}` event is no longer sent.

# Actions in the main menu, App Hub caption

**What changed:**
- `src/menuBuilder.js`: the separate actions menu (`.actions-menu-container`) is gone. Restart App, Flush Redis DB and the autologin toggle are a group (`.csl-actions-section`) in the one menu, between Configuration and Settings.
- `src/menuConfig.js`: `Application_Managment` is shown as "App Hub" (the script file name is unchanged).
- `src/menuVisibility.js`: `placeMenusSideBySide` and `sideBySideLefts` removed; `adjustMenuPosition` opens the menu beside the buttons when it fits neither below nor above them, and at the right screen edge lines its right edge up with the unpin button instead of the menu button (it used to leave a 34 px gap to the screen edge).
- `src/news/shellIndicator.js`: `raiseMenu` removed — it only kept the flyout above the actions menu.
- Dead `.actions-menu-container` selectors removed from `menu-item.css` and `styles/shell.css`.

**Why:** two menus opened by one button were placed differently on every page (side by side, one under the other, off the screen edge) and the actions menu covered the news flyout. "App Hub" is what Creatio calls the page the item opens.

**Decision:** one list, not tiles: tiles cut long captions. The merged menu is taller, so in a short window it went above the button with its top off screen; it now opens beside the buttons instead — over them it would cover the unpin button. `menu_click` keeps `menu: 'actions'` for the actions so usage reports stay comparable; the separate `menu_open {menu: 'actions'}` event is no longer sent.

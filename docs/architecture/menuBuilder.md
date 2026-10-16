## menuBuilder.js

**Purpose:** Builds the one menu injected into Creatio pages: the navigation items, then the actions (RestartApp, FlushRedis, autologin toggle) as a group between Configuration and Settings, then Settings.

**Public API:**
- `buildMenuContent(buttonWrapper, pageType): void` — entry point; builds both menus and attaches them to `buttonWrapper`

**Key decisions:**
- The actions sit in `.csl-actions-section` (`role="group"`) inside the menu, between two dividers. They used to be a second menu beside the first; the pair was hard to place (it ran off the screen and covered the news flyout), so they were merged into one menu. Items come from `ACTION_DETAILS`; RestartApp and FlushRedisDB are added synchronously on every open so the menu has its full height when it is placed; the autologin item needs `chrome.storage.sync`, is added when a last-login profile exists for the current origin, and the menu is placed again once it is there.
- Autologin enable/disable reads and writes `chrome.storage.sync` directly (not via background) because it modifies only the profile array, not runtime state.
- `safeSendMessage` is used for script execution and disable-autologin to route through the background worker.
- Menu captions come from `SCRIPT_LABELS` when present, otherwise from the script name with underscores replaced. This lets a caption be corrected without renaming the script file that `executeScript` loads (`Application_Managment` is shown as "App Hub").
- There is one button ("Clio satellite"); the separate actions button is gone. Its click opens the menu (`openMenu`) and a second click, a click on the page or picking an item closes it (`hideMenu`). A click inside the menu that is not on an item keeps it open. `monitorButtons` only checks for this button.
- Visual styling of the buttons and menus lives in `menu-item.css` (the "Visual refresh" block at the end overrides earlier rules); the divider color is set inline because Creatio styles override `mat-divider`.

- The extension container is appended to `<html>`, not `<body>`: Creatio marks `<body>` as `inert` while Shell loads, which would block clicks and focus on the visible buttons.
- Icons are inline duotone SVGs (`MENU_ICONS.svg`, `ACTION_DETAILS.icon`, and the button icon here): outline `currentColor`, accent `var(--csl-icon-accent)`, no ids/masks so they can be inlined many times. Colours are set in `menu-item.css`.

- The button that comes out of the docked edge blob runs the same `openMenu` (passed to `setupFloatingContainer` as `onPeekShown`), so the blob and the free button behave the same: one click shows the menu, every action is two clicks away. The menu is placed by `adjustMenuPosition`; the outside-click handler ignores clicks on the blob, since that click is what opened the menu.
- The orange dot of the "Clio satellite" icon carries the class `csl-icon-dot`: `edgeBlob.js` flies the dot of the blob into it and back.
- `createScriptsMenu()` attaches the developer news indicator (`attachShellNews`) last and isolates it: a sync throw or async rejection is logged and never marks the menu as failed, so news can not trigger the menu re-creation loop.

**Dependencies:** `debug.js`, `state.js`, `pageDetection.js`, `menuConfig.js`, `menuVisibility.js`, `analytics.js` (usage events)
- Usage statistics: opening the menu sends `menu_open {menu: 'navigation'}`; a click sends `menu_click {menu, item}` with `menu: 'navigation'` for navigation items and Settings and `menu: 'actions'` for the actions, as before the merge, so the reports stay comparable (see `analytics.md`).

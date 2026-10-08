## menuBuilder.js

**Purpose:** Builds the two menus injected into Creatio pages: the scripts menu (navigation/admin actions list) and the actions menu (RestartApp, FlushRedis, autologin toggle).

**Public API:**
- `buildMenuContent(buttonWrapper, pageType): void` — entry point; builds both menus and attaches them to `buttonWrapper`

**Key decisions:**
- Actions menu items are generated from `ACTION_DETAILS` config; the autologin toggle item is added only when a last-login profile exists for the current origin.
- Autologin enable/disable reads and writes `chrome.storage.sync` directly (not via background) because it modifies only the profile array, not runtime state.
- `safeSendMessage` is used for script execution and disable-autologin to route through the background worker.
- Menu captions come from `SCRIPT_LABELS` when present, otherwise from the script name with underscores replaced. This lets a caption be corrected without renaming the script file that `executeScript` loads.
- The icon-only actions button carries `aria-label` and `title` ("Quick actions"). The CSS tooltip in `styles/shell.css` is never visible because `menu-item.css` sets `overflow: hidden` on the button, so the native `title` tooltip is what the user sees.
- Visual styling of the buttons and menus lives in `menu-item.css` (the "Visual refresh" block at the end overrides earlier rules); the divider color is set inline because Creatio styles override `mat-divider`.

- The extension container is appended to `<html>`, not `<body>`: Creatio marks `<body>` as `inert` while Shell loads, which would block clicks and focus on the visible buttons.
- Icons are inline duotone SVGs (`MENU_ICONS.svg`, `ACTION_DETAILS.icon`, and the two button icons here): outline `currentColor`, accent `var(--csl-icon-accent)`, no ids/masks so they can be inlined many times. Colours are set in `menu-item.css`.

- `createScriptsMenu()` attaches the developer news indicator (`attachShellNews`) last and isolates it: a sync throw or async rejection is logged and never marks the menu as failed, so news can not trigger the menu re-creation loop.

**Dependencies:** `debug.js`, `state.js`, `pageDetection.js`, `menuConfig.js`, `menuVisibility.js`, `analytics.js` (usage events)
- Usage statistics: opening either menu sends `menu_open {menu}` and every item click sends `menu_click {menu, item}` through `src/analytics.js` (see `analytics.md`).

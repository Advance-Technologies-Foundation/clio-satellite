## menuBuilder.js

**Purpose:** Builds the two menus injected into Creatio pages: the scripts menu (navigation/admin actions list) and the actions menu (RestartApp, FlushRedis, autologin toggle).

**Public API:**
- `buildMenuContent(buttonWrapper, pageType): void` — entry point; builds both menus and attaches them to `buttonWrapper`

**Key decisions:**
- Actions menu items are generated from `ACTION_DETAILS` config; the autologin toggle item is added only when a last-login profile exists for the current origin.
- Autologin enable/disable reads and writes `chrome.storage.sync` directly (not via background) because it modifies only the profile array, not runtime state.
- `safeSendMessage` is used for script execution and disable-autologin to route through the background worker.

**Dependencies:** `debug.js`, `state.js`, `pageDetection.js`, `menuConfig.js`, `menuVisibility.js`

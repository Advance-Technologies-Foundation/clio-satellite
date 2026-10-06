## 2026-10-06 — Visual refresh of the login panel and the Shell menu

**What changed:**
- `login/login.js`, `styles/login.css`: the injected login controls are now one card with a small "Clio satellite" header. Order is profile selector, "Login with profile" (primary, orange), then Environments and Profiles as neutral secondary buttons in one row. Inline styles moved to CSS; the panel width follows the native login button. Text is sentence case instead of uppercase. Added focus-visible rings and reduced-motion handling.
- `menu-item.css`: Shell/Configuration buttons are now one joined graphite group with orange icons instead of separate blue and orange buttons. Menus use a neutral shadow, inset rounded hover rows, muted icons that turn orange on hover, and a short open animation.
- `src/menuBuilder.js`, `src/menuConfig.js`: menu caption "Application Managment" shown as "Application management" via `SCRIPT_LABELS` (the script file name is unchanged). The menu divider is a dim line instead of a bright one. The icon-only actions button got `aria-label` and `title` ("Quick actions"); before, it had no name and no visible tooltip (the CSS tooltip in `styles/shell.css` is clipped by `overflow: hidden` on the button).
- Tests: `tests/e2e/loginPanel.spec.js` (new), two unit tests in `tests/menuBuilder.test.js`, real-site login spec now targets `.login-with-profile-button`, and its empty-storage test waits for the default Supervisor profile that `background.js` seeds on install before clearing storage (it failed on a fresh Chrome profile before).

**Why:** Three equally loud full-width buttons (black, blue, orange) competed with the native Creatio login button, and the primary action was last. In Shell the two differently colored buttons and the purple-tinted menu shadow did not match Creatio.

**Decision:** Kept the button label "Login with profile" and the classes `auto-login-button` / `settings-button` / `environments-button` so existing automation that looks for them keeps working. No web fonts are loaded: the panel inherits the host page font, so no requests go to third-party hosts.

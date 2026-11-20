## login (login/login.js, login/login-events.js, styles/login.css)

**Purpose:** On the Creatio login page, add one row with the saved-profile selector (with the
extension pages inside the dropdown) and a "Login with profile" button, and log in automatically
with the last used profile when its autologin flag is on.

**Public API (classic scripts, shared global scope, `login-events.js` loads first):**
- `getLoginElements() → { usernameField, passwordField, loginButton }` — Creatio ids first, generic
  selectors as fallback.
- `fillLoginField(field, value)` — sets the value and dispatches `input`, `change`, `blur`, `focusout`.
- `loginWithSelectedProfile(trigger)` — fills both fields from the selected option, clicks the
  native login button, logs the outcome; `trigger` is `button` (user click) or `autologin`.
- `registerLoginEvents(loginCaption)` — wires the "Login with profile" button.
- `autologinLog(event, details)` — diagnostic entry to the console and to
  `chrome.storage.local.autologinLog` (last 100). Events: `form-found`, `autologin-skipped` (with
  `reason`), `autologin-start`, `login-clicked`, `login-skipped`, `still-on-login-page` (8 s after the
  click, with visible validation messages). Every entry has `time`, `origin`, `readyState`,
  `visibility`, `hasFocus`. Read it from the service worker console:
  `chrome.storage.local.get('autologinLog', console.log)`.
- `login.js` — self-running IIFE that polls every 500 ms until the form exists.

**Key decisions:**
- Creatio's `Terrasoft.TextEdit` updates its model only on the field's `blur`; `focus()` fires no
  events in an unfocused window, so the blur is dispatched explicitly.
- The log is written only on Creatio login pages (`#loginEdit-el`), holds no passwords and stays local.
- `login.js` also runs on non-Creatio pages (`<all_urls>`); without `#passwordEdit-wrap` it stops.

**Dependencies:** `chrome.storage.sync` (`userProfiles`, `lastLoginProfiles`), `chrome.storage.local`
(`autologinLog`), `chrome.runtime.sendMessage` (open Options / Environments pages).

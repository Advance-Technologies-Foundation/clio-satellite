## pageDetection.js

**Purpose:** Classify the current tab as one of `"shell" | "configuration" | "login" | null`. Drives whether the floating menu is created (shell/configuration) and whether content-script behaviour stays passive (login or `null`).

**Public API:**
- `getCreatioPageType(): "shell" | "configuration" | "login" | null` — runs detection in this fixed order:
  1. Domain blocklist (`EXCLUDED_DOMAINS` from `menuConfig.js`, substring match on `hostname`) → `null`.
  2. Login indicators (any of: `#loginEdit-el`, `#passwordEdit-el`, `.login-button-login`, path is `/login[/...]` or `/auth[/...]`) → `"login"`.
  3. `<ts-workspace-section>` present → `"configuration"`.
  4. Shell indicators: any one of the platform-specific custom elements `<crt-app-toolbar>`, `<crt-root>`, `<crt-page>`, `<crt-schema-outlet>`, `<crt-reusable-schema>`, `<mainshell>`, `#ShellContainerWithBackground`, `[data-item-marker="AppToolbarGlobalSearch"]` — OR URL substring match against `SHELL_URL_PATTERNS` (`/shell/`, `/clientapp/`, `#section`, `#shell`, `workspaceexplorer`, `listpage`, `cardpage`, `dashboardmodule`) → `"shell"`.
  5. Otherwise `null`.
- `isShellPage(): boolean` — convenience for `"shell" | "configuration"`.

**Key decisions:**
- Detectors are intentionally strict and platform-specific. Earlier versions used broad signals (`script[src*="creatio"]`, `link[href*="creatio"]`, `[class*="shell"]`, `[id*="login"]`, `currentUrl.includes("login")`, generic `input[name*="username"]` etc.). Those matched any creatio-owned marketing site (because it self-loads creatio assets) and any random page with a "Log in" link, which caused the plugin to render its menu on `creatio.com`. Each remaining selector is uniquely a Creatio Freedom UI / classic-shell marker, so a single match is enough (`minRequired = 1`).
- Login detection is path-anchored (`/login`, `/auth` exact or with trailing segment) instead of substring (`includes("login")`) to avoid matching marketing URLs like `/products/customer-360-listpage`.
- Domain blocklist matches via `hostname.includes(domain)`, so adding a bare apex like `creatio.com` would also exclude legitimate `*.creatio.com` tenants. Marketing subdomains are listed individually (`www.creatio.com`, `marketplace.creatio.com`, etc.); the bare apex is left unmatched on purpose and handled by the strict DOM detection above.

**Dependencies:** `debug.js` (logging only), `menuConfig.js` (`EXCLUDED_DOMAINS`, `SHELL_URL_PATTERNS`).

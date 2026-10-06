## icons.js

**Purpose:** Renders the raster UI icons from `icons/ui/*.png` inside injected Creatio pages, with an inline-SVG fallback.

**Public API:**
- `ICON_DIR` — `'icons/ui/'`
- `getIconUrl(file): string | null` — `chrome.runtime.getURL(ICON_DIR + file)`; `null` when no file is given or the extension context is invalidated (`getURL` throws or is missing).
- `renderIcon(container, file, fallbackSvg): Element` — puts an `<img class="creatio-satelite-icon" alt="">` into `container`; if the URL is unavailable or the image fails to load, puts `fallbackSvg` instead.

**Key decisions:**
- Icons are listed in `web_accessible_resources` (`icons/ui/*`) — without it Creatio pages cannot load `chrome-extension://` URLs.
- Icons are decorative (`alt=""`); the accessible name comes from the menu caption or the button `aria-label`.
- Full-colour PNGs ignore `currentColor`; hover effects use `transform`/`filter` in `menu-item.css`.
- `login/login.js` is a plain content script (not bundled), so it carries its own copy of the same logic.

**Dependencies:** none (uses the global `chrome.runtime`).

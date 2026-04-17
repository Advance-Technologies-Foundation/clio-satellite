## positionManager.js

**Purpose:** Persists and restores the floating menu position per page type and origin. Positions the container relative to the Creatio global search bar as a fallback.

**Public API:**
- `saveMenuPosition(x, y, pageType): void` — stores position in `chrome.storage.local` with a timestamp; key is `menuPosition_{pageType}_{origin}`
- `loadMenuPosition(pageType, callback): void` — reads stored position; calls `callback(x, y)` or `callback(null, null)` if missing/expired; auto-removes entries older than 30 days
- `positionFloatingContainerRelativeToSearch(floatingContainer?): boolean` — positions container next to `crt-global-search` or `action-button`; returns `true` if positioned
- `applySavedPosition(floatingContainer, x, y): boolean` — applies clamped coordinates and sets `data-user-positioned`

**Key decisions:**
- 30-day TTL on saved positions prevents stale coordinates after layout changes.
- Position key includes `window.location.origin` so shell and config pages on different domains don't share positions.

**Dependencies:** `debug.js`

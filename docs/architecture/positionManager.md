## positionManager.js

**Purpose:** Persists and restores the floating menu position per page type and origin. Positions the container relative to the Creatio global search bar as a fallback.

**Public API:**
- `saveMenuPosition(x, y, pageType): void` — stores position in `chrome.storage.local` with a timestamp; key is `menuPosition_{pageType}_{origin}`
- `loadMenuPosition(pageType, callback): void` — reads stored position; calls `callback(x, y)` or `callback(null, null)` if missing/expired; auto-removes entries older than 30 days
- `positionFloatingContainerRelativeToSearch(floatingContainer?): boolean` — positions container next to `crt-global-search` or `action-button`; returns `true` if positioned
- `applySavedPosition(floatingContainer, x, y): boolean` — applies clamped coordinates and sets `data-user-positioned`
- `saveAutoPosition(pageType, x, y): void` — remembers the last search-based position (`menuAutoPosition_{pageType}_{origin}`, with the window width); skips the write when nothing changed
- `loadAutoPosition(pageType, callback): void` — `callback(pos)` or `callback(null)` when missing or saved for another window width
- `applyAutoPosition(floatingContainer, pos): void` — applies the remembered position and sets `data-auto-restored`
- `resetAutoPositionCache(): void` — test helper that forgets the last written value

**Key decisions:**
- 30-day TTL on saved positions prevents stale coordinates after layout changes.
- Search-based positioning moves the container only after the search rect has stayed the same for 120 ms (it retries by itself). The search field animates its width when it appears; positioning against an intermediate size made the buttons jump.
- While `data-auto-restored` is set and no anchor exists yet, the fallback (centre of the screen) is skipped, so the buttons stay where they appeared.
- The auto position is stored separately from the user's drag position and is only used when the window width matches, because the toolbar layout depends on it.
- Position key includes `window.location.origin` so shell and config pages on different domains don't share positions.

**Dependencies:** `debug.js`

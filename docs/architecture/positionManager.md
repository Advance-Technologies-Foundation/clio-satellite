## positionManager.js

**Purpose:** Persists and restores the floating menu position per page type and origin. Positions the container relative to the Creatio global search bar as a fallback.

**Public API:**
- `saveMenuPosition(x, y, pageType): void` — stores position in `chrome.storage.local` with a timestamp; key is `menuPosition_{pageType}_{origin}`
- `loadMenuPosition(pageType, callback): void` — reads stored position; calls `callback(x, y)` or `callback(null, null)` if missing/expired; auto-removes entries older than 30 days
- `positionFloatingContainerRelativeToSearch(floatingContainer?): boolean` — positions container 20 px after the toolbar group of `crt-global-search` (or `action-button`); returns `true` if positioned
- `anchorRightEdge(target, floatingContainer?): number` — right edge of the anchor plus the visible siblings that follow it in the same row (gaps ≤ 48 px); used so the buttons never cover Creatio controls placed after the search
- `applySavedPosition(floatingContainer, x, y): boolean` — applies clamped coordinates and sets `data-user-positioned`
- `saveAutoPosition(pageType, x, y): void` — remembers the last search-based position (`menuAutoPosition_{pageType}_{origin}`, with the window width); skips the write when nothing changed
- `loadAutoPosition(pageType, callback): void` — `callback(pos)` or `callback(null)` when missing or saved for another window width
- `applyAutoPosition(floatingContainer, pos): void` — applies the remembered position and sets `data-auto-restored`
- `resetAutoPositionCache(): void` — test helper that forgets the last written value

**Key decisions:**
- The buttons go after the search's whole toolbar group, not after the search itself: some Creatio products put their own controls right after the search (CPQ: `crt-operator-state`, the chat operator status button). Only the search gets this treatment (the `action-button` fallback keeps `right + 20`), and `observer.monitorButtons()` uses the same edge for its drift check. Only following siblings in the same row are counted, and the extension's own container ends the walk, and a gap over 48 px ends the group, so the right-hand toolbar group is never included. The stability check keys on this edge, so a control that appears late moves the buttons once it settles.
- 30-day TTL on saved positions prevents stale coordinates after layout changes.
- Search-based positioning moves the container only after the search rect has stayed the same for 120 ms (it retries by itself). The search field animates its width when it appears; positioning against an intermediate size made the buttons jump.
- While `data-auto-restored` is set and no anchor exists yet, the fallback (centre of the screen) is skipped, so the buttons stay where they appeared.
- The auto position is stored separately from the user's drag position and is only used when the window width matches, because the toolbar layout depends on it.
- Position key includes `window.location.origin` so shell and config pages on different domains don't share positions.

**Dependencies:** `debug.js`

## floatingContainer.js

**Purpose:** Creates and manages the draggable floating container that holds the Clio Satellite buttons. Handles drag, resize, position save/restore, and visibility.

**Public API:**
- `setupFloatingContainer(pageType, buttonWrapper, extensionContainer): HTMLElement` — builds the floating `div`, attaches drag handlers, loads saved position, sets up resize listener and MutationObserver (shell only)

**Key decisions:**
- Double-click resets position to auto (removes `data-user-positioned`, clears storage, re-runs `positionFloatingContainerRelativeToSearch`).
- Opacity fades in over 0.3 s on every page type (it was 3 s on Shell, which made the buttons look unavailable).
- When the user never dragged the buttons, the last auto position is restored and shown at once (`loadAutoPosition`), before the search bar renders; the search-based positioning then confirms the spot. Shell keeps more aggressive retry intervals because the search bar renders late.
- The container carries `data-page-type` so `positionManager` can store the auto position per page type.
- `resizeAbortController` tears down the previous resize listener whenever `setupFloatingContainer` is called again, preventing listener accumulation.

**Dependencies:** `debug.js`, `positionManager.js`

## floatingContainer.js

**Purpose:** Creates and manages the draggable floating container that holds the Clio Satellite buttons. Handles drag, resize, position save/restore, and visibility.

**Public API:**
- `setupFloatingContainer(pageType, buttonWrapper, extensionContainer): HTMLElement` — builds the floating `div`, attaches drag handlers, loads saved position, sets up resize listener and MutationObserver (shell only)

**Key decisions:**
- Double-click resets position to auto (removes `data-user-positioned`, clears storage, re-runs `positionFloatingContainerRelativeToSearch`).
- Shell page uses a longer opacity transition (3 s) and more aggressive position retry intervals because the search bar renders late.
- `resizeAbortController` tears down the previous resize listener whenever `setupFloatingContainer` is called again, preventing listener accumulation.

**Dependencies:** `debug.js`, `positionManager.js`

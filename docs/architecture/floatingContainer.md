## floatingContainer.js

**Purpose:** Creates and manages the draggable floating container that holds the Clio Satellite buttons. Handles drag, resize, position save/restore, visibility, and hands the buttons over to the edge blob (`edgeBlob.js`).

**Public API:**
- `setupFloatingContainer(pageType, buttonWrapper, extensionContainer): HTMLElement` — builds the floating `div`, attaches drag handlers, creates the edge blob controller, restores a saved blob or the saved position, sets up resize listener and MutationObserver (shell only)
- `DRAG_THRESHOLD` — px the mouse has to move before a press on the buttons counts as a drag

**Key decisions:**
- A press becomes a drag only after the mouse moves `DRAG_THRESHOLD` (4 px). A plain click neither moves nor saves the position, so it no longer marks the buttons as user-positioned.
- The click that ends a drag is swallowed by a capture listener on the container: it lands on a button and used to open that button's menu after every drag. The flag is cleared on the next tick, so a drag released outside the buttons does not eat a later real click. Open menus are closed when a drag starts.
- Double-click does nothing. It used to send the buttons back next to the search, which surprised users who double-clicked a button.
- The buttons wrapper is absolutely positioned inside the container, so the container box can be much smaller than the visible buttons. Clamping to the viewport and edge detection use the union of both boxes (`visualBox`).
- Edge blob: every drag move passes the unclamped box of the buttons to `edgeBlob.press()`. When the blob takes over (`onBlob`) the drag ends at once, the buttons get `data-edge-docked` (hidden by the blob stylesheet) and `data-user-positioned`, so search-based positioning never brings them back. A click on the blob (`onRestore`) shows the buttons 8 px from that edge and saves that position; tearing the blob off (`onTearOff`) shows them under the cursor and continues the same drag.
- Opacity fades in over 0.3 s on every page type (it was 3 s on Shell, which made the buttons look unavailable).
- When the user never dragged the buttons, the last auto position is restored and shown at once (`loadAutoPosition`), before the search bar renders; the search-based positioning then confirms the spot. Shell keeps more aggressive retry intervals because the search bar renders late.
- The container carries `data-page-type` so `positionManager` can store the auto position per page type.
- `resizeAbortController` tears down the previous resize listener whenever `setupFloatingContainer` is called again, preventing listener accumulation.

**Dependencies:** `debug.js`, `positionManager.js`, `edgeBlob.js` (blob controller and its storage), `menuVisibility.js` (closing menus when a drag starts or the buttons become a blob)

## floatingContainer.js

**Purpose:** Creates and manages the draggable floating container that holds the Clio Satellite buttons. Handles drag, resize, position save/restore, visibility, and hands the buttons over to the edge blob (`edgeBlob.js`).

**Public API:**
- `setupFloatingContainer(pageType, buttonWrapper, extensionContainer, { onPeekShown }?): HTMLElement` — builds the floating `div`, attaches drag handlers, creates the edge blob controller, restores a saved blob or the saved position, sets up resize listener and MutationObserver (shell only)
- `DRAG_THRESHOLD` — px the mouse has to move before a press on the buttons counts as a drag

**Key decisions:**
- A press becomes a drag only after the mouse moves `DRAG_THRESHOLD` (4 px). A plain click neither moves nor saves the position, so it no longer marks the buttons as user-positioned.
- The click that ends a drag is swallowed by a capture listener on the container: it lands on a button and used to open that button's menu after every drag. The flag is cleared on the next tick, so a drag released outside the buttons does not eat a later real click. Open menus are closed when a drag starts.
- Double-click does nothing. It used to send the buttons back next to the search, which surprised users who double-clicked a button.
- The buttons wrapper is absolutely positioned inside the container, so the container box can be much smaller than the visible buttons. Clamping to the viewport and edge detection use the union of both boxes (`visualBox`).
- Edge blob: every drag move passes the unclamped box of the buttons to `edgeBlob.press()`. When the blob takes over (`onBlob`) the drag ends at once and the click that ends this press is swallowed (the buttons still squash under the cursor for 200 ms, a quick release would open a menu), the buttons get `data-edge-docked` (hidden by the blob stylesheet) and `data-user-positioned`, so search-based positioning never brings them back. While docked, the blob may bring the buttons out for a while (`onPeek`): they stand 8 px from that edge with `data-edge-peek`, their position is not saved, and they cannot be dragged — only pulling the blob undocks them. `onPeekShown` is called when their pop-in has finished (menus are placed from the button boxes, which the pop-in scales) and only if the buttons are still out. `onPeekEnd` closes their menus before they are squashed back into the blob. The tear distance passed to the blob is the height of a button, remembered from when it was last visible (a hidden button measures 0), with `TEAR_DISTANCE` as the fallback for a blob restored on page load. Tearing the blob off (`onTearOff`) shows the buttons under the cursor and continues the same drag.
- Container animations (the pop-in out of the blob) scale its box. A new drag cancels them before measuring, the tear-off starts its drag before the pop-in, and the end of a drag saves the `left`/`top` it set rather than the bounding box, so neither a jump nor a scaled position can happen mid-animation.
- Opacity fades in over 0.3 s on every page type (it was 3 s on Shell, which made the buttons look unavailable).
- When the user never dragged the buttons, the last auto position is restored and shown at once (`loadAutoPosition`), before the search bar renders; the search-based positioning then confirms the spot. Shell keeps more aggressive retry intervals because the search bar renders late.
- The container carries `data-page-type` so `positionManager` can store the auto position per page type.
- `resizeAbortController` tears down the previous resize listener whenever `setupFloatingContainer` is called again, preventing listener accumulation.

**Dependencies:** `debug.js`, `positionManager.js`, `edgeBlob.js` (blob controller and its storage), `menuVisibility.js` (closing menus when a drag starts or the buttons go into the blob)

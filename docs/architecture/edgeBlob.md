## edgeBlob.js

**Purpose:** Lets the user hide the floating buttons as a small black blob stuck to a screen edge. Pushing the buttons past an edge first shows a black wet spot there; pushed further, the buttons turn into the blob without the mouse being released. A click on the blob brings the buttons back; pulling it away from the edge tears it off into the buttons.

**Public API:**
- `PRESS_DISTANCE` (20 px), `EDGE_HOLD_MS` (600 ms), `TEAR_DISTANCE` (70 px), `EDGE_GAP` (8 px), `EDGES`
- `pressedEdge(rawX, rawY, width, height, vw, vh): { edge, over } | null` — which edge an unclamped box is pushed past and by how much
- `isCursorAtEdge(edge, x, y, vw, vh): boolean`
- `clampAlong(edge, along, vw, vh)`, `alongForRect(edge, rect, vw, vh)` — blob centre along the edge, kept on screen
- `buttonsPositionFor(edge, along, width, height, vw, vh, gap?)` — where the buttons stand when they come out of the blob
- `saveBlobState(pageType, edge, along)`, `loadBlobState(pageType, cb)`, `clearBlobState(pageType)` — `chrome.storage.local` key `menuEdgeBlob_{pageType}_{origin}`
- `createEdgeBlob({ root, pageType, onBlob, onRestore, onTearOff, signal })` → `{ edge, press(container, rawBox, clientX, clientY), release(), dock(edge, along) }`

**Key decisions:**
- The drag code stays in `floatingContainer.js`; this module only receives the unclamped box of the buttons on every move. That keeps one drag implementation and makes the edge logic a pure function (`pressedEdge`) that is unit tested without a browser.
- A cursor pinned to the screen edge sends no more mouse moves, so a grab close to the edge could never reach the press distance. Holding the cursor there for `EDGE_HOLD_MS` also turns the buttons into a blob; the hold is timed with `setTimeout`, not on moves.
- The blob and the wet spot are drawn in one left-edge frame and rotated for the other edges (right 180°, top 90°, bottom −90°). The goo look is an SVG filter (blur + alpha threshold) over plain divs; the drops double as the neck while the blob is stretched.
- After the splat the blob has no animation at all; hover only changes the ring around the orange dot. Only a click (mousedown + mouseup without a 4 px move) turns it back into the buttons — hover never does.
- Only the mound itself (`.csl-edge-hit`) takes pointer events, not the empty corners of the 36×54 box, so a click next to the blob still reaches Creatio.
- `along` is stored as a fraction of the edge length so the blob keeps its spot after a window resize. The state is per page type and origin, like the drag position, and is removed when the blob becomes buttons again.
- Styles are injected once as `<style id="csl-edge-blob-style">` instead of a manifest stylesheet: the shell and configuration pages load different CSS lists, and the mock e2e pages load none.
- The squash animation marks the buttons `data-edge-docked` only when it ends, and only if that blob still exists: a blob torn off within those 200 ms must not hide the buttons the user is already dragging.
- `Element.animate` is missing in jsdom; the `animate()` helper applies the end state at once there.

**Dependencies:** `debug.js`

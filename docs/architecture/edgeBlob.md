## edgeBlob.js

**Purpose:** Lets the user hide the floating buttons as a small black blob stuck to a screen edge. Pushing the buttons past an edge first shows a black wet spot there; pushed further, the buttons turn into the blob without the mouse being released. The buttons stay docked until the blob is pulled away from the edge further than a button is high; that tears it off into the buttons. A click on the blob, or resting the mouse on it for 2 s, only brings the buttons out for a while (a "peek"); they go back into the blob 10 s after the mouse left them and their menus, or at once on a click anywhere else on the page.

**Public API:**
- `PRESS_DISTANCE` (20 px), `EDGE_HOLD_MS` (600 ms), `TEAR_DISTANCE` (36 px, fallback when the button height is unknown), `PEEK_HOVER_MS` (2000 ms), `PEEK_IDLE_MS` (10 000 ms), `EDGE_GAP` (8 px), `DOT_FLIGHT_MS` (420 ms), `EDGES`
- `pressedEdge(rawX, rawY, width, height, vw, vh): { edge, over } | null` — which edge an unclamped box is pushed past and by how much
- `isCursorAtEdge(edge, x, y, vw, vh): boolean`
- `clampAlong(edge, along, vw, vh)`, `alongForRect(edge, rect, vw, vh)` — blob centre along the edge, kept on screen
- `bellHeight(d)` — how far the resting blob stands out from the edge `d` px from its middle
- `buttonsPositionFor(edge, along, width, height, vw, vh, gap?)` — where the buttons stand when they come out of the blob
- `saveBlobState(pageType, edge, along)`, `loadBlobState(pageType, cb)`, `clearBlobState(pageType)` — `chrome.storage.local` key `menuEdgeBlob_{pageType}_{origin}`
- `createEdgeBlob({ root, container, pageType, signal, tearDistance?, iconDot?, onBlob, onPeek, onPeekEnd, onTearOff })` → `{ edge, peeking, press(container, rawBox, clientX, clientY), release(), dock(edge, along) }`

**Key decisions:**
- The drag code stays in `floatingContainer.js`; this module only receives the unclamped box of the buttons on every move. That keeps one drag implementation and makes the edge logic a pure function (`pressedEdge`) that is unit tested without a browser.
- A cursor pinned to the screen edge sends no more mouse moves, so a grab close to the edge could never reach the press distance. Holding the cursor there for `EDGE_HOLD_MS` also turns the buttons into a blob; the hold is timed with `setTimeout`, not on moves.
- The blob and the wet spot are drawn in one left-edge frame and rotated for the other edges (right 180°, top 90°, bottom −90°). The goo look is an SVG filter (blur + alpha threshold) over plain divs; the drops double as the neck while the blob is stretched.
- A peek keeps `edge` and the stored state: docking is permanent until a tear-off. Users found it annoying that the first click on the blob undocked the buttons for good, so a click (mousedown + mouseup without a 4 px move) or a 2 s hover only peeks. While the mouse rests on the blob the ring around the orange dot grows (`csl-edge-charging`) so the hover has visible feedback.
- The 10 s countdown runs only while the mouse is off the extension: a `mouseover` anywhere inside `root` except the blob (the buttons, their menus, the news flyout) pauses it, and leaving restarts it from 10 s. Opening a menu therefore never collapses it under the cursor.
- A press anywhere outside `root` while the buttons are out ends the peek at once (same squash into the blob as after the 10 s). It listens to `mousedown` in the capture phase, so Creatio handlers that stop the event cannot keep the buttons out; presses on the buttons, their menus or the blob do not count.
- The tear distance is a callback (`tearDistance()`), because the button height is known only to the floating container and differs between pages.
- `blobGen` is bumped whenever the blob is shown or hidden; animation `onfinish` handlers check it so a hide that ends after the blob came back (or a squash that ends after a peek started) does nothing.
- Only the mound itself (`.csl-edge-hit`) takes pointer events, not the empty corners of the 36×54 box, so a click next to the blob still reaches Creatio.
- `along` is stored as a fraction of the edge length so the blob keeps its spot after a window resize. The state is per page type and origin, like the drag position, and is removed when the blob becomes buttons again.
- Styles are injected once as `<style id="csl-edge-blob-style">` instead of a manifest stylesheet: the shell and configuration pages load different CSS lists, and the mock e2e pages load none.
- The squash animation marks the buttons `data-edge-docked` only when it ends, and only if that blob still exists: a blob torn off within those 200 ms must not hide the buttons the user is already dragging.
- The orange dot of the blob and the orange dot on the icon of the first button (`.csl-icon-dot`, found through `iconDot()`) are one object for the eye: whenever the blob turns into the buttons (peek, tear-off) a separate `.csl-edge-flydot` flies from one to the other along a small arc, and back when the buttons squash into the blob. Both real dots are hidden during the flight. The target is measured on every animation frame, because the buttons are still popping in or being dragged; a fixed end point would land next to the icon.
- At rest the blob looks like a drop of liquid on a surface: a crisp SVG bell (`.csl-edge-bell`, outline from `bellHeight(d)`, two gaussians) — a dome about 11 px high in the middle of a 100 px long skirt that runs out to nothing along the edge. The goo filter cannot draw such thin tails (its threshold eats thin parts and rounds the ends), so the goo shapes (base, core, drops) are kept small inside the bell and only show when the blob is pulled: they make the neck and the core that follows the mouse, while the bell gathers towards the neck. The goo frame (80×160) is centred in the taller 36×100 blob box (`GOO_TOP`).
- `Element.animate` is missing in jsdom; the `animate()` helper applies the end state at once there.

**Dependencies:** `debug.js`

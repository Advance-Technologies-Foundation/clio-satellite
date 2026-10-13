# Edge blob: animation races on tear-off and restore

**What changed:** `src/edgeBlob.js` sets `data-edge-docked` at the end of the squash animation only if the same blob is still on the edge. `src/floatingContainer.js` cancels running container animations before a drag measures the container, starts the tear-off drag before the pop-in, and saves the drag position from the `left`/`top` it set instead of the bounding box. Three unit tests cover these cases.

**Why:** found while reviewing PR #22. Tearing the blob off within 200 ms of its creation let the squash `onfinish` set `data-edge-docked="null"`, so the buttons and the blob both disappeared. Grabbing the buttons while the pop-in (scale .3 → 1) was running read a scaled box, so the buttons jumped on the first move, and a quick release after a tear-off saved that scaled position.

**Decision:** cancel the animations rather than wait for them. The user has already grabbed the buttons, so the pop-in no longer matters, and cancelling also drops the squash `onfinish`.

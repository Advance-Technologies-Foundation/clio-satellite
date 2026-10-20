# A click on the docked blob opens the menu at once

**What changed**
- `edgeBlob.js`: new `onClick(edge, box)` and `onPullStart()` options. With `onClick` a click on the blob is handed to it instead of bringing the buttons out; `onPullStart` runs once when a held blob starts to move.
- `floatingContainer.js`: passes `onBlobClick` to the blob as `onClick`; moving the blob closes the menus.
- `menuBuilder.js`: a click on the blob opens the menu next to the blob, the buttons stay in it; a second click closes it. The blob box is remembered so the menu stays there when it is placed again.
- `menuVisibility.js`: `menuPositionAtEdge` / `adjustMenuPositionAtEdge` place the menu beside the blob, away from its edge, centred on it and on screen.
- The 2 s hover still brings the buttons out (to drag them along the edge or unpin them).

**Why**
Users asked that a click on the blob drop the menu straight away; before, the buttons first came out in the pool and the menu opened only after that animation.

**Decision**
The click goes through an optional callback, so `edgeBlob` keeps its peek-on-click when used without it and its tests stay valid. The menu is placed by the blob box because the hidden buttons measure 0.

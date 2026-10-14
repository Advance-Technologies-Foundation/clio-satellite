# Buttons out of the blob sit in a dark pool

**What changed:** a click on the blob (or a 2 s hover) no longer swallows the blob into the edge: it melts into a dark pool (`.csl-edge-pool` in `edgeBlob.js`) that grows from the blob's spot to 6 px around the buttons, and shrinks back into the blob when the buttons go back. The buttons out of the blob can now be dragged: the pool stretches after them; dragged further from the edge than a button is high, the pool tears, the saved blob state is removed and the buttons stay free. A shorter drag springs them back into the pool. `floatingContainer.js` routes such a drag to `edgeBlob.dragButtons()`; `menuBuilder.js` treats a click on the pool like a click on the buttons.

**Why:** users did not see that the buttons that came out of the blob belong to it and will go back into it. Before, they also could not be dragged at all — only pulling the blob undocked them.

**Decision:** the pool is a plain rounded box under the buttons, not the goo filter (its threshold blurs a large rectangle). The tear distance is the same as for pulling the blob, a button height, chosen by the user over undocking on any 4 px move, so a slip of the mouse does not undock the buttons. The torn drag goes on through a new `onUndock` callback instead of `onTearOff`, which re-centres the buttons under the cursor and would make them jump mid-drag.

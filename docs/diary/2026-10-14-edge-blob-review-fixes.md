# Review fixes for the pool around the buttons

**What changed** (`edgeBlob.js`, `floatingContainer.js`), from a self-review and a Codex review of PR #26:
- A drag started while the buttons were still coming out of the blob reopened both menus mid-drag (the interrupted reveal reported the buttons shown); now the clip is dropped without that report.
- Torn out during the reveal, the free buttons stayed clipped to the retreating pool; the clip is dropped on undock.
- The buttons could be dragged during the 300 ms return into the blob and were then hidden mid-drag; no drag starts while `closing`.
- The shrinking pool swallowed page clicks; it has `data-closing` and no pointer events while closing.
- A window resize during a peek left the pool at the old edge; the peek ends on resize.
- Abort left the pool and its animation alive; the pool is removed and its generation bumped.
- A snap-back measured the buttons mid-animation; running animations are cancelled first. `onPeek` places the buttons once, by the wrapper.

**Why:** each was a reachable state where the buttons, the pool or the menus ended up wrong.

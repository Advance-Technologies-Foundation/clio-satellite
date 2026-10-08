# Initial position no longer covers Creatio controls after the search

**What changed:** `src/positionManager.js` — the floating buttons are placed 20 px after the search's toolbar group instead of 20 px after the search. New `anchorRightEdge()` extends the anchor over the visible siblings that follow the search in the same row.

**Why:** On a CPQ instance Creatio renders `crt-operator-state` (chat operator status, "Inactive") right after the search in the same group. The buttons were placed at `search.right + 20` and covered it on first load.

**Decision:** Walk the search's following siblings rather than hard-coding `crt-operator-state`, so any control Creatio adds to that group is respected. A gap above 48 px or a different row ends the group, so the right-hand buttons group is never swallowed. Verified on local CPQ at 1280 and 1600 px: search 264–482, operator 498–606, buttons 626–832. Below ~1280 px the free space between the groups is narrower than the buttons; that case is unchanged.

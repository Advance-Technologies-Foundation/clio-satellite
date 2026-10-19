# E2E layout checks wait for the menu open animation

**What changed**
- `tests/e2e/helpers.js`: new `waitForMenuSettled(page)` waits for the animations of `.scripts-menu-container` to finish.
- `tests/e2e/extension.spec.js` (two-column panel, icons at the top) and `tests/e2e/menuPlacement.spec.js` (`expectPanelPlaced`) call it before measuring boxes.

**Why**
CI on `main` failed after merging PR #30 and on PR #31, although the same commit passed on the PR branch. The menu slides 4 px in when it opens (`creatioSateliteMenuIn`, 0.14 s); boxes measured one after another during the slide came from different moments, so "same row" checks were off by 1.4–2 px on the slower CI runner.

**Decision**
Wait for the real animations (`getAnimations().finished`) instead of widening tolerances or adding fixed timeouts: the checks keep their 1 px precision and do not depend on runner speed.

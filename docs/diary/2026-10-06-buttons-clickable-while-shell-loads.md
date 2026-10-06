## 2026-10-06 — Shell buttons clickable while Creatio is still loading

**What changed:** `src/menuBuilder.js` mounts `.creatio-satelite-extension-container` on `document.documentElement` instead of `document.body`. Tests: unit test that the container sits outside `<body>` even when `<body>` is inert; e2e test that the menu opens with `body.inert = true`; `tests/setup.js` removes the container after each test because clearing `body.innerHTML` no longer does.

**Why:** For ~2.8 s after login Creatio sets the `inert` attribute on `<body>` while Shell loads. The buttons were already visible (fading in) but, as descendants of an inert `<body>`, ignored clicks and focus. Measured on a local 8.x stand: before the fix `elementFromPoint` at the button centre returned `<html>` until ~2.8 s; after the fix the button is hit-testable from ~100 ms and a click during loading opens the menu in 6–12 ms.

**Decision:** Moving the container out of `<body>` is the only way to escape `inert` — it cannot be overridden from a descendant, and removing the attribute from `<body>` would interfere with Creatio's own loading state. Fixed positioning and our explicit styles make the parent change invisible.

### Follow-up in the same change: no slow fade, no jump

- `src/floatingContainer.js`: fade-in 3 s → 0.3 s; restores the last auto position before the search field exists and shows the buttons at once.
- `src/positionManager.js`: remembers the search-based position per page type, origin and window width; keeps the restored position instead of the centre fallback; moves only after the search rect is stable for 120 ms.
- Measured on the stand after a reload: buttons visible at their final spot (x = 502) from ~0.1 s, fully opaque at ~0.3 s, no movement while the search field animates (its right edge goes 426 → 482 px). Before: centred at x = 720 for ~2 s, then 720 → 446 → 502. The first visit ever still moves once from the centre, because there is no remembered position yet.
- Also fixed `tests/positionManager.test.js`: two tests replaced `chrome.storage.local.get/set` with `mockImplementation` and leaked the broken mocks into later tests; they now use `mockImplementationOnce`.

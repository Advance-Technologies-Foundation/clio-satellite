# New Chrome Web Store images

**What changed:** `docs/store/` holds the store images (5 screenshots 1280×800, small promo tile 440×280, marquee 1400×560), the HTML layout they are rendered from (`slides.html`), the renderer (`render.mjs`, Playwright) and the raw screenshots (`screens/`).

**Why:** The store listing did not show the current UI (one-row login panel, glass Shell menus, developer news, Environments page).

**Decision:** Screenshots are real captures of the extension on a local Creatio instance with demo data, framed in the creatio.com style so the listing matches the Creatio brand. Layout lives in HTML so the images can be regenerated after UI changes instead of being edited by hand. `docs/` is excluded from the release ZIP, so nothing here ships with the extension.

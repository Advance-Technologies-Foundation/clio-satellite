## 2026-10-06 — Raster icons with a soft 3D look

**What changed:** Added 18 PNG icons (64×64, transparent, ~42 KB total) in `icons/ui/` for the Shell menu items, the two Shell buttons and the three login-page buttons. New module `src/icons.js` (`getIconUrl`, `renderIcon`) renders them as `<img>` via `chrome.runtime.getURL`; `MENU_ICONS` / `ACTION_DETAILS` got an `iconFile` field and keep their SVG as fallback. `login/login.js` has the same logic inline (it is not bundled). `manifest.json` adds `icons/ui/*` to `web_accessible_resources` so Creatio pages may load them. Hover now scales the icon slightly with a drop shadow instead of recolouring it.

Several metaphors were replaced because the old icon did not match the item: SysSettings and RestartApp used a clock, Process library / Configuration / FlushRedisDB were plain squares.

**Why:** The flat monochrome icons were hard to tell apart; the user asked for richer icons with a 3D feel.

**Decision:** Raster instead of SVG gradients because the icons were generated with Codex image generation (gpt-6-astra, four calls on a shared style reference for consistency). The SVG fallback covers an invalidated extension context (extension reloaded while the page is open), where `getURL` throws, and image load errors. Full-colour icons cannot follow `currentColor`, so state changes are done with `transform`/`filter`.

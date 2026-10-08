# Chrome Web Store images

| File (`out/`) | Store slot | Size |
|---|---|---|
| `screenshot-1-login.png` … `screenshot-5-developer-news.png` | Screenshots | 1280×800 |
| `promo-small-440x280.png` | Small promo tile | 440×280 |
| `promo-marquee-1400x560.png` | Marquee promo tile | 1400×560 |

The store icon and the logo in the images is `icon128.png` in the repository root.

**Style:** creatio.com. Light grey / white background, Montserrat headings, Open Sans text, Creatio orange `#ff4013` as the only accent.

**Sources:** `slides.html` lays out every image; `screens/` holds real screenshots of the extension on a local Creatio instance with demo data only (demo profiles, `example-crm.com` environments, sample news).

**Regenerate:**
```bash
node docs/store/render.mjs
```
To retake the screenshots, capture the extension at 1280×800 with device scale 2 and replace the files in `screens/` under the same names.

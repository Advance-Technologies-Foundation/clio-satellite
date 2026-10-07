# Developer News — Design

Mockups for developer news on the Creatio login page and inside Creatio. Spec: [`docs/features/developer-news.md`](../../features/developer-news.md).

| File | Content |
|---|---|
| `mockup.html` | v1 login surface: the strip under the profile row, expanded panel, five states (unread, all read, critical, trending window over, no feed); cards with a Trending chip, an image and a YouTube poster |
| `shell-mockup.html` | v1 Shell surface: dot on the Clio satellite button, What's new menu row, news flyout, one-time peek card for critical items; trending-window-over scenario, image and YouTube cards in the flyout; event log shows read/noticed transitions |

Open either file directly in a browser; no build step. Use the Scenario switch on the right of each mockup. News texts in the mockup are placeholders.

When iterating, keep the previous version (`mockup-v1.html`, `mockup-v2.html`, …) if the change is substantial, so variants can be compared.

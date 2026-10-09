## Chrome Web Store Publishing Form Responses

Keep these answers in sync with `manifest.json` and the privacy policy. The Developer Dashboard must contain the same text.

### Single Purpose Description
Clio Satellite enhances user productivity in Creatio platform by providing simplified login management and quick access to essential system functions and pages.

### Scripting Justification
The scripting permission is used to run the extension's own bundled navigation and admin action scripts (from the `scripts/` folder of the package) in the Creatio tab when the user clicks a Clio Satellite menu item. Scripts are only injected into the tab where the user clicked the menu item, and only on user action.

### ActiveTab Justification
ActiveTab permission is used together with scripting to run a bundled navigation or admin action script in the current Creatio tab that the user is interacting with.

### Storage Justification
Storage permission is required to save user profiles (user names, passwords, display aliases), autologin preferences, menu position and extension settings in Chrome storage. Profiles and settings are synced across the user's own devices through Chrome sync; they are never sent to any server operated by the extension developers. Read and seen state of developer news is stored locally.

### ContextMenus Justification
Adds a "Plugin Settings" item to the right-click menu of the extension's toolbar icon, which opens the extension options page.

### Host Permission Justification
Creatio is a self-hosted platform: every customer runs it on their own domain, so the list of Creatio sites cannot be known in advance. `<all_urls>` is required so the content scripts can detect a Creatio login page or Creatio shell page on any domain and show the profile selector and the Clio Satellite menu there. On other pages the content scripts only check whether the page is a Creatio page and make no changes. The background service worker also uses this access to download the developer news feed (JSON and images from `https://advance-technologies-foundation.github.io/clio-news-feed/`, YouTube previews from `https://i.ytimg.com`) and to send anonymous usage events to Google Analytics 4 (`https://www.google-analytics.com/mp/collect`).

### Remote Code Justification
The extension does not use remote code. All scripts are included in the extension package and execute locally. The developer news feed is plain JSON data and images; it is rendered as text and never executed. Usage statistics are sent with plain HTTP requests (Google Analytics Measurement Protocol); no analytics script is loaded.

### Data Usage (Privacy practices)
- **Authentication information** — Creatio user names and passwords saved in profiles. Stored in Chrome storage and synced only through the user's own Chrome sync; never sent to the extension developers or any third party.
- **User activity** — anonymous usage events (menu opened, menu item clicked, news opened, news link clicked, news feature toggled) sent to Google Analytics 4 with the menu item name or news id, `login`/`shell`, the extension version and a random identifier. No site addresses, user names, profile names or page contents. On by default; can be turned off in Options ("Send anonymous usage statistics").
- Certifications: data is not sold to third parties, not used or transferred for purposes unrelated to the extension's single purpose, and not used to determine creditworthiness or for lending purposes.

### Privacy Policy URL
https://advance-technologies-foundation.github.io/clio-satellite/privacy-policy.html

Served by GitHub Pages from `docs/privacy-policy.html` on `main`. The page describes locally stored profiles, the developer news downloads and the anonymous usage statistics sent to Google Analytics 4.

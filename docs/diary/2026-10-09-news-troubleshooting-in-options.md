# Troubleshooting for developer news in Options

**What changed:** `options.html`, `options.js`, `styles/options.css` — a collapsed "Troubleshooting" section in the Developer news card: cached feed status, each cached item with its state (`new`, `read`, `hidden: <reason>`, single-surface note) and two buttons, *Download news now* (clears the feed and image caches and fetches at once) and *Mark all news as unread* (resets read, first-shown, auto-opened, skipped and noticed state). The e2e chrome mock now writes the downloaded feed to the cache like the background worker does.

**Why:** While testing the first published news the extension kept serving a hand-seeded test feed with a 24 h refresh, and only one of two news showed. Finding out why needed the service worker console; the user asked for buttons instead.

**Decision:** The visibility reasons are re-implemented in plain words in options.js rather than importing `newsCore.js`, because the Options page is a plain script outside the content bundle; only the reasons a user can act on are listed. Onboarding time (`newsOnboardedAt`) is kept on reset so the first-run backlog rule does not hide items again.

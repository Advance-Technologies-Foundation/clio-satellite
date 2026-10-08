# Output sanitization review

**What changed:** `options.js` login history: the hostname is appended as a text node instead of being interpolated into `innerHTML`, and the link gets an `href` only for `http:`/`https:` origins. E2E test with `<img onerror>` and `javascript:` keys in `lastLoginProfiles`.

**Why:** Review asked to make sure no string reaches the DOM as HTML. History keys come from `chrome.storage.sync` (synced across devices), so they are untrusted; a key that is not a valid URL was inserted as raw HTML, and any scheme was accepted as a link. The bug predates the news feature.

**Checked, no change needed:** developer news render every feed string with `textContent`/attributes; `innerHTML` only receives SVG constants. Links: `https:` on allow-listed hosts only (`httpsUrlOnHosts`); YouTube IDs match `^[A-Za-z0-9_-]{11}$`; media are fetched by the worker and accepted only as png/jpeg/webp data URLs; player `message` events are accepted only from the `youtube-nocookie.com` iframe. Menu and login icons use constants from the code.

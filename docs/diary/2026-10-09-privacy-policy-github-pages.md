# Publish the privacy policy via GitHub Pages

**What changed**
- Enabled GitHub Pages for the repository (branch `main`, folder `/docs`). The privacy policy is now served at https://advance-technologies-foundation.github.io/clio-satellite/privacy-policy.html.
- Rewrote `docs/chrome-store-submission-fields.md` to match the current manifest (dropped the unused `tabs` answer, justified `<all_urls>`, news and usage statistics, added Data usage and the privacy policy URL). Added the URL and to all agent instruction files (`CLAUDE.md`, `AGENTS.md`, `.windsurfrules`, `.cursor/rules/release.mdc`, `.github/copilot-instructions.md`).

**Why**
v2.9 started sending anonymous usage statistics to Google Analytics 4. Chrome Web Store reviewers check the privacy policy linked in the Developer Dashboard, and the repository had no public, stable URL that showed the current policy.

**Decision**
GitHub Pages from `/docs` reuses the existing `docs/privacy-policy.html` without a separate deploy step, so the published page always matches `main`. The repository is already public, so publishing the rest of `docs/` exposes nothing new.

# Clio Satellite — AI Agent Instructions

## Project
Chrome Extension (Manifest V3) for Creatio CRM. Enhances login, navigation, and admin actions.

---

## Release Process

### 1. Bump version in manifest.json
```json
"version": "2.0"
```
Use semantic versioning: `MAJOR.MINOR` (e.g. `1.9` → `2.0` for new features, `1.9` → `1.10` for fixes).

### 2. Create a GitHub Release
- Tag format: `v{version}` — e.g. `v2.0`
- The GitHub Actions workflow triggers automatically on publish and:
  - Updates `manifest.json` version from the tag
  - Builds the ZIP
  - Attaches ZIP to the release
  - Uploads to Chrome Web Store and submits for review

### 3. Write the release description
The release description is reviewed by Google during Chrome Web Store verification.
Follow the rules below — **vague or generic descriptions cause rejection**.

---

## Writing Release Notes for Chrome Web Store Verification

Google reviewers read the release notes to verify the extension behaves as described. Bad notes → rejection or delayed review.

### Rules

**Be specific about every change:**
- Bad: `Bug fixes and improvements`
- Good: `Fixed profile deletion removing the wrong entry when multiple profiles are saved`

**Describe new UI elements:**
- Bad: `Added new button`
- Good: `Added copy-to-clipboard button next to username and password fields in the profile editor`

**Explain behaviour changes:**
- Bad: `Improved autologin`
- Good: `Autologin now skips pages where the user is already authenticated`

**Mention any permission changes** (if manifest permissions changed):
- Explain why the permission is needed
- Example: `Added clipboardWrite permission to support copying credentials to clipboard`

**Justify any new host_permissions** (if added):
- Example: `Extended host_permissions to *.example.com to support autologin on that domain`

**Do not mention** internal refactors, comment changes, or dev tooling — reviewers do not care and it adds noise.

### Structure to follow

```
## What's new in vX.X

### New features
- [Specific feature description with context]

### Bug fixes
- [Specific bug description — what was wrong and what is correct now]

### Changes
- [Any behaviour or UI changes the user will notice]
```

### Example of a good release description

```
## What's new in v2.0

### New features
- Added copy-to-clipboard buttons next to username and password fields in the profile editor modal
- Added show/hide toggle for the password field in the profile editor

### Bug fixes
- Fixed an issue where deleting a profile always removed the last profile in the list instead of the selected one
- Fixed confirmation modal retaining "Delete all profiles" text after cancelling a bulk delete

### Changes
- Removed legacy scriptsMenu.js and test-extension.js files that were bundled but never loaded
- All inline comments translated to English for consistency
```

---

## Chrome Web Store Verification — What Google Checks

| Area | What they look for |
|---|---|
| **Permissions** | Every permission in manifest.json must be justified by actual functionality |
| **host_permissions** | `<all_urls>` requires strong justification; narrow to specific domains if possible |
| **Release notes** | Must match the actual diff — reviewers may test the stated changes |
| **Privacy** | If storing user data (passwords, URLs), describe how it is stored and protected |
| **Functionality** | Extension must work as described; broken features cause rejection |

### Current permissions that need ongoing justification
- `storage` — used for syncing user profiles (credentials, autologin settings) across devices
- `scripting` — used to inject navigation and admin action scripts into Creatio pages
- `activeTab` — used to detect current page type and inject the appropriate UI
- `contextMenus` — used to add a right-click shortcut to open the options page
- `host_permissions: <all_urls>` — required because Creatio can be hosted on any domain (self-hosted instances)

---

## Testing

### Coverage requirement
**Every code change must be accompanied by tests.** This is mandatory, not optional:
- Bug fix → add a unit test that fails before the fix and passes after
- New feature → add unit tests for logic + at least one E2E test for the user-visible behaviour
- Refactor → verify existing tests still pass; add tests for any behaviour that was previously untested

Run both suites before marking a task complete:
```bash
npm test && npm run test:e2e
```

### Unit tests (run on every commit via CI)
```bash
npm test
```

### Mock E2E tests (Playwright, headless, no real site needed)
```bash
npm run test:e2e
```

### Real-site login tests (Playwright, headless Chrome with real extension)

Requires a live Creatio instance. Pass the URL as `BASE_URL`:

```bash
BASE_URL=https://dev2.krylov.cloud npm run test:login
```

Optional env vars: `TEST_USER` (default: `Supervisor`), `TEST_PASS` (default: `Supervisor`).

One-time setup if Playwright browsers are not installed:
```bash
npm run build && npx playwright install chromium
```

What the login tests cover (`tests/e2e/login.spec.js`):
- Login page loads and shows the credentials form
- Extension injects profile selector into the login form
- Empty storage shows "Setup user in options" in the dropdown
- Saved profile appears in the dropdown
- "Login with profile" fills credentials and redirects to `/Shell/`
- Satellite menu (Clio buttons) is visible in the shell after login

Tests run headless via `--headless=new` (Chrome's new headless mode supports extensions).
Failed tests save screenshots and video to `test-results/`.

---

## After Every Change — Diary and Documentation

After completing any code change, two things are mandatory:

### 1. Write a diary entry

Create a file in `docs/diary/` named `YYYY-MM-DD-short-description.md`.

```
docs/diary/2026-04-17-fix-extension-context-crash.md
```

The entry must answer three questions:
- **What changed** — which files, what behaviour
- **Why** — the root cause or requirement that drove the change
- **Decision** — why this approach was chosen over alternatives (if non-obvious)

Keep it short: 5–15 lines. No need to repeat what the diff already shows.

### 2. Update module architecture docs

Architecture lives in `docs/architecture/`, one file per source module:

```
docs/architecture/positionManager.md
docs/architecture/menuBuilder.md
docs/architecture/floatingContainer.md
...
```

Update only the files whose module was touched. Do **not** maintain a single combined architecture doc — it becomes stale and unreadable.

Each module doc covers:
- **Purpose** — what problem this module solves
- **Public API** — exported functions/constants and their contracts
- **Key decisions** — non-obvious design choices
- **Dependencies** — what it imports and why

If you add a new module, create its architecture doc. If you delete one, remove the doc.

---

## Updating Agent Instructions

This project uses multiple AI agent instruction files. When you change any rule or instruction, you **must** update all of them — never only the file your current agent reads:

| File | Agent |
|---|---|
| `CLAUDE.md` | Claude Code (Anthropic) |
| `AGENTS.md` | OpenAI Codex / generic agents |
| `.windsurfrules` | Windsurf |
| `.cursor/rules/release.mdc` | Cursor |
| `.github/copilot-instructions.md` | GitHub Copilot |

---

## Language
- All documentation, comments, commit messages, and release notes must be written in **English only**
- Do not use any other language in any project file or git history

## Things to avoid
- Do not change `host_permissions` without updating the justification above
- Do not add new permissions without documenting why in this file
- Do not submit a release with an empty or generic description — it will be rejected

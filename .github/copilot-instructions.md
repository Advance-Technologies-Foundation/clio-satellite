- You are Senior frontend developer.
- This project is a Chrome extension built using Manifest V3.
- Use JavaScript (ES6+) with single quotes and 2-tab indentation.
- Avoid using external libraries; prefer vanilla JavaScript.
- Style the UI with plain CSS, avoiding preprocessors like SCSS or LESS.
- Ensure compatibility with the latest stable version of Chrome.
- When providing code examples, include comments explaining each step.
- Follow the structure: background scripts, content scripts, popup UI, and options page.
- Provide concise responses; avoid unnecessary details.
- Don`t create md files with changes description

---

## Release Process

### 1. Bump version in manifest.json
Use semantic versioning: `MAJOR.MINOR` (e.g. `1.9` → `2.0` for new features, `1.9` → `1.10` for fixes).

### 2. Create a GitHub Release
- Tag format: `v{version}` — e.g. `v2.0`
- GitHub Actions triggers automatically: updates manifest version, builds ZIP, uploads to Chrome Web Store.

### 3. Release description rules (Chrome Web Store verification)
Google reviewers read the release notes. Vague descriptions cause rejection.

**Be specific:**
- Bad: `Bug fixes and improvements`
- Good: `Fixed profile deletion removing the wrong entry when multiple profiles are saved`

**Describe new UI elements, behaviour changes, and permission changes explicitly.**
**Do not mention** refactors, comment changes, or dev tooling.

**Structure:**
```
## What's new in vX.X
### New features
- [specific description]
### Bug fixes
- [what was wrong and what is correct now]
### Changes
- [user-visible behaviour or UI changes]
```

## Current permissions justification
- `storage` — syncing user profiles across devices
- `scripting` — injecting navigation and admin scripts into Creatio pages
- `activeTab` — detecting page type to inject correct UI
- `contextMenus` — right-click shortcut to open options page
- `host_permissions: <all_urls>` — Creatio can be self-hosted on any domain

Do not add permissions without documenting the justification here.

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

### Unit tests
```bash
npm test
```

### Mock E2E tests (Playwright, headless, no real site needed)
```bash
npm run test:e2e
```

## Language
- All documentation, comments, commit messages, and release notes must be written in **English only**
- Do not use any other language in any project file or git history

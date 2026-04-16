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

## Things to avoid
- Do not change `host_permissions` without updating the justification above
- Do not add new permissions without documenting why in this file
- Do not submit a release with an empty or generic description — it will be rejected

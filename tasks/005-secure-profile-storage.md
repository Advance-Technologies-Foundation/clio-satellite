# Improve profile storage security

## Summary
Usernames and passwords are currently stored in `chrome.storage.sync` in plaintext. While typical for local extensions, we can reduce risk by storing locally and obfuscating secrets.

## Scope
- Migrate from `chrome.storage.sync` to `chrome.storage.local` for password fields (usernames may remain in sync if desired).
- Add simple reversible obfuscation (e.g., XOR + base64) for password at rest. Note: this is not strong encryption but mitigates casual exposure.
- Add a migration path in background to transform existing profiles on first run.
- Document limitations and rationale in README.

## Acceptance Criteria
- Existing profiles are migrated automatically; log or notify once.
- New profiles store passwords obfuscated in local storage.
- Login flows continue to work without user-visible regression.

## Risks
Medium; data migration and compatibility. Communicate clearly to users.

# Background storage migrations and initialization

## Summary
Ensure storage keys exist and handle migrations centrally in `background.js` during `onInstalled` or early startup.

## Scope
- Initialize `lastLoginProfiles` and other expected maps/flags if missing.
- Add a simple versioned migration mechanism (e.g., `storageVersion`) to run one-time updates.
- Keep profiles up-to-date with new fields (e.g., `alias`, `autologin`) in one place.

## Acceptance Criteria
- Fresh installs have all expected keys initialized.
- Upgrades run needed migrations once and record `storageVersion`.
- No redundant work on subsequent startups.

## Risks
Low; contained to background service worker.

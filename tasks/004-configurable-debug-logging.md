# Configurable debug logging

## Summary
Current debug logs in `content.js` are verbose and always on when `debugExtension = true`. Make logging configurable via a flag stored in `chrome.storage.sync` or `local` and expose a toggle in Options.

## Scope
- Add `debugEnabled` boolean setting in storage (default false).
- In `content.js`, route `debugLog` through this flag (read once and subscribe to storage changes).
- Add a simple toggle in Options UI that updates the flag.

## Acceptance Criteria
- When `debugEnabled` is off, content logs are minimal; when on, detailed logs appear.
- Toggling the option applies without reload on the next log attempt, or after a soft reload.

## Risks
Low; UI/setting wiring only.

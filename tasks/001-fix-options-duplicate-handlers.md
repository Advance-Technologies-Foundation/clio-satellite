# Fix duplicate delete modal handlers in options.js

## Summary
The options page registers duplicate click handlers for the confirmation modal. This causes conflicting behavior (modal reopens, double actions). We should keep a single, clear handler set.

## Scope
- In `options.js`, remove the second set of event listeners for the confirm modal (confirm/cancel/close) and keep the implementation that actually deletes and then closes the modal.
- Ensure delete single and bulk delete paths work via one code path.
- Verify that no recursion occurs (e.g., avoid calling deleteProfile() from confirm handler if it reopens the modal).

## Acceptance Criteria
- Single profile delete closes the modal and removes the profile from UI without duplicate actions.
- Bulk delete (Delete all profiles) shows one confirm modal and, on confirm, clears profiles and closes the modal.
- No duplicate handlers present in the file; no console errors.
- Tested by adding/deleting profiles and checking storage updates in chrome.storage.sync.

## Risks
Low; only touches options page event wiring.

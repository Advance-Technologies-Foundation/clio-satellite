# Rename Application_Managment to Application_Management

## Summary
Fix spelling of `Application_Managment` across file names and references to improve clarity.

## Scope
- Rename file `scripts/navigation/Application_Managment.js` to `Application_Management.js`.
- Update all references in `content.js` (menu list), `background.js` (if any), docs.
- Consider keeping a backward-compatibility alias if external references exist.

## Acceptance Criteria
- The navigation item still appears and executes correctly.
- No broken references or 404s when injecting the script.

## Risks
Low; rename across code base. Ensure consistent casing.

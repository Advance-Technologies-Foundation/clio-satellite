# Remove legacy scriptsMenu.js and references

## Summary
`scriptsMenu.js` duplicates functionality now implemented in `content.js` and is not referenced by the manifest. Keeping it may confuse contributors.

## Scope
- Confirm that `scriptsMenu.js` is not used by the extension at runtime (no manifest references).
- Remove the file from the repository or move it to an `archive/` if historical reference is required.
- Update README if it mentions this file.

## Acceptance Criteria
- No references to `scriptsMenu.js` remain in code or docs.
- Extension loads and works as before (navigation/actions menus still function via content.js).

## Risks
Low; removal of dead code.

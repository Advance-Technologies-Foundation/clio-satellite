# Streamline content.js monitoring and intervals

## Summary
`content.js` uses a periodic check and multiple MutationObservers to detect page readiness and maintain UI. After successful initialization, frequent checks can be reduced to lower overhead.

## Scope
- Stop the periodic interval(s) once the UI is fully initialized.
- Limit MutationObserver lifetime clearly (already has timeouts in some places) and ensure cleanup on success.
- Consolidate duplicate page checks where possible without reducing reliability.

## Acceptance Criteria
- After the menu is created, no recurring intervals continue polling (verify with console/logs).
- MutationObservers disconnect on success or after a reasonable timeout.
- No regression in delayed DOM readiness scenarios (menus still appear reliably).

## Risks
Medium-low; timing-sensitive behavior on dynamic pages. Test on slow-loading Shell/Configuration pages.

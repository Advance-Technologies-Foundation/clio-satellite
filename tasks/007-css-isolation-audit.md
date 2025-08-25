# CSS isolation audit

## Summary
Audit CSS to ensure all rules are scoped to the extension container and do not leak to host pages.

## Scope
- Review `menu-item.css` and `styles/shell.css` for any selectors not scoped under the extension container.
- Prefix or narrow any global selectors as needed.
- Add a short style guide on scoping in the repo (README or docs/).

## Acceptance Criteria
- All interactive styles are applied only within `.creatio-satelite-extension-container` or equally strict scopes.
- No regressions in visual behavior of menus and buttons.

## Risks
Low; purely styling adjustments.

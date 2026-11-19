# Autologin fills the fields but Creatio says "Enter a value"

**What changed** — `login/login-events.js`: the fields are filled by `fillLoginField`, which after
setting the value dispatches `input`, `change`, `blur` and `focusout`. New `autologinLog` keeps the
login-page decisions (form found, why autologin was skipped, click sent, still on the login form 8 s
after the click with the visible messages) in `chrome.storage.local.autologinLog`, last 100 entries,
and prints them to the page console. `login/login.js`: logs each autologin decision and no longer
throws when the last used profile is not among the options. New `tests/e2e/autologin.spec.js`.

**Why** — seen in real Chrome on a sleeping local stand: the DOM fields held the profile, but
`Ext.getCmp('loginEdit').value` was null, Creatio showed "Enter a value" and sent no login request.
Creatio's `Terrasoft.TextEdit` copies the DOM value into its model only on the field's blur event, and
the extension relied on `focus()` moving focus between the fields to fire it. `focus()` fires no
focus/blur events in a page without focus. Reproduced under control on a warm stand with Playwright
focus emulation off (`document.hasFocus() === false`): the old code stays on the login form with
"Enter a value", the new code logs in. A slow (sleeping) stand gives the user time to switch away
while the page loads, which matches the report; the focus state of the original failing run was not
recorded, so the log now stores `hasFocus` with every entry.

**Decision** — dispatching `blur` ourselves works with or without window focus (checked in the live
page: `input` and `change` do not update the model, `blur` does). The log is local only, never synced
or sent, has no passwords and is written only on Creatio login pages (`#loginEdit-el`), so other
sites' addresses are not recorded.

# Keep the news entry until reload after reading

**What changed:** `src/news/loginStrip.js` and `src/news/shellIndicator.js`. Collapsing the login list or closing the Shell flyout still marks items read, but the strip / "What's new" row now stays for the rest of the page's life without a count (login: grey `What's new · <title>`; Shell: row without the pill). On the next page load nothing is shown if nothing is unread. "Mark all as read" no longer closes the login list. Mockups and spec updated.

**Why:** Testing on a local CPQ instance: collapsing the list made the strip disappear instantly (read on close + "nothing new, nothing shown"), which looked like a bug to the user.

**Decision:** Of three options (keep instant hide, keep until reload, do not mark read on collapse) the user chose "keep until reload": read state stays automatic, so counters never linger, and the UI does not jump under the cursor. The Shell flag is module-level so it survives Creatio rebuilding the menu.

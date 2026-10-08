# Hide developer news when there is nothing new

**What changed:** The login strip (`src/news/loginStrip.js`) is now hidden when no visible item is unread; it used to stay as `What's new · <latest title>`. `Mark all as read` also closes the panel. The permanent "All developer news" entries were removed from the login profile dropdown (`login/login.js`) and the Shell menu (`src/news/shellIndicator.js`), together with their CSS and `newsStore.openNewsArchive()`.

**Why:** Requirement: if there are no news, nothing news-related should be visible on Creatio pages.

**Decision:** "No news" means "no unread items", not "empty feed" — read items were the main source of permanent UI. An open panel is kept until the user closes it, so reading or playing a video does not make the list vanish mid-use. The archive stays reachable from Options and from the panel/flyout footer while there are unread items.

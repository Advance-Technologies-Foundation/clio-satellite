# Developer news ship as an opt-in preview feature

**What changed:** `newsEnabled` now defaults to `false` (`src/news/newsStore.js`, `news/newsFetcher.js`, `options.js`). The Options "Developer news" card is marked *Preview* and its switch is unchecked until the user turns it on. Both the content-side state and the background fetcher require an explicit `true`, so a fresh install neither renders news nor downloads the feed or images. Permission justification in all agent instruction files and the privacy policy updated.

**Why:** The feature is not finished (player fallback, reactions) and should be tried by people who choose to, without changing the extension for everyone.

**Decision:** A user-facing opt-in switch instead of a hidden build-time flag: the code is already shipped and tested, the existing master switch does the job, and testers enable it without a special build. When the feature leaves preview, flipping the default back to `true` is a one-line change in three places (store, fetcher, options) plus the docs.

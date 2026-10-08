# Developer news on by default

**What changed:** `newsEnabled` now defaults to `true` in `src/news/newsStore.js`, `news/newsFetcher.js` and `options.js`; only an explicit `false` (the Options switch) turns news off. The "Preview" badge and the "off by default" note were removed from the Options card. Privacy policy, feature/architecture docs and all agent instruction files now say news are on by default and can be turned off.

**Why:** the feature is ready for everyone; with opt-in almost nobody would discover it.

**Decision:** users who explicitly turned news off keep `newsEnabled: false` in sync storage, so their choice survives the update; users who never touched the switch (no key stored) get news. The first-run onboarding still skips the backlog beyond the newest items, so new users are not flooded.

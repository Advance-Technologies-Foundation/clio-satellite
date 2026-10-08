# Anonymous usage statistics (GA4)

**What changed:** new `analytics/analytics.js` + `analytics/config.js` (service worker, Measurement Protocol), `src/analytics.js` (content-script `track()`), `trackEvent` in `background.js`. Events from the Clio satellite and actions menus (`menu_open`, `menu_click`), the news panels (`news_open`, `news_cta_click`, `news_video_play`, `news_mark_all_read`, `news_archive_open`, `news_topics_open`) and Options (`news_toggle`). New "Usage statistics" card in Options with an on-by-default switch (`analyticsEnabled`). The release workflow fills the GA4 id and secret from repository secrets. Privacy policy and agent instructions updated.

**Why:** we want to know which menu items people use most and how often they use the developer news feed, to decide what to improve.

**Decision:** Measurement Protocol from the service worker (MV3 forbids remote `gtag.js`); a strict allow-list of events, parameters and identifier-shaped values so site addresses or user names can never leak; the id/secret are kept out of git so local builds never report. On by default with a visible switch, as the product owner asked.

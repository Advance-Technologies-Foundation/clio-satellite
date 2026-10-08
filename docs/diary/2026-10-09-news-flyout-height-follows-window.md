# News flyout height follows the window

**What changed:** `src/news/shellIndicator.js` sets the flyout list `max-height` on open and on window resize via `flyoutListMaxHeight()`: the flyout may take up to 80% of the window height, never goes below the window's bottom edge, and the list keeps at least 120 px. `styles/news.css` replaces the fixed 360 px cap with a `calc(80vh - 96px)` fallback. Unit tests for the formula, e2e tests for few news (no scrollbar) and many news (80% cap, list scrolls).

**Why:** with the fixed 360 px cap, two news cards with images already scrolled on a tall window while most of the screen stayed empty.

**Decision:** compute in JS rather than pure CSS because the flyout starts at the menu's top, so the bottom-edge limit depends on its position; only the list scrolls so "Mark all as read" and "All news" stay visible.

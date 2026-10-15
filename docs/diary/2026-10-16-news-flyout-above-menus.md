# News flyout above the actions menu, panel-style scrollbar

**What changed**
- `src/news/shellIndicator.js`: while the "What's new" flyout is open, the navigation menu (which holds the flyout) is raised above the actions menu (`z-index: 10000 !important`), and the actions menu is hidden; both are restored when the flyout closes.
- `styles/news.css`: the news list has a slim rounded scrollbar in the panel colours instead of the system one.

**Why**
Since one button opens both menus side by side, the actions menu opened exactly where the flyout appears and covered it, because it comes later in the DOM at the same z-index.

**Decision**
Raising the z-index alone was not enough: the flyout's glass background only blurs its own menu (nested backdrop root), so the actions menu stayed readable through it. Hiding the actions menu while reading news is cleaner than making the flyout opaque. The scrollbar uses only `::-webkit-scrollbar` rules because `scrollbar-color` would override them in Chrome.

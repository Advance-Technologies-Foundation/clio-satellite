// Shell surface: a dot on the Clio satellite button, a news column on the left of the menu panel
// while there are unread news, and a one-time peek card for critical items.
// Inside Creatio people are working, so normal news never go beyond the dot and the column; the column
// stays until the user presses "Mark as read" (all news stay on the news page, the book icon in the menu).
import { shouldShowDot, pickPeek } from './newsCore.js';
import { loadSurface } from './newsModel.js';
import { markRead, markNoticed, recordDotShown, recordFirstShown, markAutoOpened, onNewsStorageChange, openOptions } from './newsStore.js';
import { renderCards, trackPanelClicks } from './newsCards.js';
import { track } from '../analytics.js';

const RERENDER_MS = 10 * 60 * 1000;
const PEEK_MS = 10000;
const PEEK_AFTER_HOVER_MS = 3000;
// The column grows with its cards up to this share of the window height, then the list scrolls
export const NEWS_MAX_SHARE = 0.8;
const NEWS_MIN_LIST = 120;
const NEWS_EDGE = 16;

const ui = {
  menuButton: null, menuContainer: null, buttonWrapper: null, pageType: 'shell', onLayoutChange: null,
  dot: null, column: null, pill: null, list: null, peek: null,
  model: null, columnShown: false, loadCounted: false, peekChecked: false, subscribed: false, observer: null, peekTimer: null,
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildColumn() {
  const column = el('div', 'csl-news csl-news--dark csl-news-column');
  column.setAttribute('role', 'region');
  column.setAttribute('aria-label', 'Developer news');
  column.hidden = true;
  const head = el('div', 'csl-news-panel__head');
  const title = el('strong', '', 'Dev tools news');
  const pill = el('span', 'csl-news-pill');
  title.appendChild(pill);
  const markAll = el('button', 'csl-news-linkbtn csl-news-markread', 'Mark as read');
  markAll.type = 'button';
  markAll.dataset.track = 'news_mark_all_read';
  head.append(title, markAll);
  const list = el('ul', 'csl-news-list');
  const foot = el('div', 'csl-news-panel__foot');
  const topics = el('button', 'csl-news-linkbtn', 'Choose topics');
  topics.type = 'button';
  topics.dataset.track = 'news_topics_open';
  foot.append(topics);
  column.append(head, list, foot);
  trackPanelClicks(column, 'shell');
  column.addEventListener('click', event => event.stopPropagation());
  markAll.addEventListener('click', () => { if (ui.model) markRead(ui.model.visible.map(i => i.id)).then(render); });
  topics.addEventListener('click', () => openOptions());
  return { column, pill, list };
}

// Few news → the column is as tall as its cards; many → up to 80% of the window, and never
// below its bottom edge. Only the list scrolls, the head and foot stay in place.
export function newsListMaxHeight({ viewportHeight, columnTop, chromeHeight }) {
  const columnMax = Math.min(viewportHeight * NEWS_MAX_SHARE, viewportHeight - Math.max(0, columnTop) - NEWS_EDGE);
  return Math.max(NEWS_MIN_LIST, Math.floor(columnMax - chromeHeight));
}

function fitColumnHeight() {
  if (!ui.column || ui.column.hidden || !ui.list) return;
  const chromeHeight = ui.column.offsetHeight - ui.list.offsetHeight;
  ui.list.style.maxHeight = `${newsListMaxHeight({
    viewportHeight: window.innerHeight,
    columnTop: ui.column.getBoundingClientRect().top,
    chromeHeight,
  })}px`;
}

function onWindowResize() {
  if (ui.columnShown) fitColumnHeight();
}

function hidePeek() {
  clearTimeout(ui.peekTimer);
  ui.peek?.remove();
  ui.peek = null;
}

function showPeek(item) {
  hidePeek();
  const host = document.querySelector('.creatio-satelite-extension-container');
  if (!host || !ui.buttonWrapper) return;
  const peek = el('div', 'csl-news csl-news--dark csl-news-peek');
  peek.setAttribute('role', 'status');
  peek.setAttribute('aria-live', 'polite');
  const meta = el('div', 'csl-news-card__meta');
  meta.appendChild(el('span', 'csl-news-tag csl-news-tag--breaking', 'Breaking'));
  const actions = el('div', 'csl-news-peek__actions');
  const read = el('button', 'csl-news-peek__read', 'Read');
  read.type = 'button';
  const dismiss = el('button', 'csl-news-linkbtn', 'Dismiss');
  dismiss.type = 'button';
  actions.append(read, dismiss);
  peek.append(meta, el('h4', 'csl-news-card__title', item.title));
  if (item.body) peek.appendChild(el('p', 'csl-news-card__text', item.body));
  peek.appendChild(actions);

  const rect = ui.buttonWrapper.getBoundingClientRect();
  peek.style.top = `${rect.bottom + 8}px`;
  peek.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 316))}px`;
  host.appendChild(peek);
  ui.peek = peek;

  const arm = ms => { clearTimeout(ui.peekTimer); ui.peekTimer = setTimeout(hidePeek, ms); };
  arm(PEEK_MS);
  peek.addEventListener('mouseenter', () => clearTimeout(ui.peekTimer));
  peek.addEventListener('mouseleave', () => arm(PEEK_AFTER_HOVER_MS));
  dismiss.addEventListener('click', (event) => { event.stopPropagation(); hidePeek(); });
  read.addEventListener('click', (event) => {
    event.stopPropagation();
    hidePeek();
    // the news column is there while the item is unread
    if (!ui.menuContainer.classList.contains('visible')) ui.menuButton.click();
  });
}

function onMenuVisibility() {
  if (!ui.menuContainer.classList.contains('visible')) return;
  hidePeek();
  if (ui.model?.unread.length) markNoticed(ui.model.unread.map(i => i.id)).then(render);
  if (ui.columnShown) onColumnSeen();
}

// The open menu shows the column: count it as opened and start the trending windows of its items
function onColumnSeen() {
  track('news_open', { surface: 'shell' });
  recordFirstShown(ui.model.visible.map(i => i.id));
  fitColumnHeight();
}

let rendering = null;
let pending = false;

export async function render() {
  if (!ui.menuButton) return;
  if (rendering) { pending = true; return rendering; }
  rendering = (async () => {
    const model = await loadSurface('shell');
    ui.model = model;
    const unread = model?.unread || [];
    const hasCritical = unread.some(i => i.priority === 'critical');

    const showDot = Boolean(model) && shouldShowDot(unread, { now: model.ctx.now, noticed: model.state.noticed });
    ui.dot.hidden = !showDot;
    ui.dot.classList.toggle('csl-news-dot--critical', hasCritical);
    if (showDot) {
      // Count this Shell load once for the dot decay (7 days / 10 loads)
      if (!ui.loadCounted) {
        ui.loadCounted = true;
        recordDotShown(unread.filter(i => !model.state.noticed[i.id]?.noticedAt).map(i => i.id));
      }
      const btn = ui.menuButton;
      ui.dot.style.left = `${btn.offsetLeft + btn.offsetWidth - 7}px`;
    }
    ui.menuButton.setAttribute('aria-label', showDot ? `Clio satellite, ${unread.length} unread news` : 'Clio satellite');

    // Unread news → the column is there, beside the menu items; "Mark as read" removes it
    const showColumn = Boolean(model) && unread.length > 0;
    ui.pill.hidden = !showColumn;
    ui.pill.textContent = String(unread.length);
    ui.pill.classList.toggle('csl-news-pill--critical', hasCritical);
    if (showColumn) {
      renderCards(ui.list, model.visible, model.ctx, { onVideoStart: item => markRead([item.id]).then(render) });
    }
    if (showColumn !== ui.columnShown) {
      ui.columnShown = showColumn;
      ui.column.hidden = !showColumn;
      const menuOpen = ui.menuContainer.classList.contains('visible');
      if (showColumn && menuOpen) onColumnSeen();
      ui.onLayoutChange?.();
    }

    if (model && !ui.peekChecked) {
      ui.peekChecked = true;
      const critical = pickPeek(unread, { now: model.ctx.now, autoOpened: model.state.autoOpened, lastPeekAt: model.state.lastPeekAt, pageType: ui.pageType });
      if (critical) {
        markAutoOpened(critical.id, { peek: true });
        showPeek(critical);
      }
    }
  })();
  try {
    await rendering;
  } finally {
    rendering = null;
    if (pending) { pending = false; render(); }
  }
}

// Called by menuBuilder every time it builds the button group (it is rebuilt when Creatio removes it)
export function attachShellNews({ menuButton, menuContainer, menuBody, buttonWrapper, pageType, onLayoutChange }) {
  ui.observer?.disconnect();
  hidePeek();
  Object.assign(ui, { menuButton, menuContainer, buttonWrapper, pageType, onLayoutChange, columnShown: false });

  const dot = el('span', 'csl-news-dot');
  dot.setAttribute('aria-hidden', 'true');
  dot.hidden = true;
  buttonWrapper.appendChild(dot);

  const { column, pill, list } = buildColumn();
  (menuBody || menuContainer).prepend(column);
  Object.assign(ui, { dot, column, pill, list });

  ui.observer = new MutationObserver(onMenuVisibility);
  ui.observer.observe(menuContainer, { attributes: true, attributeFilter: ['class'] });

  if (!ui.subscribed) {
    ui.subscribed = true;
    onNewsStorageChange(() => render());
    setInterval(render, RERENDER_MS);
    window.addEventListener('resize', onWindowResize);
  }
  return render();
}

// For tests
export function _resetShellNews() {
  ui.observer?.disconnect();
  hidePeek();
  Object.assign(ui, {
    menuButton: null, menuContainer: null, buttonWrapper: null, pageType: 'shell', onLayoutChange: null,
    dot: null, column: null, pill: null, list: null, peek: null,
    model: null, columnShown: false, loadCounted: false, peekChecked: false, observer: null,
  });
  rendering = null;
  pending = false;
}

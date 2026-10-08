// Shell surface: a dot on the Clio satellite button, a "What's new" row at the top of its menu,
// a flyout with the cards next to the menu, and a one-time peek card for critical items.
// Inside Creatio people are working, so normal news never go beyond the dot and the row.
import { shouldShowDot, pickPeek } from './newsCore.js';
import { loadSurface } from './newsModel.js';
import { markRead, markNoticed, recordDotShown, recordFirstShown, markAutoOpened, onNewsStorageChange, openOptions } from './newsStore.js';
import { renderCards, newsIcon, ARCHIVE_URL } from './newsCards.js';

const RERENDER_MS = 10 * 60 * 1000;
const PEEK_MS = 10000;
const PEEK_AFTER_HOVER_MS = 3000;
const FLYOUT_WIDTH = 320;
// The flyout grows with its cards up to this share of the window height, then the list scrolls
export const FLYOUT_MAX_SHARE = 0.8;
const FLYOUT_MIN_LIST = 120;
const FLYOUT_EDGE = 16;

const ui = {
  menuButton: null, menuContainer: null, buttonWrapper: null, pageType: 'shell',
  dot: null, row: null, rowSep: null, pill: null, preview: null, flyout: null, list: null, peek: null,
  model: null, flyoutOpen: false, loadCounted: false, peekChecked: false, subscribed: false, observer: null, peekTimer: null,
  rowSeen: false,   // the row had unread items on this page; survives menu rebuilds, not reloads
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildRow() {
  const row = el('button', 'csl-news-row');
  row.type = 'button';
  row.setAttribute('role', 'menuitem');
  row.setAttribute('aria-haspopup', 'true');
  row.setAttribute('aria-expanded', 'false');
  const icon = el('span', 'csl-news-row__icon');
  icon.innerHTML = newsIcon();
  const text = el('span', 'csl-news-row__text');
  const title = el('span', 'csl-news-row__title', "What's new");
  const pill = el('span', 'csl-news-pill');
  title.appendChild(pill);
  const preview = el('span', 'csl-news-row__preview');
  text.append(title, preview);
  const chevron = el('span', 'csl-news-row__chevron');
  chevron.innerHTML = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M4.5 3l3 3-3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  row.append(icon, text, chevron);
  row.addEventListener('click', (event) => {
    event.stopPropagation();
    setFlyout(!ui.flyoutOpen);
  });
  return { row, pill, preview };
}

function buildFlyout() {
  const flyout = el('div', 'csl-news csl-news--dark csl-news-flyout');
  flyout.setAttribute('role', 'region');
  flyout.setAttribute('aria-label', 'Developer news');
  flyout.hidden = true;
  const head = el('div', 'csl-news-panel__head');
  const markAll = el('button', 'csl-news-linkbtn', 'Mark all as read');
  markAll.type = 'button';
  head.append(el('strong', '', 'Dev tools news'), markAll);
  const list = el('ul', 'csl-news-list');
  const foot = el('div', 'csl-news-panel__foot');
  const all = el('a', '', 'All news →');
  all.href = ARCHIVE_URL;
  all.target = '_blank';
  all.rel = 'noopener noreferrer';
  const topics = el('button', 'csl-news-linkbtn', 'Choose topics');
  topics.type = 'button';
  foot.append(all, topics);
  flyout.append(head, list, foot);
  flyout.addEventListener('click', event => event.stopPropagation());
  markAll.addEventListener('click', () => { if (ui.model) markRead(ui.model.visible.map(i => i.id)).then(render); });
  topics.addEventListener('click', () => openOptions());
  return { flyout, list };
}

function placeFlyout() {
  // Beside the menu when there is room on the right, otherwise on its left
  const rect = ui.menuContainer.getBoundingClientRect();
  const roomRight = window.innerWidth - rect.right;
  ui.flyout.classList.toggle('csl-news-flyout--left', roomRight < FLYOUT_WIDTH + 16);
  fitFlyoutHeight();
}

// Few news → the flyout is as tall as its cards; many → up to 80% of the window, and never
// below its bottom edge. Only the list scrolls, the head and foot stay in place.
export function flyoutListMaxHeight({ viewportHeight, flyoutTop, chromeHeight }) {
  const flyoutMax = Math.min(viewportHeight * FLYOUT_MAX_SHARE, viewportHeight - Math.max(0, flyoutTop) - FLYOUT_EDGE);
  return Math.max(FLYOUT_MIN_LIST, Math.floor(flyoutMax - chromeHeight));
}

function fitFlyoutHeight() {
  if (!ui.flyout || ui.flyout.hidden || !ui.list) return;
  const chromeHeight = ui.flyout.offsetHeight - ui.list.offsetHeight;
  ui.list.style.maxHeight = `${flyoutListMaxHeight({
    viewportHeight: window.innerHeight,
    flyoutTop: ui.flyout.getBoundingClientRect().top,
    chromeHeight,
  })}px`;
}

function onWindowResize() {
  if (ui.flyoutOpen) fitFlyoutHeight();
}

async function setFlyout(open) {
  if (!ui.flyout) return;
  const wasOpen = ui.flyoutOpen;
  ui.flyoutOpen = open;
  ui.flyout.hidden = !open;
  ui.row?.setAttribute('aria-expanded', String(open));
  if (open) {
    placeFlyout();
    if (ui.model) recordFirstShown(ui.model.visible.map(i => i.id));
  } else if (wasOpen && ui.model) {
    // Closing the flyout marks what it showed as read
    await markRead(ui.model.visible.map(i => i.id));
  }
  return render();
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
    if (!ui.menuContainer.classList.contains('visible')) ui.menuButton.click();
    setFlyout(true);
  });
}

function onMenuVisibility() {
  const visible = ui.menuContainer.classList.contains('visible');
  if (visible) {
    hidePeek();
    if (ui.model?.unread.length) markNoticed(ui.model.unread.map(i => i.id)).then(render);
  } else if (ui.flyoutOpen) {
    setFlyout(false);
  }
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

    // Nothing new → no row. Once shown, it stays until the page reloads, so closing the flyout
    // (which marks it read) does not remove the row under the cursor.
    if (unread.length) ui.rowSeen = true;
    const showRow = Boolean(model) && (unread.length > 0 || ui.rowSeen);
    ui.row.hidden = !showRow;
    ui.rowSep.hidden = !showRow;
    ui.pill.hidden = unread.length === 0;
    ui.pill.textContent = String(unread.length);
    ui.pill.classList.toggle('csl-news-pill--critical', hasCritical);
    ui.preview.textContent = unread[0]?.title || model?.visible[0]?.title || '';
    if (!model && ui.flyoutOpen) { ui.flyoutOpen = false; ui.flyout.hidden = true; }

    if (model && ui.flyoutOpen) {
      renderCards(ui.list, model.visible, model.ctx, { onVideoStart: item => markRead([item.id]).then(render) });
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
export function attachShellNews({ menuButton, menuContainer, buttonWrapper, pageType }) {
  ui.observer?.disconnect();
  hidePeek();
  Object.assign(ui, { menuButton, menuContainer, buttonWrapper, pageType, flyoutOpen: false });

  const dot = el('span', 'csl-news-dot');
  dot.setAttribute('aria-hidden', 'true');
  dot.hidden = true;
  buttonWrapper.appendChild(dot);

  const { row, pill, preview } = buildRow();
  row.hidden = true;
  const rowSep = el('div', 'csl-news-row-sep');
  rowSep.hidden = true;
  menuContainer.prepend(row, rowSep);

  const { flyout, list } = buildFlyout();
  menuContainer.appendChild(flyout);
  Object.assign(ui, { dot, row, rowSep, pill, preview, flyout, list });

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
    menuButton: null, menuContainer: null, buttonWrapper: null, pageType: 'shell',
    dot: null, row: null, rowSep: null, pill: null, preview: null, flyout: null, list: null, peek: null,
    model: null, flyoutOpen: false, loadCounted: false, peekChecked: false, observer: null, rowSeen: false,
  });
  rendering = null;
  pending = false;
}

// Login surface: an always-visible 32 px strip under the profile row and a collapsible list of cards.
import { pickAutoExpand } from './newsCore.js';
import { loadSurface } from './newsModel.js';
import { markRead, recordFirstShown, markAutoOpened, onNewsStorageChange, openOptions } from './newsStore.js';
import { renderCards, newsIcon, ARCHIVE_URL } from './newsCards.js';

const ROW_SELECTOR = '.creatio-satelite-login-profiles-container';
const RERENDER_MS = 10 * 60 * 1000;   // trending windows can end while the page stays open

const ui = { root: null, open: false, model: null, autoChecked: false, pulsed: false, rendering: null, pending: false };

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function waitFor(selector, timeoutMs) {
  return new Promise(resolve => {
    const found = document.querySelector(selector);
    if (found) { resolve(found); return; }
    const observer = new MutationObserver(() => {
      const node = document.querySelector(selector);
      if (node) { observer.disconnect(); resolve(node); }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => { observer.disconnect(); resolve(null); }, timeoutMs);
  });
}

function build(row) {
  const root = el('div', 'csl-news csl-news--light');
  root.hidden = true;
  if (row.style.width) root.style.width = row.style.width;

  const strip = el('button', 'csl-news-strip');
  strip.type = 'button';
  strip.setAttribute('aria-expanded', 'false');
  strip.setAttribute('aria-controls', 'csl-news-panel');
  const icon = el('span', 'csl-news-strip__icon');
  icon.innerHTML = newsIcon();
  const count = el('span', 'csl-news-strip__count');
  const headline = el('span', 'csl-news-strip__headline');
  const chevron = el('span', 'csl-news-strip__chevron');
  chevron.innerHTML = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  strip.append(icon, count, headline, chevron);

  const panel = el('div', 'csl-news-panel');
  panel.id = 'csl-news-panel';
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'Developer news');
  panel.hidden = true;
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
  panel.append(head, list, foot);
  root.append(strip, panel);

  strip.addEventListener('click', () => setOpen(!ui.open));
  markAll.addEventListener('click', () => {
    if (ui.model) markRead(ui.model.visible.map(i => i.id)).then(render);
  });
  topics.addEventListener('click', () => openOptions());

  Object.assign(ui, { root, strip, count, headline, panel, list });
  return root;
}

async function setOpen(open) {
  const wasOpen = ui.open;
  ui.open = open;
  // Facebook-style: the list counts as read once it has been opened and closed again
  if (wasOpen && !open && ui.model) await markRead(ui.model.visible.map(i => i.id));
  return render();
}

async function render() {
  // Serialize renders: storage events can arrive while a render is still loading the feed
  if (ui.rendering) { ui.pending = true; return ui.rendering; }
  ui.rendering = (async () => {
    const model = await loadSurface('login');
    ui.model = model;
    const { root } = ui;
    if (!model) { root.hidden = true; return; }

    const { visible, unread, ctx, state } = model;
    if (!ui.autoChecked) {
      ui.autoChecked = true;
      const critical = pickAutoExpand(unread, state);
      if (critical) { ui.open = true; markAutoOpened(critical.id); }
    }

    const lead = unread[0] || visible[0];
    root.hidden = false;
    root.classList.toggle('csl-news--unread', unread.length > 0);
    root.classList.toggle('csl-news--critical', unread.some(i => i.priority === 'critical'));
    root.classList.toggle('csl-news--open', ui.open);
    if (unread.length && !ui.pulsed) { ui.pulsed = true; root.classList.add('csl-news--pulse'); }
    ui.count.textContent = unread.length ? `${unread.length} new` : '';
    ui.headline.textContent = unread.length ? lead.title : `What's new · ${lead.title}`;
    ui.strip.setAttribute('aria-expanded', String(ui.open));
    ui.strip.setAttribute('aria-label', `Developer news${unread.length ? `, ${unread.length} new` : ''}: ${lead.title}`);
    ui.panel.hidden = !ui.open;

    const shown = ui.open ? visible.map(i => i.id) : [lead.id];
    recordFirstShown(shown);
    if (ui.open) {
      renderCards(ui.list, visible, ctx, { onVideoStart: item => markRead([item.id]).then(render) });
    }
  })();
  try {
    await ui.rendering;
  } finally {
    ui.rendering = null;
    if (ui.pending) { ui.pending = false; render(); }
  }
}

export async function initLoginNews() {
  const row = await waitFor(ROW_SELECTOR, 30000);
  if (!row || document.querySelector('.csl-news')) return;
  row.insertAdjacentElement('afterend', build(row));
  await render();
  onNewsStorageChange(() => render());
  setInterval(render, RERENDER_MS);
}

// For tests
export function _resetLoginNews() {
  Object.assign(ui, { root: null, open: false, model: null, autoChecked: false, pulsed: false, rendering: null, pending: false });
}

const GOOGLE_PALETTE = [
  '#4285F4', '#EA4335', '#34A853', '#FF6D00',
  '#9C27B0', '#00BCD4', '#E91E63', '#3F51B5',
  '#009688', '#FF5722', '#795548', '#607D8B',
];

function hashColor(host) {
  let hash = 0;
  for (let i = 0; i < host.length; i++) {
    hash = host.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GOOGLE_PALETTE[Math.abs(hash) % GOOGLE_PALETTE.length];
}

function getTextColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55
    ? 'rgba(0,0,0,0.85)'
    : '#ffffff';
}

const SVG_STAR_EMPTY = `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 1.5l1.76 3.57 3.94.57-2.85 2.78.67 3.92L8 10.27l-3.52 1.07.67-3.92L2.3 5.64l3.94-.57L8 1.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
const SVG_STAR_FULL  = `<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8 1.5l1.76 3.57 3.94.57-2.85 2.78.67 3.92L8 10.27l-3.52 1.07.67-3.92L2.3 5.64l3.94-.57L8 1.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
const SVG_TRASH      = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 4h12M6 4V2h4v2M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SVG_CHECK      = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L3.8 7.5 8.5 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const fmt = new Intl.DateTimeFormat(undefined, {
  day: 'numeric', month: 'short', year: 'numeric',
});

// ── Focus trap ─────────────────────────────────────────────

function trapFocus(container, onEscape) {
  const selector = 'button:not([disabled]), input:not([disabled]), a[href], select, textarea, [tabindex]:not([tabindex="-1"])';

  function handleKeydown(e) {
    if (e.key === 'Escape') { onEscape?.(); return; }
    if (e.key !== 'Tab') return;

    const els = [...container.querySelectorAll(selector)];
    if (els.length === 0) return;

    const first = els[0];
    const last  = els[els.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      last.focus(); e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus(); e.preventDefault();
    }
  }

  container.addEventListener('keydown', handleKeydown);
  return () => container.removeEventListener('keydown', handleKeydown);
}

let removeTrapConfirm = null;

// ── Selection state ────────────────────────────────────────
const selectedOrigins = new Set();

function toggleSelection(origin) {
  if (selectedOrigins.has(origin)) selectedOrigins.delete(origin);
  else selectedOrigins.add(origin);
  updateSelectionUI();
}

function clearSelection() {
  selectedOrigins.clear();
  updateSelectionUI();
}

function updateSelectionUI() {
  const count = selectedOrigins.size;
  const label = `${count} selected`;

  // Update tile classes
  document.querySelectorAll('.env-tile').forEach(tile => {
    tile.classList.toggle('env-tile--selected', selectedOrigins.has(tile.dataset.origin));
  });

  // Show each bulk bar only when its own grid has selected tiles
  const favHasSelected = [...document.querySelectorAll('#favorites-grid .env-tile')]
    .some(t => selectedOrigins.has(t.dataset.origin));
  const mainHasSelected = [...document.querySelectorAll('#environments-grid .env-tile')]
    .some(t => selectedOrigins.has(t.dataset.origin));

  document.getElementById('favorites-bulk-bar').style.display = favHasSelected ? '' : 'none';
  document.getElementById('favorites-bulk-count').textContent = label;

  document.getElementById('env-bulk-bar').style.display = mainHasSelected ? '' : 'none';
  document.getElementById('env-bulk-count').textContent = label;
}

// ── Tile creation ──────────────────────────────────────────
function createTile(origin, raw, isFav, userProfiles) {
  const username  = typeof raw === 'string' ? raw : raw?.username;
  const timestamp = typeof raw === 'object' ? (raw?.timestamp ?? 0) : 0;

  let host = origin;
  try { host = new URL(origin).host; } catch {}

  const profile = userProfiles.find(p => p.username === username);
  const displayName = profile
    ? (profile.alias?.trim() ? profile.alias : profile.username)
    : (username || '');

  const color     = hashColor(host);
  const textColor = getTextColor(color);
  const dateStr   = timestamp ? fmt.format(new Date(timestamp)) : '';
  const meta      = [displayName, dateStr].filter(Boolean).join(' · ');

  const tile = document.createElement('div');
  tile.className = 'env-tile';
  tile.style.background = color;
  tile.style.color = textColor;
  tile.dataset.origin = origin;

  let port = '';
  try { port = new URL(origin).port; } catch {}
  tile.dataset.searchText = [host, username, displayName, origin, port]
    .filter(Boolean).join(' ').toLowerCase();

  if (selectedOrigins.has(origin)) tile.classList.add('env-tile--selected');

  // Selection checkbox (top-left)
  const check = document.createElement('div');
  check.className = 'env-tile__check';
  check.innerHTML = SVG_CHECK;
  check.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    toggleSelection(origin);
  });

  const favBtn = document.createElement('button');
  favBtn.className = 'env-tile__fav-btn' + (isFav ? ' env-tile__fav-btn--active' : '');
  favBtn.title = isFav ? 'Remove from favorites' : 'Add to favorites';
  favBtn.innerHTML = isFav ? SVG_STAR_FULL : SVG_STAR_EMPTY;
  favBtn.style.color = textColor;
  favBtn.setAttribute('data-origin', origin);
  favBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(origin);
  });

  const delBtn = document.createElement('button');
  delBtn.className = 'env-tile__del-btn';
  delBtn.title = 'Remove environment';
  delBtn.innerHTML = SVG_TRASH;
  delBtn.style.color = textColor;
  delBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    openConfirmModal('single', origin);
  });

  const link = document.createElement('a');
  link.className = 'env-tile__link';
  link.href = origin;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.addEventListener('click', e => {
    if (dragActive) {
      // mouseup from a rubber-band drag fired a synthetic click — ignore it
      e.preventDefault();
      return;
    }
    if (e.ctrlKey || e.metaKey || selectedOrigins.size > 0) {
      e.preventDefault();
      toggleSelection(origin);
    }
  });

  const hostnameEl = document.createElement('div');
  hostnameEl.className = 'env-tile__hostname';
  hostnameEl.textContent = host;
  hostnameEl.title = host;

  const metaEl = document.createElement('div');
  metaEl.className = 'env-tile__meta';
  metaEl.textContent = meta;

  link.appendChild(hostnameEl);
  link.appendChild(metaEl);

  const actions = document.createElement('div');
  actions.className = 'env-tile__actions';
  actions.appendChild(favBtn);
  actions.appendChild(delBtn);

  tile.appendChild(check);
  tile.appendChild(link);
  tile.appendChild(actions);

  return tile;
}

// ── Render ─────────────────────────────────────────────────
function renderEnvironments(data) {
  const { lastLoginProfiles, userProfiles, favoriteEnvironments: favs } = data;
  const favSet = new Set(favs);

  const entries = Object.entries(lastLoginProfiles)
    .map(([origin, raw]) => ({
      origin,
      timestamp: typeof raw === 'object' ? (raw?.timestamp ?? 0) : 0,
    }))
    .sort((a, b) => b.timestamp - a.timestamp);

  const favEntries  = entries.filter(e =>  favSet.has(e.origin));
  const mainEntries = entries.filter(e => !favSet.has(e.origin));

  const favsSection = document.getElementById('favorites-section');
  const favsGrid    = document.getElementById('favorites-grid');
  favsGrid.innerHTML = '';

  if (favEntries.length > 0) {
    favsSection.style.display = '';
    favEntries.forEach(({ origin }) =>
      favsGrid.appendChild(createTile(origin, lastLoginProfiles[origin], true, userProfiles))
    );
  } else {
    favsSection.style.display = 'none';
  }

  document.getElementById('all-section-title').textContent =
    favEntries.length > 0 ? 'All environments' : 'Environments';

  const grid = document.getElementById('environments-grid');
  grid.innerHTML = '';

  if (mainEntries.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'env-empty';
    empty.textContent = 'No environments yet. Log in to a Creatio instance to see it here.';
    grid.appendChild(empty);
  } else {
    mainEntries.forEach(({ origin }) =>
      grid.appendChild(createTile(origin, lastLoginProfiles[origin], false, userProfiles))
    );
  }

  // Show footer only when there are non-fav environments
  document.getElementById('env-card-footer').style.display =
    mainEntries.length > 0 ? '' : 'none';

  // Re-apply current search filter after re-render
  filterTiles(document.getElementById('env-search').value);

  updateSelectionUI();
}

function loadEnvironments() {
  chrome.storage.sync.get(
    { lastLoginProfiles: {}, userProfiles: [], favoriteEnvironments: [] },
    renderEnvironments
  );
}

// ── Search / filter ────────────────────────────────────────
function filterTiles(query) {
  const q = query.trim().toLowerCase();

  // Filter both grids
  ['environments-grid', 'favorites-grid'].forEach(gridId => {
    const grid = document.getElementById(gridId);
    let visible = 0;

    grid.querySelectorAll('.env-tile').forEach(tile => {
      const matches = !q || tile.dataset.searchText.includes(q);
      tile.style.display = matches ? '' : 'none';
      if (matches) visible++;
    });

    // Manage search empty state for the main grid only
    if (gridId === 'environments-grid') {
      let emptyEl = grid.querySelector('.env-empty');
      const hasTiles = grid.querySelectorAll('.env-tile').length > 0;

      if (hasTiles && visible === 0) {
        if (!emptyEl) {
          emptyEl = document.createElement('p');
          emptyEl.className = 'env-empty env-empty--search';
          grid.appendChild(emptyEl);
        }
        emptyEl.textContent = `No environments match "${q}".`;
        emptyEl.style.display = '';
      } else if (emptyEl && emptyEl.classList.contains('env-empty--search')) {
        emptyEl.style.display = 'none';
      }
    }
  });
}

// ── Favorites ──────────────────────────────────────────────
function toggleFavorite(origin) {
  chrome.storage.sync.get({ favoriteEnvironments: [] }, data => {
    const favs = data.favoriteEnvironments;
    const idx  = favs.indexOf(origin);
    if (idx === -1) favs.push(origin); else favs.splice(idx, 1);
    chrome.storage.sync.set({ favoriteEnvironments: favs }, loadEnvironments);
  });
}

// ── Confirm modal ──────────────────────────────────────────
let pendingDeleteMode   = null;
let pendingDeleteOrigin = null;

function openConfirmModal(mode, origin) {
  pendingDeleteMode   = mode;
  pendingDeleteOrigin = origin || null;

  const titleEl = document.getElementById('confirm-modal-title');
  const textEl  = document.getElementById('confirm-modal-text');

  if (mode === 'single') {
    titleEl.textContent = 'Delete environment';
    textEl.textContent  = 'Delete this environment? This action cannot be undone.';
  } else if (mode === 'selected') {
    const n = selectedOrigins.size;
    titleEl.textContent = 'Delete environments';
    textEl.textContent  = `Delete ${n} selected environment${n === 1 ? '' : 's'}? This action cannot be undone.`;
  } else if (mode === 'non-favorites') {
    titleEl.textContent = 'Delete all environments';
    textEl.textContent  = 'All environments will be removed. Environments marked as favorites will be preserved. This action cannot be undone.';
  }

  const modal = document.getElementById('confirm-modal');
  modal.style.display = 'block';
  document.getElementById('confirm-delete-btn').focus();
  removeTrapConfirm = trapFocus(modal.querySelector('.dialog'), closeConfirmModal);
}

function closeConfirmModal() {
  removeTrapConfirm?.();
  removeTrapConfirm = null;
  pendingDeleteMode   = null;
  pendingDeleteOrigin = null;
  document.getElementById('confirm-modal').style.display = 'none';
}

// ── Delete actions ─────────────────────────────────────────
function deleteEnvironment(origin) {
  selectedOrigins.delete(origin);
  chrome.storage.sync.get({ lastLoginProfiles: {}, favoriteEnvironments: [] }, data => {
    const profiles = data.lastLoginProfiles;
    delete profiles[origin];
    const favs = data.favoriteEnvironments.filter(f => f !== origin);
    chrome.storage.sync.set({ lastLoginProfiles: profiles, favoriteEnvironments: favs }, loadEnvironments);
  });
}

function deleteSelectedEnvironments() {
  const toDelete = [...selectedOrigins];
  chrome.storage.sync.get({ lastLoginProfiles: {}, favoriteEnvironments: [] }, data => {
    const profiles = data.lastLoginProfiles;
    toDelete.forEach(o => delete profiles[o]);
    const favs = data.favoriteEnvironments.filter(f => !toDelete.includes(f));
    chrome.storage.sync.set({ lastLoginProfiles: profiles, favoriteEnvironments: favs }, () => {
      selectedOrigins.clear();
      loadEnvironments();
    });
  });
}

function deleteAllExceptFavorites() {
  chrome.storage.sync.get({ lastLoginProfiles: {}, favoriteEnvironments: [] }, data => {
    const favSet = new Set(data.favoriteEnvironments);
    const profiles = {};
    Object.keys(data.lastLoginProfiles).forEach(origin => {
      if (favSet.has(origin)) profiles[origin] = data.lastLoginProfiles[origin];
    });
    chrome.storage.sync.set({ lastLoginProfiles: profiles }, () => {
      selectedOrigins.clear();
      loadEnvironments();
    });
  });
}

// ── Rubber-band drag selection ─────────────────────────────
// Set to true while a real drag is in progress so the link click
// handler can ignore the click that follows mouseup.
let dragActive = false;

function setupDragSelection() {
  let tracking = false;
  let anchorX = 0, anchorY = 0;
  let preDragSelection = new Set();

  const rectEl = document.createElement('div');
  rectEl.className = 'env-select-rect';
  rectEl.style.display = 'none';
  document.body.appendChild(rectEl);

  document.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    // Allow drag from anywhere inside .cards except interactive controls
    if (
      e.target.closest('.env-tile__actions') ||
      e.target.closest('.env-tile__check') ||
      e.target.closest('.env-bulk-bar') ||
      e.target.closest('.card__toolbar') ||
      e.target.closest('.modal')
    ) return;
    if (!e.target.closest('.cards')) return;

    e.preventDefault(); // prevent text selection while dragging
    tracking = true;
    dragActive = false;
    anchorX = e.clientX;
    anchorY = e.clientY;
    preDragSelection = new Set(selectedOrigins);
  });

  document.addEventListener('mousemove', e => {
    if (!tracking) return;
    const dx = e.clientX - anchorX;
    const dy = e.clientY - anchorY;
    if (!dragActive && Math.hypot(dx, dy) > 6) dragActive = true;

    if (dragActive) {
      const x = Math.min(e.clientX, anchorX);
      const y = Math.min(e.clientY, anchorY);
      const w = Math.abs(dx);
      const h = Math.abs(dy);
      rectEl.style.cssText = `display:block;left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;

      // Mirror Finder: tiles inside rect look selected in real time;
      // tiles that leave the rect revert to pre-drag state.
      document.querySelectorAll('.env-tile').forEach(tile => {
        const r = tile.getBoundingClientRect();
        const inRange = !(r.right < x || r.left > x + w || r.bottom < y || r.top > y + h);
        if (inRange) {
          selectedOrigins.add(tile.dataset.origin);
        } else if (!preDragSelection.has(tile.dataset.origin)) {
          selectedOrigins.delete(tile.dataset.origin);
        }
        tile.classList.toggle('env-tile--selected', selectedOrigins.has(tile.dataset.origin));
      });

      // Keep both bulk bars in sync during drag
      updateSelectionUI();
    }
  });

  document.addEventListener('mouseup', () => {
    if (!tracking) return;
    tracking = false;

    if (dragActive) {
      rectEl.style.display = 'none';
      updateSelectionUI();
      // Keep dragActive true briefly so the link click handler can see it
      setTimeout(() => { dragActive = false; }, 0);
    } else {
      dragActive = false;
    }
  });
}

// ── Theme ──────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme || 'system');
}

document.getElementById('theme-toggle').addEventListener('click', e => {
  const btn = e.target.closest('.theme-switcher__btn');
  if (!btn) return;
  const theme = btn.dataset.themeValue;
  applyTheme(theme);
  chrome.storage.local.set({ theme });
});

document.getElementById('close-btn').addEventListener('click', () => window.close());

// ── Bootstrap ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get({ theme: 'system' }, data => applyTheme(data.theme));
  loadEnvironments();
  setupDragSelection();

  document.getElementById('confirm-delete-btn').addEventListener('click', () => {
    if (pendingDeleteMode === 'single' && pendingDeleteOrigin) {
      deleteEnvironment(pendingDeleteOrigin);
    } else if (pendingDeleteMode === 'selected') {
      deleteSelectedEnvironments();
    } else if (pendingDeleteMode === 'non-favorites') {
      deleteAllExceptFavorites();
    }
    closeConfirmModal();
  });

  document.getElementById('cancel-delete-btn').addEventListener('click', closeConfirmModal);
  document.querySelector('#confirm-modal .confirm-close').addEventListener('click', closeConfirmModal);
  document.getElementById('confirm-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeConfirmModal();
  });

  const searchInput = document.getElementById('env-search');
  const searchClear = document.getElementById('env-search-clear');

  searchInput.addEventListener('input', e => {
    filterTiles(e.target.value);
    searchClear.style.display = e.target.value ? '' : 'none';
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.style.display = 'none';
    filterTiles('');
    searchInput.focus();
  });

  // Both bulk bars share the same actions (operate on all selected tiles)
  document.getElementById('deselect-all-btn').addEventListener('click', clearSelection);
  document.getElementById('fav-deselect-all-btn').addEventListener('click', clearSelection);

  document.getElementById('delete-selected-btn').addEventListener('click', () => {
    if (selectedOrigins.size > 0) openConfirmModal('selected');
  });
  document.getElementById('fav-delete-selected-btn').addEventListener('click', () => {
    if (selectedOrigins.size > 0) openConfirmModal('selected');
  });

  document.getElementById('delete-non-fav-btn').addEventListener('click', () => {
    openConfirmModal('non-favorites');
  });
});

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

const fmt = new Intl.DateTimeFormat(undefined, {
  day: 'numeric', month: 'short', year: 'numeric',
});

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

  const favBtn = document.createElement('button');
  favBtn.className = 'env-tile__fav-btn' + (isFav ? ' env-tile__fav-btn--active' : '');
  favBtn.title = isFav ? 'Remove from favourites' : 'Add to favourites';
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
    openConfirmDelete(origin);
  });

  const link = document.createElement('a');
  link.className = 'env-tile__link';
  link.href = origin;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  const hostnameEl = document.createElement('div');
  hostnameEl.className = 'env-tile__hostname';
  hostnameEl.textContent = host;

  const metaEl = document.createElement('div');
  metaEl.className = 'env-tile__meta';
  metaEl.textContent = meta;

  link.appendChild(hostnameEl);
  link.appendChild(metaEl);

  const actions = document.createElement('div');
  actions.className = 'env-tile__actions';
  actions.appendChild(favBtn);
  actions.appendChild(delBtn);

  tile.appendChild(link);
  tile.appendChild(actions);

  return tile;
}

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
}

function loadEnvironments() {
  chrome.storage.sync.get(
    { lastLoginProfiles: {}, userProfiles: [], favoriteEnvironments: [] },
    renderEnvironments
  );
}

function toggleFavorite(origin) {
  chrome.storage.sync.get({ favoriteEnvironments: [] }, data => {
    const favs = data.favoriteEnvironments;
    const idx  = favs.indexOf(origin);
    if (idx === -1) favs.push(origin); else favs.splice(idx, 1);
    chrome.storage.sync.set({ favoriteEnvironments: favs }, loadEnvironments);
  });
}

let pendingDeleteOrigin = null;

function openConfirmDelete(origin) {
  pendingDeleteOrigin = origin;
  document.getElementById('confirm-modal').style.display = 'block';
}

function closeConfirmDelete() {
  pendingDeleteOrigin = null;
  document.getElementById('confirm-modal').style.display = 'none';
}

function deleteEnvironment(origin) {
  chrome.storage.sync.get({ lastLoginProfiles: {}, favoriteEnvironments: [] }, data => {
    const profiles = data.lastLoginProfiles;
    delete profiles[origin];
    const favs = data.favoriteEnvironments.filter(f => f !== origin);
    chrome.storage.sync.set({ lastLoginProfiles: profiles, favoriteEnvironments: favs }, loadEnvironments);
  });
}

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

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get({ theme: 'system' }, data => applyTheme(data.theme));
  loadEnvironments();

  document.getElementById('confirm-delete-btn').addEventListener('click', () => {
    if (pendingDeleteOrigin) deleteEnvironment(pendingDeleteOrigin);
    closeConfirmDelete();
  });

  document.getElementById('cancel-delete-btn').addEventListener('click', closeConfirmDelete);
  document.querySelector('#confirm-modal .confirm-close').addEventListener('click', closeConfirmDelete);

  document.getElementById('confirm-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeConfirmDelete();
  });
});

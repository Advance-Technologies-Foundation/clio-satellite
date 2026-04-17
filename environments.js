const GOOGLE_PALETTE = [
  '#4285F4', '#EA4335', '#34A853', '#FF6D00',
  '#9C27B0', '#00BCD4', '#E91E63', '#3F51B5',
  '#009688', '#FF5722', '#795548', '#607D8B',
];

function hashColor(hostname) {
  let hash = 0;
  for (let i = 0; i < hostname.length; i++) {
    hash = hostname.charCodeAt(i) + ((hash << 5) - hash);
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

const fmt = new Intl.DateTimeFormat(undefined, {
  day: 'numeric', month: 'short', year: 'numeric',
});

function createTile(origin, raw, isFav, userProfiles) {
  const username  = typeof raw === 'string' ? raw : raw?.username;
  const timestamp = typeof raw === 'object' ? (raw?.timestamp ?? 0) : 0;

  let hostname = origin;
  try { hostname = new URL(origin).hostname; } catch {}

  const profile = userProfiles.find(p => p.username === username);
  const displayName = profile
    ? (profile.alias?.trim() ? profile.alias : profile.username)
    : (username || '');

  const color    = hashColor(hostname);
  const textColor = getTextColor(color);
  const dateStr  = timestamp ? fmt.format(new Date(timestamp)) : '';
  const meta     = [displayName, dateStr].filter(Boolean).join(' · ');

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

  const link = document.createElement('a');
  link.className = 'env-tile__link';
  link.href = origin;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  const hostnameEl = document.createElement('div');
  hostnameEl.className = 'env-tile__hostname';
  hostnameEl.textContent = hostname;

  const metaEl = document.createElement('div');
  metaEl.className = 'env-tile__meta';
  metaEl.textContent = meta;

  link.appendChild(hostnameEl);
  link.appendChild(metaEl);
  tile.appendChild(favBtn);
  tile.appendChild(link);

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
});

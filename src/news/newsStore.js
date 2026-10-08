// chrome.storage and runtime messaging for developer news. Everything async returns a Promise and
// never throws: when the extension context is gone (extension reloaded), news silently stay hidden.

export const SYNC_DEFAULTS = {
  newsEnabled: false,      // preview feature: off until turned on in Options
  newsAudiences: ['admin', 'developer', 'other'],
  newsRead: {},
  newsFirstShown: {},
  newsAutoOpened: {},
  newsSkipped: {},         // items hidden at the first run (backlog of a new user)
  newsOnboardedAt: 0,      // when this browser profile first received the feed
};
export const LOCAL_DEFAULTS = { newsNoticed: {} };
const NEWS_KEYS = [...Object.keys(SYNC_DEFAULTS), ...Object.keys(LOCAL_DEFAULTS)];

function alive() {
  try {
    return Boolean(chrome?.runtime?.id ?? chrome?.storage);
  } catch {
    return false;
  }
}

function syncGet(defaults) {
  return new Promise(resolve => {
    try {
      chrome.storage.sync.get(defaults, data => resolve(data || { ...defaults }));
    } catch {
      resolve({ ...defaults });
    }
  });
}

function localGet(defaults) {
  return new Promise(resolve => {
    try {
      chrome.storage.local.get(defaults, data => resolve({ ...defaults, ...(data || {}) }));
    } catch {
      resolve({ ...defaults });
    }
  });
}

function set(area, data) {
  return new Promise(resolve => {
    try {
      chrome.storage[area].set(data, () => resolve());
    } catch {
      resolve();
    }
  });
}

export async function loadState() {
  const [sync, local] = await Promise.all([syncGet(SYNC_DEFAULTS), localGet(LOCAL_DEFAULTS)]);
  return {
    enabled: sync.newsEnabled === true,
    audiences: Array.isArray(sync.newsAudiences) && sync.newsAudiences.length ? sync.newsAudiences : SYNC_DEFAULTS.newsAudiences,
    read: sync.newsRead || {},
    firstShown: sync.newsFirstShown || {},
    autoOpened: sync.newsAutoOpened || {},
    lastPeekAt: sync.newsAutoOpened?.lastPeekAt || 0,
    noticed: local.newsNoticed || {},
    skipped: sync.newsSkipped || {},
    onboardedAt: sync.newsOnboardedAt || 0,
  };
}

// First run: remember which backlog items a new user does not need to see
export async function completeOnboarding(skipIds, now = Date.now()) {
  const skipped = Object.fromEntries(skipIds.map(id => [id, now]));
  await set('sync', { newsSkipped: skipped, newsOnboardedAt: now });
  return skipped;
}

async function updateSync(key, change) {
  const data = await syncGet({ [key]: SYNC_DEFAULTS[key] });
  const next = change({ ...data[key] });
  if (next) await set('sync', { [key]: next });
}

async function updateLocal(key, change) {
  const data = await localGet({ [key]: LOCAL_DEFAULTS[key] });
  const next = change({ ...data[key] });
  if (next) await set('local', { [key]: next });
}

export function markRead(ids, now = Date.now()) {
  if (!ids.length) return Promise.resolve();
  return updateSync('newsRead', map => {
    let changed = false;
    for (const id of ids) if (!map[id]) { map[id] = now; changed = true; }
    return changed ? map : null;
  });
}

// First time an item was on screen anywhere; starts its per-user trending window
export function recordFirstShown(ids, now = Date.now()) {
  if (!ids.length) return Promise.resolve();
  return updateSync('newsFirstShown', map => {
    let changed = false;
    for (const id of ids) if (!map[id]) { map[id] = now; changed = true; }
    return changed ? map : null;
  });
}

export function markAutoOpened(id, { peek = false, now = Date.now() } = {}) {
  return updateSync('newsAutoOpened', map => {
    map[id] = true;
    if (peek) map.lastPeekAt = now;
    return map;
  });
}

// One Shell page load showed the dot for these items (drives the 7 days / 10 loads decay)
export function recordDotShown(ids, now = Date.now()) {
  if (!ids.length) return Promise.resolve();
  return updateLocal('newsNoticed', map => {
    for (const id of ids) {
      const entry = map[id] || { firstDotAt: now, shellLoads: 0 };
      entry.shellLoads = (entry.shellLoads || 0) + 1;
      map[id] = entry;
    }
    return map;
  });
}

// The user opened the Clio satellite menu: the dot has done its job for these items
export function markNoticed(ids, now = Date.now()) {
  if (!ids.length) return Promise.resolve();
  return updateLocal('newsNoticed', map => {
    for (const id of ids) map[id] = { ...(map[id] || { firstDotAt: now, shellLoads: 0 }), noticedAt: now };
    return map;
  });
}

// Drops state of items that left the feed, so storage.sync stays small
export async function pruneTo(ids) {
  const keep = new Set(ids);
  const prune = map => {
    let changed = false;
    for (const id of Object.keys(map)) {
      if (id !== 'lastPeekAt' && !keep.has(id)) { delete map[id]; changed = true; }
    }
    return changed ? map : null;
  };
  await updateSync('newsRead', prune);
  await updateSync('newsFirstShown', prune);
  await updateSync('newsAutoOpened', prune);
  await updateSync('newsSkipped', prune);
  await updateLocal('newsNoticed', prune);
}

export function onNewsStorageChange(callback) {
  try {
    chrome.storage.onChanged?.addListener((changes) => {
      if (Object.keys(changes).some(k => NEWS_KEYS.includes(k))) callback();
    });
  } catch {
    // no storage events (tests, invalidated context)
  }
}

function send(message) {
  return new Promise(resolve => {
    if (!alive()) { resolve(null); return; }
    try {
      chrome.runtime.sendMessage(message, response => {
        try { void chrome.runtime.lastError; } catch { /* ignore */ }
        resolve(response ?? null);
      });
    } catch {
      resolve(null);
    }
  });
}

// Parsed feed JSON from the background cache (the background refreshes it when stale)
export async function requestFeed() {
  const response = await send({ action: 'getNews' });
  if (!response?.ok || typeof response.raw !== 'string') return null;
  try {
    return JSON.parse(response.raw);
  } catch {
    return null;
  }
}

export async function requestMedia(url) {
  const response = await send({ action: 'getNewsMedia', url });
  return response?.ok ? response.dataUrl : null;
}

export function openOptions() {
  return send({ action: 'openOptionsPage' });
}

// Pure logic of the developer news feature: feed validation, filtering and unread rules.
// No DOM and no chrome.* here, so every rule is unit-testable.

export const FEED_URL = 'https://advance-technologies-foundation.github.io/clio-news-feed/v1/feeds/clio-satellite.json';
// Hosts the feed may move to (movedTo) and serve media from
export const FEED_HOSTS = ['advance-technologies-foundation.github.io'];
export const MEDIA_HOSTS = [...FEED_HOSTS, 'i.ytimg.com'];
export const CTA_HOSTS = [
  'github.com',
  'advance-technologies-foundation.github.io',
  'academy.creatio.com',
  'community.creatio.com',
  'www.youtube.com',
  'youtu.be',
];
export const ALL_AUDIENCES = ['admin', 'developer', 'other'];
export const TYPES = ['release', 'tip', 'event', 'breaking'];
export const MAX_VISIBLE = 5;
export const TITLE_MAX = 60;
export const BODY_MAX = 140;
export const DOT_DECAY_DAYS = 7;
export const DOT_DECAY_LOADS = 10;
export const PEEK_GAP_MS = 24 * 60 * 60 * 1000;
// First run: a new user starts with at most this many recent items, not the whole backlog
export const ONBOARDING_KEEP = 3;
export const ONBOARDING_WINDOW_DAYS = 30;
const HOUR = 60 * 60 * 1000;
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

function httpsUrlOnHosts(value, hosts) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && hosts.includes(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}

const isText = v => typeof v === 'string' && v.trim().length > 0;
const isDate = v => typeof v === 'string' && !Number.isNaN(Date.parse(v));
const clip = (s, max) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

function cleanMedia(media) {
  if (!media || typeof media !== 'object') return undefined;
  if (media.type === 'image') {
    const url = httpsUrlOnHosts(media.url, MEDIA_HOSTS);
    return url && isText(media.alt) ? { type: 'image', url, alt: media.alt } : undefined;
  }
  if (media.type === 'youtube' && VIDEO_ID.test(media.videoId || '') && isText(media.title)) {
    const out = { type: 'youtube', videoId: media.videoId, title: media.title, player: media.player === 'link' ? 'link' : 'embed' };
    const poster = media.poster && httpsUrlOnHosts(media.poster, MEDIA_HOSTS);
    if (poster) out.poster = poster;
    if (Number.isInteger(media.start) && media.start > 0) out.start = media.start;
    return out;
  }
  return undefined;
}

function cleanTrending(trending) {
  if (!trending || typeof trending !== 'object') return undefined;
  const out = {};
  if (Number.isInteger(trending.hours) && trending.hours >= 1 && trending.hours <= 720) out.hours = trending.hours;
  if (isDate(trending.until)) out.until = trending.until;
  return Object.keys(out).length ? out : undefined;
}

// Accepts the parsed feed JSON, returns { items, refreshHours, movedTo } with only well-formed items.
// Anything unexpected is dropped item by item; an unknown schema version drops the whole feed.
export function validateFeed(feed) {
  const result = { items: [], refreshHours: undefined, movedTo: undefined };
  if (!feed || feed.schemaVersion !== 1 || !Array.isArray(feed.items)) return result;
  if (Number.isInteger(feed.refreshHours) && feed.refreshHours >= 1 && feed.refreshHours <= 24) {
    result.refreshHours = feed.refreshHours;
  }
  result.movedTo = httpsUrlOnHosts(feed.movedTo, FEED_HOSTS) || undefined;

  for (const raw of feed.items) {
    if (!raw || !isText(raw.id) || !TYPES.includes(raw.type) || !isText(raw.title)) continue;
    if (!isDate(raw.publishedAt) || !isDate(raw.expiresAt)) continue;
    const item = {
      id: raw.id,
      type: raw.type,
      priority: raw.priority === 'critical' ? 'critical' : 'normal',
      title: clip(raw.title.trim(), TITLE_MAX),
      publishedAt: raw.publishedAt,
      expiresAt: raw.expiresAt,
      audiences: Array.isArray(raw.audiences) && raw.audiences.length
        ? raw.audiences.filter(a => ALL_AUDIENCES.includes(a))
        : [...ALL_AUDIENCES],
      surfaces: Array.isArray(raw.surfaces) && raw.surfaces.length ? raw.surfaces : ['login', 'shell'],
    };
    if (isText(raw.body)) item.body = clip(raw.body.trim(), BODY_MAX);
    if (raw.cta && isText(raw.cta.label)) {
      const url = httpsUrlOnHosts(raw.cta.url, CTA_HOSTS);
      if (url) item.cta = { label: raw.cta.label, url };
    }
    const trending = item.priority === 'critical' ? undefined : cleanTrending(raw.trending);
    if (trending) item.trending = trending;
    const media = cleanMedia(raw.media);
    if (media) item.media = media;
    if (typeof raw.minVersion === 'string') item.minVersion = raw.minVersion;
    if (!item.audiences.length) continue;
    result.items.push(item);
  }
  return result;
}

export function compareVersions(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return Math.sign(d);
  }
  return 0;
}

// Is the item still marked as new for this user (not read and inside its trending window)?
export function isUnreadSignal(item, { now, read = {}, firstShown = {} }) {
  if (read[item.id]) return false;
  if (!item.trending) return true;
  const ends = [];
  if (item.trending.until) ends.push(Date.parse(item.trending.until));
  if (item.trending.hours) ends.push((firstShown[item.id] ?? now) + item.trending.hours * HOUR);
  return now < Math.min(...ends);
}

// On the very first run, which live items to skip so a new user is not greeted by the whole backlog:
// everything except the ONBOARDING_KEEP newest items published in the last ONBOARDING_WINDOW_DAYS.
// Critical items are never skipped. Items published after the first run are never affected.
export function onboardingSkip(items, { now }) {
  const windowStart = now - ONBOARDING_WINDOW_DAYS * 24 * HOUR;
  const live = items
    .filter(i => Date.parse(i.publishedAt) <= now && now < Date.parse(i.expiresAt))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const keep = new Set(live
    .filter(i => i.priority !== 'critical' && Date.parse(i.publishedAt) >= windowStart)
    .slice(0, ONBOARDING_KEEP)
    .map(i => i.id));
  return live.filter(i => i.priority !== 'critical' && !keep.has(i.id)).map(i => i.id);
}

// Items this user should see on a surface, newest trending first, at most MAX_VISIBLE
export function selectVisible(items, { now, surface, audiences = ALL_AUDIENCES, extensionVersion, read = {}, firstShown = {}, skipped = {} }) {
  const chosen = new Set(audiences.length ? audiences : ALL_AUDIENCES);
  const visible = items.filter(item =>
    !skipped[item.id]
    && Date.parse(item.publishedAt) <= now
    && now < Date.parse(item.expiresAt)
    && item.surfaces.includes(surface)
    && (!item.minVersion || !extensionVersion || compareVersions(extensionVersion, item.minVersion) >= 0)
    // Critical items reach everyone who has news on, whatever roles they picked
    && (item.priority === 'critical' || item.audiences.some(a => chosen.has(a))));

  const trendingNow = item => Boolean(item.trending) && isUnreadSignal(item, { now, read: {}, firstShown });
  return visible
    .sort((a, b) =>
      (b.priority === 'critical') - (a.priority === 'critical')
      || trendingNow(b) - trendingNow(a)
      || Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, MAX_VISIBLE);
}

export function unreadItems(visible, state) {
  return visible.filter(item => isUnreadSignal(item, state));
}

export function isTrendingNow(item, { now, firstShown = {} }) {
  return Boolean(item.trending) && isUnreadSignal(item, { now, read: {}, firstShown });
}

// Shell dot: unread items that were not noticed yet (menu not opened) and have not decayed.
// Trending items decay with their window instead of the 7 days / 10 loads rule.
export function shouldShowDot(unread, { now, noticed = {} }) {
  return unread.some(item => {
    const n = noticed[item.id];
    if (n?.noticedAt) return false;
    if (item.trending || !n) return true;
    return now - n.firstDotAt < DOT_DECAY_DAYS * 24 * HOUR && (n.shellLoads || 0) < DOT_DECAY_LOADS;
  });
}

// The one critical item to peek at in Shell, or null
export function pickPeek(unread, { now, autoOpened = {}, lastPeekAt = 0, pageType }) {
  if (pageType !== 'shell') return null;
  if (now - lastPeekAt < PEEK_GAP_MS) return null;
  return unread.find(item => item.priority === 'critical' && !autoOpened[item.id]) || null;
}

// The one critical item to auto-expand on the login page, or null
export function pickAutoExpand(unread, { autoOpened = {} }) {
  return unread.find(item => item.priority === 'critical' && !autoOpened[item.id]) || null;
}

export function youtubeEmbedUrl(media, origin) {
  const params = new URLSearchParams({ autoplay: '1', rel: '0', playsinline: '1', enablejsapi: '1' });
  if (origin) params.set('origin', origin);
  if (media.start) params.set('start', String(media.start));
  return `https://www.youtube-nocookie.com/embed/${media.videoId}?${params}`;
}

export function youtubeWatchUrl(media) {
  return `https://www.youtube.com/watch?v=${media.videoId}${media.start ? `&t=${media.start}s` : ''}`;
}

export function youtubePosterUrl(media) {
  return media.poster || `https://i.ytimg.com/vi/${media.videoId}/hqdefault.jpg`;
}

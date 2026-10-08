// Renders news cards for the login panel and the Shell flyout. Feed text is only ever set with
// textContent; links are built from validated https URLs (newsCore.validateFeed).
import { isTrendingNow, isUnreadSignal, youtubePosterUrl, youtubeWatchUrl } from './newsCore.js';
import { requestMedia } from './newsStore.js';
import { openVideoDialog } from './videoDialog.js';
import { track } from '../analytics.js';

const TAGS = { release: 'Release', tip: 'Tip', event: 'Event', breaking: 'Breaking' };
const TRENDING_ICON = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M1.5 8.5l3-3 2 2 4-4M7.5 3.5h3v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function externalLink(className, href, text) {
  const a = el('a', className, text);
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}

// Image or poster is fetched by the background worker as a data: URL, so the page CSP
// (img-src) of self-hosted Creatio instances cannot block it. On failure the media is dropped.
function loadImage(img, url, container) {
  requestMedia(url).then(dataUrl => {
    if (dataUrl) img.src = dataUrl;
    else container.remove();
  });
}

function renderMedia(item, { onVideoStart }) {
  const media = item.media;
  if (media.type === 'image') {
    const box = el('div', 'csl-news-media csl-news-media--image');
    const img = el('img');
    img.alt = media.alt;
    img.decoding = 'async';
    box.appendChild(img);
    loadImage(img, media.url, box);
    return box;
  }
  // YouTube: a poster with a play button; never an iframe inside the card
  const embed = media.player !== 'link';
  const poster = embed ? el('button', 'csl-news-media csl-news-media--video') : externalLink('csl-news-media csl-news-media--video', youtubeWatchUrl(media));
  if (embed) poster.type = 'button';
  poster.setAttribute('aria-label', `${embed ? 'Play video' : 'Watch on YouTube'}: ${media.title}`);
  const img = el('img');
  img.alt = '';
  poster.append(img, el('span', 'csl-news-media__play'), el('span', 'csl-news-media__label', 'YouTube'));
  loadImage(img, youtubePosterUrl(media), img);
  if (embed) {
    poster.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openVideoDialog(media, { returnFocus: poster });
      onVideoStart?.(item);
    });
  }
  return poster;
}

// items: already filtered and sorted; state: { now, read, firstShown }
export function renderCards(list, items, state, { onVideoStart } = {}) {
  list.textContent = '';
  for (const item of items) {
    const unread = isUnreadSignal(item, state);
    const card = el('li', `csl-news-card${unread ? ' csl-news-card--unread' : ''}${item.priority === 'critical' ? ' csl-news-card--critical' : ''}`);
    card.dataset.newsId = item.id;
    const dot = el('span', 'csl-news-card__dot');
    dot.setAttribute('aria-hidden', 'true');

    const body = el('div', 'csl-news-card__body');
    const meta = el('div', 'csl-news-card__meta');
    meta.append(el('span', `csl-news-tag csl-news-tag--${item.type}`, TAGS[item.type]), el('span', '', formatDate(item.publishedAt)));
    if (isTrendingNow(item, state)) {
      const trend = el('span', 'csl-news-trend');
      trend.innerHTML = TRENDING_ICON;
      trend.appendChild(document.createTextNode('Trending'));
      meta.appendChild(trend);
    }
    if (unread) meta.appendChild(el('span', 'csl-news-sr', 'Unread'));
    body.append(meta, el('h4', 'csl-news-card__title', item.title));
    if (item.media) body.appendChild(renderMedia(item, { onVideoStart }));
    if (item.body) body.appendChild(el('p', 'csl-news-card__text', item.body));
    if (item.cta) body.appendChild(externalLink('csl-news-card__cta', item.cta.url, `${item.cta.label} →`));
    card.append(dot, body);
    list.appendChild(card);
  }
}

// Usage statistics for a news panel: card links and videos, plus the head/foot controls marked
// with data-track. Capture phase, because the video poster stops propagation of its click.
// One listener per panel, so re-rendering the cards needs nothing extra.
export function trackPanelClicks(panel, surface) {
  panel.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const newsId = target.closest('.csl-news-card')?.dataset.newsId;
    if (target.closest('.csl-news-card__cta')) track('news_cta_click', { surface, news_id: newsId });
    else if (target.closest('.csl-news-media--video')) track('news_video_play', { surface, news_id: newsId });
    else {
      const action = target.closest('[data-track]')?.dataset.track;
      if (action) track(action, { surface });
    }
  }, true);
}

export function newsIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h13v14H6a2 2 0 0 1-2-2V5z"/><path d="M17 9h3v8a2 2 0 0 1-2 2"/><path d="M8 9h5"/><path d="M8 13h5"/><path d="M8 16h3"/></svg>';
}

export const ARCHIVE_URL = 'https://advance-technologies-foundation.github.io/clio-news-feed/';

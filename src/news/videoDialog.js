// Built-in YouTube player dialog. Tries a direct youtube-nocookie embed (referrer = the Creatio
// origin, which YouTube accepts) and falls back to a "Watch on YouTube" link when the host page's
// CSP blocks the frame or the player reports an error (e.g. embedding disabled, error 150/153).
// YouTube's iframe_api script is never loaded: readiness and errors come from its postMessage protocol.
import { youtubeEmbedUrl, youtubeWatchUrl } from './newsCore.js';

const EMBED_ORIGIN = 'https://www.youtube-nocookie.com';
let open = null;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showFallback(screen, media) {
  screen.textContent = '';
  screen.classList.add('csl-news-video__screen--fallback');
  const msg = el('div', 'csl-news-video__fallback');
  const link = el('a', 'csl-news-video__watch', 'Watch on YouTube ↗');
  link.href = youtubeWatchUrl(media);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  msg.append(el('span', '', "This video can't play on this page."), link);
  screen.appendChild(msg);
}

export function closeVideoDialog() {
  if (!open) return;
  const { backdrop, returnFocus, cleanup } = open;
  open = null;
  cleanup();
  backdrop.remove();   // removing the iframe stops playback
  returnFocus?.focus?.();
}

export function openVideoDialog(media, { returnFocus } = {}) {
  closeVideoDialog();

  const backdrop = el('div', 'csl-news-video');
  const dialog = el('div', 'csl-news-video__dialog');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', media.title);

  const head = el('div', 'csl-news-video__head');
  const close = el('button', 'csl-news-video__close', '×');
  close.type = 'button';
  close.setAttribute('aria-label', 'Close video');
  head.append(el('strong', '', media.title), close);

  const screen = el('div', 'csl-news-video__screen');
  const iframe = document.createElement('iframe');
  const embedUrl = youtubeEmbedUrl(media, window.location.origin);
  iframe.src = embedUrl;
  iframe.title = media.title;
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  screen.appendChild(iframe);

  const foot = el('div', 'csl-news-video__foot');
  const watch = el('a', 'csl-news-video__link', 'Watch on YouTube ↗');
  watch.href = youtubeWatchUrl(media);
  watch.target = '_blank';
  watch.rel = 'noopener noreferrer';
  foot.appendChild(watch);

  dialog.append(head, screen, foot);
  backdrop.appendChild(dialog);

  const onViolation = (event) => {
    if (String(event.blockedURI || '').startsWith(EMBED_ORIGIN)) showFallback(screen, media);
  };
  const onMessage = (event) => {
    if (event.origin !== EMBED_ORIGIN || event.source !== iframe.contentWindow) return;
    let data;
    try { data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; } catch { return; }
    if (data?.event === 'onError') showFallback(screen, media);
  };
  const onKey = (event) => {
    if (event.key === 'Escape') { event.stopPropagation(); closeVideoDialog(); return; }
    if (event.key === 'Tab') {
      // Keep focus inside the dialog
      const focusable = [...dialog.querySelectorAll('button, a[href], iframe')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  };
  iframe.addEventListener('load', () => {
    // Ask the player to report its events (onReady, onError) through postMessage
    try { iframe.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), EMBED_ORIGIN); } catch { /* ignore */ }
  });
  document.addEventListener('securitypolicyviolation', onViolation);
  window.addEventListener('message', onMessage);
  document.addEventListener('keydown', onKey, true);
  close.addEventListener('click', closeVideoDialog);
  backdrop.addEventListener('click', (event) => {
    event.stopPropagation();
    if (event.target === backdrop) closeVideoDialog();
  });

  open = {
    backdrop,
    returnFocus,
    cleanup: () => {
      document.removeEventListener('securitypolicyviolation', onViolation);
      window.removeEventListener('message', onMessage);
      document.removeEventListener('keydown', onKey, true);
    },
  };
  // <html>, not <body>: Creatio marks <body> inert while Shell loads
  document.documentElement.appendChild(backdrop);
  close.focus();
  return backdrop;
}

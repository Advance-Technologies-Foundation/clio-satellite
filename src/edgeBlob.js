import { debugLog, getLastError } from './debug.js';

// How far (px) the cursor has to go past an edge the buttons already touch before they become a blob
export const PRESS_DISTANCE = 20;
// The cursor cannot go past the screen edge: holding it there this long also counts as pushed in
export const EDGE_HOLD_MS = 600;
// How far the blob stretches away from the edge before it tears off and becomes the buttons again.
// The real distance is the height of a button (createEdgeBlob `tearDistance`); this is the fallback.
export const TEAR_DISTANCE = 36;
// Hovering the blob this long brings the buttons out of it
export const PEEK_HOVER_MS = 2000;
// Buttons brought out of the blob go back into it after this long without the mouse on them or their menus
export const PEEK_IDLE_MS = 10000;
// Gap between the edge and the buttons that come out of the blob
export const EDGE_GAP = 8;
// How long the orange dot flies between the blob and the icon of the first button
export const DOT_FLIGHT_MS = 420;

export const EDGES = ['left', 'right', 'top', 'bottom'];
const BLOB_W = 36;
const BLOB_H = 100;
const BLOB_SCALE = 0.45;   // the goo shapes are drawn in an 80x160 frame and scaled down to 36x72
const GOO_TOP = (BLOB_H - 160 * BLOB_SCALE) / 2;   // the goo frame sits in the middle of the taller blob
const ROT = { left: 0, top: 90, right: 180, bottom: -90 };
const ORIGIN = { left: 'left center', right: 'right center', top: 'center top', bottom: 'center bottom' };
const STYLE_ID = 'csl-edge-blob-style';
const FILTER_ID = 'csl-edge-blob-goo';

export function isVertical(edge) {
  return edge === 'left' || edge === 'right';
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Which edge the buttons are pushed past and by how much. (rawX, rawY) is where the drag
// would put the buttons without clamping them to the viewport.
export function pressedEdge(rawX, rawY, width, height, vw, vh) {
  const over = { left: -rawX, right: rawX - (vw - width), top: -rawY, bottom: rawY - (vh - height) };
  let edge = null;
  for (const e of EDGES) if (over[e] > 0 && (!edge || over[e] > over[edge])) edge = e;
  return edge ? { edge, over: over[edge] } : null;
}

export function isCursorAtEdge(edge, x, y, vw, vh) {
  return { left: x <= 1, right: x >= vw - 2, top: y <= 1, bottom: y >= vh - 2 }[edge];
}

// Position of the blob centre along the edge, kept fully on screen
export function clampAlong(edge, along, vw, vh) {
  const span = isVertical(edge) ? vh : vw;
  return clamp(along, BLOB_H / 2, span - BLOB_H / 2);
}

export function alongForRect(edge, rect, vw, vh) {
  const along = isVertical(edge) ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
  return clampAlong(edge, along, vw, vh);
}

// Where the buttons stand when they come out of a blob at (edge, along)
export function buttonsPositionFor(edge, along, width, height, vw, vh, gap = EDGE_GAP) {
  const x = clamp(along - width / 2, 8, vw - width - 8);
  const y = clamp(along - height / 2, 8, vh - height - 8);
  if (edge === 'left') return { x: gap, y };
  if (edge === 'right') return { x: vw - width - gap, y };
  if (edge === 'top') return { x, y: gap };
  return { x, y: vh - height - gap };
}

// ─── Persistence ─────────────────────────────────────────────────────────────
// Stored per page type and origin, like the drag position. `along` is a fraction of the
// edge length, so the blob stays on the same spot after the window is resized.

const blobKey = pageType => `menuEdgeBlob_${pageType}_${window.location.origin}`;

export function saveBlobState(pageType, edge, along) {
  const span = isVertical(edge) ? window.innerHeight : window.innerWidth;
  chrome.storage.local.set({ [blobKey(pageType)]: { edge, along: along / span, timestamp: Date.now() } }, () => {
    const err = getLastError();
    if (err) console.error('[Clio Satellite] Failed to save edge blob:', err.message);
  });
}

export function loadBlobState(pageType, callback) {
  chrome.storage.local.get([blobKey(pageType)], (result) => {
    const err = getLastError();
    const saved = err ? null : result[blobKey(pageType)];
    if (!saved || !EDGES.includes(saved.edge) || typeof saved.along !== 'number') {
      callback(null);
      return;
    }
    const span = isVertical(saved.edge) ? window.innerHeight : window.innerWidth;
    callback({ edge: saved.edge, along: clampAlong(saved.edge, saved.along * span, window.innerWidth, window.innerHeight) });
  });
}

export function clearBlobState(pageType) {
  chrome.storage.local.remove([blobKey(pageType)], () => {
    const err = getLastError();
    if (err) console.error('[Clio Satellite] Failed to clear edge blob:', err.message);
  });
}

// ─── DOM ─────────────────────────────────────────────────────────────────────

const CSS = `
.creatio-satelite-floating[data-edge-docked] { display: none !important; }
.csl-edge-wet, .csl-edge-blob { position: fixed; width: ${BLOB_W}px; height: ${BLOB_H}px; pointer-events: none; }
.csl-edge-wet { z-index: 1001; opacity: .9; }
.csl-edge-blob { z-index: 1000; filter: drop-shadow(0 3px 8px rgba(0,0,0,.35)); }
.csl-edge-wet[hidden], .csl-edge-blob[hidden] { display: none; }
.csl-edge-wet-grow { position: absolute; inset: 0; transform-origin: 0 50%; transform: scale(var(--csl-wx, 0), var(--csl-wy, 0)); }
.csl-edge-scale { position: absolute; left: 0; top: ${GOO_TOP}px; width: 80px; height: 160px; transform: scale(${BLOB_SCALE}); transform-origin: 0 0; }
.csl-edge-goo { position: absolute; inset: -20px; filter: url(#${FILTER_ID}); }
.csl-edge-goo > div { position: absolute; background: linear-gradient(135deg, #3a3a3a, #111 60%, #000); }
.csl-edge-wet .csl-edge-goo > div { background: radial-gradient(circle at 35% 40%, #2b2b2b, #050505 70%); }
/* At rest the blob is a crisp bell (csl-edge-bell, blob px): a low dome in the middle and a thin skirt along
   the edge that runs out to nothing at both ends, like a drop of liquid on a surface. The goo filter cannot
   draw such tails (its threshold eats thin parts), so the goo shapes stay inside the bell until the blob is
   pulled and only then make the neck and the core that follows the mouse.
   Goo frame: the screen edge is x = 20, the middle of the blob y = 100. */
.csl-edge-bell { position: absolute; left: 0; top: 0; width: ${BLOB_W}px; height: ${BLOB_H}px; overflow: visible; transform-origin: 0 50%; }
.csl-edge-base { left: 0; top: 70px; width: 30px; height: 60px; border-radius: 0 50% 50% 0 / 0 50% 50% 0; transform-origin: 20px 30px; }
.csl-edge-wet .csl-edge-base { top: 50px; width: 40px; height: 100px; }
.csl-edge-core { left: 0; top: 85px; width: 40px; height: 30px; border-radius: 50%; }
.csl-edge-drop { width: 16px; height: 16px; border-radius: 50%; }
.csl-edge-d1 { left: 6px; top: 56px; }
.csl-edge-d2 { left: 6px; top: 128px; }
.csl-edge-shine { position: absolute; left: 4px; top: ${BLOB_H / 2 - 8}px; width: 4px; height: 16px; border-radius: 50%; background: rgba(255,255,255,.35); filter: blur(1px); }
/* Only the mound reacts to the mouse, not the empty corners of the 36x54 box */
.csl-edge-hit { position: absolute; left: 0; top: ${BLOB_H / 2 - 16}px; width: 14px; height: 32px; border-radius: 0 50% 50% 0; pointer-events: auto; cursor: pointer; }
/* Orange button in the middle of the dome */
.csl-edge-dot { position: absolute; left: 3px; top: ${BLOB_H / 2 - 2.5}px; width: 5px; height: 5px; border-radius: 50%; background: #ff5722; box-shadow: 0 0 0 1px rgba(255,87,34,.25); pointer-events: none; transition: box-shadow .15s ease; }
.csl-edge-hit:hover + .csl-edge-dot { box-shadow: 0 0 0 2px rgba(255,87,34,.35); }
/* While the mouse rests on the blob the ring grows until the buttons come out */
.csl-edge-charging .csl-edge-dot { box-shadow: 0 0 0 4px rgba(255,87,34,.45); transition: box-shadow ${PEEK_HOVER_MS}ms linear; }
/* The orange dot on its way between the blob and the icon of the first button */
.csl-edge-flydot { position: fixed; z-index: 10000; border-radius: 50%; background: #ff5722; pointer-events: none; }
`;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);
}

function div(className, parent) {
  const el = document.createElement('div');
  el.className = className;
  parent?.appendChild(el);
  return el;
}

// How far (px) the resting blob stands out from the edge at `d` px from its middle:
// a narrow dome on a long thin skirt, both gaussian, so the outline runs out along the edge without a corner
export function bellHeight(d) {
  return 9 * Math.exp(-(d * d) / (2 * 8 * 8)) + 2.5 * Math.exp(-(d * d) / (2 * 22 * 22));
}

function bellPath() {
  const pts = [];
  for (let y = 0; y <= BLOB_H; y += 2) pts.push(`${bellHeight(y - BLOB_H / 2).toFixed(2)},${y}`);
  return `M-4,0 L${pts.join(' L')} L-4,${BLOB_H} Z`;
}

function bell(parent) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'csl-edge-bell');
  svg.setAttribute('viewBox', `0 0 ${BLOB_W} ${BLOB_H}`);
  svg.innerHTML = `<defs><linearGradient id="csl-edge-bell-fill" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#3a3a3a"/><stop offset=".6" stop-color="#111"/><stop offset="1" stop-color="#000"/>
    </linearGradient></defs><path d="${bellPath()}" fill="url(#csl-edge-bell-fill)"/>`;
  parent.appendChild(svg);
  return svg;
}

function gooShapes(parent, withCore) {
  const bellEl = withCore ? bell(parent) : null;
  const scale = div('csl-edge-scale', parent);
  const goo = div('csl-edge-goo', scale);
  const parts = { base: div('csl-edge-base', goo) };
  if (bellEl) parts.bell = bellEl;
  if (withCore) parts.core = div('csl-edge-core', goo);
  parts.d1 = div('csl-edge-drop csl-edge-d1', goo);
  parts.d2 = div('csl-edge-drop csl-edge-d2', goo);
  return parts;
}

function gooFilter() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.innerHTML = `<defs><filter id="${FILTER_ID}">
    <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur"/>
    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="goo"/>
    <feComposite in="SourceGraphic" in2="goo" operator="atop"/></filter></defs>`;
  return svg;
}

// Element.animate is missing in jsdom; without it the end state is applied at once
function animate(el, keyframes, options, done) {
  if (typeof el.animate !== 'function') {
    done?.();
    return null;
  }
  const a = el.animate(keyframes, options);
  if (done) a.onfinish = done;
  return a;
}

function cancelAnimations(el) {
  if (typeof el.getAnimations === 'function') el.getAnimations().forEach(a => a.cancel());
}

// ─── Controller ──────────────────────────────────────────────────────────────

/**
 * Turns the floating buttons into a small black blob stuck to a screen edge.
 * The drag code reports how far the buttons are pushed past an edge (press / release);
 * the controller shows the wet spot, makes the blob and handles the blob itself.
 *
 * The buttons stay docked until the blob is pulled off the edge. A click on the blob, or
 * resting the mouse on it for PEEK_HOVER_MS, only brings the buttons out for a while ("peek");
 * they go back into the blob PEEK_IDLE_MS after the mouse left them and their menus.
 *
 * Options:
 *  container                 - the floating buttons, squashed back into the blob when a peek ends
 *  tearDistance()            - how far (px) the blob has to be pulled away from the edge to tear off
 *  iconDot()                 - the orange dot on the icon of the first button; the blob's dot flies into it
 * Callbacks:
 *  onBlob()                  - buttons became a blob: stop the drag, hide the buttons
 *  onPeek(edge, along)       - show the buttons next to the edge, the blob is hidden meanwhile
 *  onPeekEnd()               - the buttons go back into the blob: close their menus
 *  onTearOff(clientX, clientY) - the blob was pulled off the edge: show the buttons under the cursor and keep dragging
 */
export function createEdgeBlob({
  root, container, pageType, signal,
  tearDistance = () => TEAR_DISTANCE,
  iconDot = () => container?.querySelector('.csl-icon-dot'),
  onBlob, onPeek, onPeekEnd, onTearOff,
}) {
  ensureStyles();

  const svg = gooFilter();
  const wet = div('csl-edge-wet');
  wet.hidden = true;
  const wetGrow = div('csl-edge-wet-grow', wet);
  gooShapes(wetGrow, false);
  div('csl-edge-shine', wetGrow);

  const blob = div('csl-edge-blob');
  blob.hidden = true;
  const parts = gooShapes(blob, true);
  const hit = div('csl-edge-hit', blob);
  const dot = div('csl-edge-dot', blob);
  hit.title = 'Clio satellite';

  root.append(svg, wet, blob);

  let edge = null;
  let along = 0;
  let pull = null;            // the blob is held with the mouse
  let edgeHoldTimer = null;
  let lastPress = null;
  let splatTimer = null;
  let peeking = false;        // docked, but the buttons are out for a while
  let hoverTimer = null;
  let idleTimer = null;
  let pointerOnButtons = false;
  let blobGen = 0;            // bumped whenever the blob is shown or hidden: stale animation ends are ignored
  let flight = null;          // the orange dot flying between the blob and the icon
  let iconDotFrom = null;     // where the icon dot was when the buttons started squashing into the blob

  const vw = () => window.innerWidth;
  const vh = () => window.innerHeight;

  function placeOnEdge(el, ed, a) {
    const half = BLOB_W / 2;
    let cx, cy;
    if (ed === 'left') { cx = half; cy = a; }
    if (ed === 'right') { cx = vw() - half; cy = a; }
    if (ed === 'top') { cx = a; cy = half; }
    if (ed === 'bottom') { cx = a; cy = vh() - half; }
    el.style.left = (cx - BLOB_W / 2) + 'px';
    el.style.top = (cy - BLOB_H / 2) + 'px';
    el.style.transform = `rotate(${ROT[ed]}deg)`;
  }

  function placeBlob() {
    placeOnEdge(blob, edge, along);
    dot.style.transform = `rotate(${-ROT[edge]}deg)`;
  }

  function resetParts() {
    for (const el of Object.values(parts)) el.style.transform = '';
    dot.style.translate = '';
  }

  // ── the orange dot flies between the blob and the icon of the first button ──
  const centre = r => (r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2, d: r.width } : null);

  function stopFlight() {
    if (!flight) return;
    cancelAnimationFrame(flight.frame);
    flight.el.remove();
    for (const el of flight.hide) el.style.visibility = '';
    flight = null;
  }

  // `from` is a box, `to()` returns the target element: it is measured on every frame,
  // so the dot follows the buttons while they pop in or are dragged
  function flyDot(from, to) {
    stopFlight();
    const a = centre(from);
    const target = to();
    if (!a || !target || typeof requestAnimationFrame !== 'function') return;
    const el = div('csl-edge-flydot', root);
    const hide = [dot, target];
    for (const h of hide) h.style.visibility = 'hidden';
    flight = { el, hide, frame: 0 };
    let start = null;
    const step = (now) => {
      start ??= now;
      const t = Math.min(1, (now - start) / DOT_FLIGHT_MS);
      const b = centre(to()?.getBoundingClientRect()) || a;
      const e = 1 - Math.pow(1 - t, 3);   // ease-out
      // a small hop sideways makes the path an arc instead of a straight line
      const hop = Math.sin(Math.PI * t) * Math.min(40, Math.hypot(b.x - a.x, b.y - a.y) * 0.15);
      const d = a.d + (b.d - a.d) * e;
      el.style.width = el.style.height = d + 'px';
      el.style.left = (a.x + (b.x - a.x) * e - d / 2) + 'px';
      el.style.top = (a.y + (b.y - a.y) * e - d / 2 - hop) + 'px';
      if (t < 1) flight.frame = requestAnimationFrame(step);
      else stopFlight();
    };
    flight.frame = requestAnimationFrame(step);
  }

  // ── wet spot ──
  function showWet(ed, press, raw) {
    cancelAnimations(wet);
    placeOnEdge(wet, ed, alongForRect(ed, raw, vw(), vh()));
    wet.hidden = false;
    // spreads along the edge first, then grows away from it
    wet.style.setProperty('--csl-wy', Math.min(1, press * 1.6).toFixed(3));
    wet.style.setProperty('--csl-wx', Math.min(1, 0.25 + press * 0.9).toFixed(3));
  }

  function dryWet() {
    if (wet.hidden) return;
    animate(wet, [{ opacity: 0.9 }, { opacity: 0 }], { duration: 220, easing: 'ease-out' }, () => { wet.hidden = true; });
  }

  function clearEdgeHold() {
    clearTimeout(edgeHoldTimer);
    edgeHoldTimer = null;
  }

  // ── buttons -> blob ──
  function becomeBlob(container, ed, raw, clientX, clientY) {
    clearEdgeHold();
    lastPress = null;
    edge = ed;
    along = alongForRect(ed, raw, vw(), vh());
    onBlob();
    squashInto(container, ed);
    saveBlobState(pageType, edge, along);
    // the mouse is still down: the user keeps holding the blob
    pull = { sx: clientX, sy: clientY, startAlong: along, moved: true };
    debugLog(`Buttons became a blob on the ${edge} edge`);
  }

  // the buttons squash into the edge, the blob splats out of the wet spot
  function squashInto(el, ed) {
    stopFlight();
    const icon = iconDot();
    iconDotFrom = icon?.getBoundingClientRect() ?? null;
    if (iconDotFrom?.width) icon.style.visibility = 'hidden';
    el.style.transformOrigin = ORIGIN[ed];
    const end = isVertical(ed) ? 'scale(.05,.4)' : 'scale(.4,.05)';
    const mid = isVertical(ed) ? 'scale(.55,1.15)' : 'scale(1.15,.55)';
    const gen = ++blobGen;
    const squash = animate(el, [
      { transform: 'none', opacity: 1, borderRadius: '8px' },
      { transform: mid, opacity: 1, borderRadius: '40px', offset: 0.35 },
      { transform: end, opacity: 0, borderRadius: '50%' },
    ], { duration: 200, easing: 'cubic-bezier(.5,0,.75,0)' }, () => {
      // the blob may have been torn off or peeked at while the buttons were squashing
      if (gen === blobGen && edge === ed && !peeking) el.setAttribute('data-edge-docked', edge);
    });
    if (!squash) el.setAttribute('data-edge-docked', edge);
    clearTimeout(splatTimer);
    splatTimer = setTimeout(splat, squash ? 90 : 0);
  }

  function splat() {
    placeBlob();
    blob.hidden = false;
    cancelAnimations(wet);
    wet.hidden = true;
    const ease = 'cubic-bezier(.2,1.6,.4,1)';
    for (const el of [parts.base, parts.bell]) {
      animate(el, [{ transform: 'scaleY(.1) scaleX(.3)' }, { transform: 'scaleY(1.15) scaleX(1.1)', offset: 0.45 }, { transform: 'scaleY(1)' }], { duration: 520, easing: 'ease-out' });
    }
    animate(parts.core, [{ transform: 'translateX(-30px) scale(.2)' }, { transform: 'translateX(6px) scale(1.25, .85)', offset: 0.5 }, { transform: 'translateX(0) scale(1)' }], { duration: 560, easing: ease });
    animate(parts.d1, [{ transform: 'translate(-10px, 20px) scale(.2)' }, { transform: 'translate(20px,-26px) scale(1.2)', offset: 0.4 }, { transform: 'translate(0,0) scale(1)' }], { duration: 700, easing: 'ease-out' });
    animate(parts.d2, [{ transform: 'translate(-10px,-20px) scale(.2)' }, { transform: 'translate(24px,30px) scale(1.1)', offset: 0.4 }, { transform: 'translate(0,0) scale(1)' }], { duration: 760, easing: 'ease-out' });
    const from = iconDotFrom;
    iconDotFrom = null;
    const icon = iconDot();
    if (icon) icon.style.visibility = '';
    if (from?.width && icon) flyDot(from, () => dot);
    else animate(dot, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 260, fill: 'backwards' });
  }

  // ── blob -> buttons ──
  function hideBlob(keyframes) {
    clearTimeout(splatTimer);
    // the splat that would fly the icon dot back into the blob will not run: show the icon dot again
    iconDotFrom = null;
    const icon = iconDot();
    if (icon) icon.style.visibility = '';
    clearHover();
    const gen = ++blobGen;
    const full = blob.style.transform;
    const done = () => {
      if (gen !== blobGen) return;   // the blob was shown again meanwhile
      blob.hidden = true;
      resetParts();
    };
    if (!animate(blob, keyframes(full), { duration: 260, easing: 'ease-in' }, done)) done();
  }

  function clearHover() {
    clearTimeout(hoverTimer);
    hoverTimer = null;
    blob.classList.remove('csl-edge-charging');
  }

  // The buttons come out next to the edge for a while; the blob stays docked
  function peek() {
    clearHover();
    if (!edge || peeking) return;
    peeking = true;
    pointerOnButtons = false;
    const from = dot.getBoundingClientRect();
    // the blob swells for a moment and is absorbed by the edge
    hideBlob(full => [
      { transform: full, opacity: 1 },
      { transform: `${full} scale(1.25)`, opacity: 1, offset: 0.3 },
      { transform: `${full} translateX(-20px) scale(.2)`, opacity: 0 },
    ]);
    onPeek(edge, along);
    flyDot(from, iconDot);
    armIdle();
    debugLog('Buttons came out of the blob');
  }

  // Counts the idle time down only while the mouse is off the buttons and their menus
  function armIdle() {
    clearTimeout(idleTimer);
    idleTimer = peeking && !pointerOnButtons ? setTimeout(endPeek, PEEK_IDLE_MS) : null;
  }

  function endPeek() {
    clearTimeout(idleTimer);
    idleTimer = null;
    if (!peeking) return;
    peeking = false;
    pointerOnButtons = false;
    onPeekEnd?.();
    squashInto(container, edge);
    debugLog('Buttons went back into the blob');
  }

  function tearOff(clientX, clientY) {
    const from = dot.getBoundingClientRect();
    pull = null;
    edge = null;
    blob.classList.remove('csl-edge-charging');
    clearBlobState(pageType);
    resetParts();
    hideBlob(full => [{ transform: full, opacity: 1 }, { transform: full, opacity: 0 }]);
    onTearOff(clientX, clientY);
    flyDot(from, iconDot);
    debugLog('Blob torn off the edge');
  }

  function springBack() {
    for (const el of [...Object.values(parts), dot]) {
      const from = el === dot ? el.style.translate : el.style.transform;
      if (!from) continue;
      if (el === dot) {
        el.style.translate = '';
        animate(el, [{ translate: from }, { translate: '0 0' }], { duration: 480, easing: 'cubic-bezier(.34,1.8,.5,1)' });
      } else {
        el.style.transform = '';
        animate(el, [{ transform: from }, { transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.34,1.8,.5,1)' });
      }
    }
  }

  // ── holding the blob: slide along the edge, stretch away from it, tear off ──
  hit.addEventListener('mouseenter', () => {
    if (!edge || peeking || pull || hoverTimer) return;
    blob.classList.add('csl-edge-charging');
    hoverTimer = setTimeout(peek, PEEK_HOVER_MS);
  }, { signal });

  hit.addEventListener('mouseleave', clearHover, { signal });

  // Anything of the extension under the mouse except the blob counts as the buttons being used
  document.addEventListener('mouseover', (e) => {
    if (!peeking) return;
    const onButtons = root.contains(e.target) && !blob.contains(e.target) && !wet.contains(e.target);
    if (onButtons === pointerOnButtons) return;
    pointerOnButtons = onButtons;
    armIdle();
  }, { signal });

  // A press anywhere on the page outside the extension sends the buttons back into the blob at once.
  // Capture: Creatio may stop the event before it bubbles to the document.
  document.addEventListener('mousedown', (e) => {
    if (peeking && !root.contains(e.target)) endPeek();
  }, { capture: true, signal });

  hit.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || !edge || peeking) return;
    clearHover();
    pull = { sx: e.clientX, sy: e.clientY, startAlong: along, moved: false };
    e.preventDefault();
    e.stopPropagation();
  }, { signal });

  document.addEventListener('mousemove', (e) => {
    if (!pull || !edge) return;
    const dx = e.clientX - pull.sx, dy = e.clientY - pull.sy;
    if (!pull.moved && Math.hypot(dx, dy) < 4) return;
    pull.moved = true;
    along = clampAlong(edge, pull.startAlong + (isVertical(edge) ? dy : dx), vw(), vh());
    placeBlob();
    const lx = { left: dx, right: -dx, top: dy, bottom: -dy }[edge];   // distance away from the edge
    if (lx <= 0) {
      // pushed into the edge: the blob flattens
      const push = Math.min(30, -lx) / 30;
      parts.core.style.transform = `translateX(${-push * 8}px) scale(${1 - push * 0.25}, ${1 + push * 0.18})`;
      parts.base.style.transform = parts.bell.style.transform = `scaleY(${1 + push * 0.3})`;
      parts.d1.style.transform = parts.d2.style.transform = dot.style.translate = '';
      return;
    }
    const tear = tearDistance();
    const k = Math.min(1, lx / tear);
    const L = lx / BLOB_SCALE;   // cursor distance in the goo frame
    parts.core.style.transform = `translateX(${L}px) scale(${1 - k * 0.2})`;
    // the dot lives inside the rotated blob: local x points away from the edge
    dot.style.translate = `${lx}px 0px`;
    // the drops become the neck between the edge and the core; it thins as it stretches
    // (goo frame: base anchor (20,100), core centre (20,100), drop centres d1 (14,64) and d2 (14,136))
    const neck = (t, x0, y0, grow) =>
      `translate(${20 + L * t - x0}px, ${100 - y0}px) scale(${grow - k * k * (grow - 1.1)})`;
    parts.d1.style.transform = neck(0.36, 14, 64, 2.4);
    parts.d2.style.transform = neck(0.7, 14, 136, 2.2);
    parts.base.style.transform = `scaleY(${1 - k * 0.4}) translateX(${L * 0.08}px)`;
    // the skirt is pulled together towards the neck
    parts.bell.style.transform = `scaleY(${1 - k * 0.3})`;
    if (lx > tear) tearOff(e.clientX, e.clientY);
  }, { signal });

  document.addEventListener('mouseup', () => {
    if (!pull) return;
    const p = pull;
    pull = null;
    if (!edge) return;
    if (!p.moved) {   // a click brings the buttons out for a while; only a pull undocks them
      peek();
      return;
    }
    springBack();
    saveBlobState(pageType, edge, along);
  }, { signal });

  window.addEventListener('resize', () => {
    if (!edge || peeking) return;
    along = clampAlong(edge, along, vw(), vh());
    placeBlob();
  }, { signal });

  signal?.addEventListener('abort', () => {
    clearEdgeHold();
    clearHover();
    clearTimeout(splatTimer);
    clearTimeout(idleTimer);
    stopFlight();
    svg.remove();
    wet.remove();
    blob.remove();
  });

  return {
    get edge() { return edge; },
    get peeking() { return peeking; },

    // Called on every drag move. `raw` is the box of the visible buttons ({ left, top, width, height })
    // where the drag would put it without clamping it to the viewport.
    press(container, raw, clientX, clientY) {
      if (edge) return false;
      const hitEdge = pressedEdge(raw.left, raw.top, raw.width, raw.height, vw(), vh());
      if (!hitEdge) {
        clearEdgeHold();
        dryWet();
        return false;
      }
      const press = hitEdge.over / PRESS_DISTANCE;
      if (press >= 1) {
        becomeBlob(container, hitEdge.edge, raw, clientX, clientY);
        return true;
      }
      showWet(hitEdge.edge, press, raw);
      lastPress = { container, edge: hitEdge.edge, raw, clientX, clientY };
      // a cursor pinned to the screen edge sends no more moves, so the hold is timed
      if (isCursorAtEdge(hitEdge.edge, clientX, clientY, vw(), vh())) {
        if (!edgeHoldTimer) {
          edgeHoldTimer = setTimeout(() => {
            edgeHoldTimer = null;
            if (lastPress) becomeBlob(lastPress.container, lastPress.edge, lastPress.raw, lastPress.clientX, lastPress.clientY);
          }, EDGE_HOLD_MS);
        }
      } else {
        clearEdgeHold();
      }
      return false;
    },

    // The drag ended before the buttons became a blob
    release() {
      clearEdgeHold();
      lastPress = null;
      dryWet();
    },

    // Shows the blob at once, without animation (restoring the state saved on a previous visit)
    dock(ed, a) {
      blobGen++;
      edge = ed;
      along = clampAlong(ed, a, vw(), vh());
      placeBlob();
      blob.hidden = false;
    },
  };
}

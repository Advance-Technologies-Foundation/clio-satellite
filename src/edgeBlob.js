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
const BLOB_COLOR = '#151515';
const BLOB_COLOR_ON_DARK = '#4a4a4a';
const FILTER_ID = 'csl-edge-blob-goo';

// The viewport without its scrollbars: a blob on the right edge of a page with a scrollbar must not hide under it
export const viewportWidth = () => document.documentElement?.clientWidth || window.innerWidth;
export const viewportHeight = () => document.documentElement?.clientHeight || window.innerHeight;

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

// Space (px) between the buttons and the outline of the pool around them
export const POOL_PAD = 6;

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

// ─── Background under the blob ───────────────────────────────────────────────

const linear = v => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const luminance = (r, g, b) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

let colorCanvas = null;
// Any other CSS colour (oklch(), color(srgb …), lab(), a name …) is painted on a 1×1 canvas and read back
function rgbaByCanvas(css) {
  try {
    colorCanvas ??= document.createElement('canvas').getContext?.('2d', { willReadFrequently: true }) ?? null;
  } catch {
    colorCanvas = null;
  }
  if (!colorCanvas) return null;
  colorCanvas.clearRect(0, 0, 1, 1);
  colorCanvas.fillStyle = '#000';
  colorCanvas.fillStyle = css;
  colorCanvas.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = colorCanvas.getImageData(0, 0, 1, 1).data;
  return { r, g, b, a: a / 255 };
}

// Relative luminance (0..1) of a computed CSS colour, or null for a mostly transparent or unreadable one
export function colorLuminance(css) {
  if (!css || css === 'transparent' || css === 'none') return null;
  const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(css);
  if (m) {
    let a = m[4] === undefined ? 1 : parseFloat(m[4]);
    if (m[4]?.endsWith('%')) a /= 100;
    return a < 0.5 ? null : luminance(+m[1], +m[2], +m[3]);
  }
  const c = rgbaByCanvas(css);
  return !c || c.a < 0.5 ? null : luminance(c.r, c.g, c.b);
}

// Mean luminance of the colours of a CSS gradient (`background-image`), or null when it has none
export function gradientLuminance(image) {
  if (!image || !image.includes('gradient(')) return null;
  const colors = image.match(/(?:rgba?|hsla?|color|oklch|oklab|lab|lch)\([^()]*\)|#[0-9a-f]{3,8}\b/gi) || [];
  const lums = colors.map(colorLuminance).filter(l => l !== null);
  return lums.length ? lums.reduce((a, b) => a + b, 0) / lums.length : null;
}

// The black blob is hard to see below this luminance (about #666), so it turns dark grey there
export const DARK_LUMINANCE = 0.13;
// Creatio draws (and redraws) the page for some seconds after the blob appears, also after a move to another
// page of the app. For this long the blob watches the page and checks the background again once it has been
// still for SHADE_SETTLE_MS. Event-driven, no polling; the watch then stops.
export const SHADE_WATCH_MS = 20000;
export const SHADE_SETTLE_MS = 400;

// Whether the page under (x, y) is dark: the background colour (or gradient) of the topmost page element
// there that has one, skipping the extension's own elements (inside `own`). Images and canvases are not
// looked into.
// Luminance of an <img> at a point of the screen, read from its pixels (null when not loaded, transparent
// there, or from another origin, whose pixels cannot be read)
let imageCanvas = null;
function imageLuminanceAt(img, x, y) {
  if (img.tagName !== 'IMG' || !img.complete || !img.naturalWidth) return null;
  const r = img.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  try {
    imageCanvas ??= document.createElement('canvas').getContext?.('2d', { willReadFrequently: true }) ?? null;
    if (!imageCanvas) return null;
    imageCanvas.canvas.width = imageCanvas.canvas.height = 1;
    const sx = Math.min(img.naturalWidth - 1, Math.max(0, (x - r.left) / r.width * img.naturalWidth));
    const sy = Math.min(img.naturalHeight - 1, Math.max(0, (y - r.top) / r.height * img.naturalHeight));
    imageCanvas.clearRect(0, 0, 1, 1);
    imageCanvas.drawImage(img, sx, sy, 1, 1, 0, 0, 1, 1);
    const [cr, cg, cb, ca] = imageCanvas.getImageData(0, 0, 1, 1).data;
    return ca < 128 ? null : luminance(cr, cg, cb);
  } catch {
    return null;
  }
}

function backgroundLuminance(el, x, y) {
  const cs = getComputedStyle(el);
  return imageLuminanceAt(el, x, y) ?? colorLuminance(cs.backgroundColor) ?? gradientLuminance(cs.backgroundImage);
}

// Page elements at a point found by their boxes, not by hit testing: an element with `pointer-events: none`
// is left out of elementsFromPoint (on a live Creatio page only `body` was hit under its dark header). Topmost last, a few levels deep.
function elementsAtByBox(x, y, own, depth = 4) {
  const found = [];
  const walk = (parent, level) => {
    for (const el of parent.children) {
      if (own?.contains(el) || el === own) continue;
      const r = el.getBoundingClientRect();
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
      found.push(el);
      if (level < depth) walk(el, level + 1);
    }
  };
  if (document.body) walk(document.body, 1);
  return found;
}

const describe = (el, lum) => {
  const cls = String(el.className?.baseVal ?? el.className ?? '').split(' ')[0];
  return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''} ${lum.toFixed(3)}`;
};

export function shadeAt(x, y, own) {
  const stack = typeof document.elementsFromPoint === 'function' ? document.elementsFromPoint(x, y) : [];
  const page = stack.filter(el => !own?.contains(el) && el !== document.body && el !== document.documentElement);
  for (const el of page) {
    const lum = backgroundLuminance(el, x, y);
    if (lum !== null) return { dark: lum < DARK_LUMINANCE, by: describe(el, lum) };
  }
  // nothing with a background was hit: look for one by the boxes, topmost first
  for (const el of elementsAtByBox(x, y, own).reverse()) {
    if (page.includes(el)) continue;
    const lum = backgroundLuminance(el, x, y);
    if (lum !== null) return { dark: lum < DARK_LUMINANCE, by: `${describe(el, lum)} (by box)` };
  }
  for (const el of [document.body, document.documentElement]) {
    if (!el) continue;
    const lum = backgroundLuminance(el, x, y);
    if (lum !== null) return { dark: lum < DARK_LUMINANCE, by: describe(el, lum) };
  }
  return { dark: false, by: 'none' };
}

export function isDarkAt(x, y, own) {
  return shadeAt(x, y, own).dark;
}

// ─── DOM ─────────────────────────────────────────────────────────────────────

const CSS = `
.creatio-satelite-floating[data-edge-docked] { display: none !important; }
.csl-edge-wet, .csl-edge-blob { position: fixed; width: ${BLOB_W}px; height: ${BLOB_H}px; pointer-events: none; }
.csl-edge-wet { z-index: 9998; opacity: .9; }
.csl-edge-blob { z-index: 9998; filter: drop-shadow(0 3px 8px rgba(0,0,0,.35)); }
.csl-edge-wet[hidden], .csl-edge-blob[hidden] { display: none; }
.csl-edge-wet-grow { position: absolute; inset: 0; transform-origin: 0 50%; transform: scale(var(--csl-wx, 0), var(--csl-wy, 0)); }
.csl-edge-scale { position: absolute; left: 0; top: ${GOO_TOP}px; width: 80px; height: 160px; transform: scale(${BLOB_SCALE}); transform-origin: 0 0; }
.csl-edge-goo { position: absolute; inset: -20px; filter: url(#${FILTER_ID}); }
.csl-edge-goo > div { position: absolute; background: ${BLOB_COLOR}; transition: background-color .4s ease; }
.csl-edge-bell path, .csl-edge-pool path { fill: ${BLOB_COLOR}; transition: fill .4s ease; }
/* On a dark page the black blob turns dark grey so it can still be seen; it stays one colour */
.csl-edge-on-dark .csl-edge-goo > div { background: ${BLOB_COLOR_ON_DARK}; }
.csl-edge-on-dark .csl-edge-bell path, .csl-edge-pool.csl-edge-on-dark path { fill: ${BLOB_COLOR_ON_DARK}; }
/* Layers: pool 9996 < buttons 9997 < blob 9998 < menus 9999 < flying dot 10000, high enough for Creatio's
   own fixed panels along the edges not to cover the blob.
   The pool the buttons sit in while they are out of the blob is one viewport-sized SVG; only the shape
   itself takes the mouse */
.csl-edge-pool { position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; z-index: 9996; pointer-events: none; overflow: visible; filter: drop-shadow(0 3px 8px rgba(0,0,0,.35)); }
.csl-edge-pool path { pointer-events: auto; }
.csl-edge-pool[hidden] { display: none; }
/* At rest the blob is a crisp bell (csl-edge-bell, blob px): a low dome in the middle and a thin skirt along
   the edge that runs out to nothing at both ends, like a drop of liquid on a surface. The goo filter cannot
   draw such tails (its threshold eats thin parts), so the goo shapes stay inside the bell until the blob is
   pulled and only then make the neck and the core that follows the mouse.
   Goo frame: the screen edge is x = 20, the middle of the blob y = 100. */
.csl-edge-bell { position: absolute; left: 0; top: 0; width: ${BLOB_W}px; height: ${BLOB_H}px; overflow: visible; transform-origin: 0 50%; }
.csl-edge-base { left: 0; top: 70px; width: 30px; height: 60px; border-radius: 0 50% 50% 0 / 0 50% 50% 0; transform-origin: 20px 30px; }
.csl-edge-wet .csl-edge-base { top: 50px; width: 40px; height: 100px; }
.csl-edge-core { left: -15px; top: 85px; width: 70px; height: 30px; border-radius: 50%; }
.csl-edge-drop { width: 16px; height: 16px; border-radius: 50%; }
.csl-edge-d1 { left: 6px; top: 56px; }
.csl-edge-d2 { left: 6px; top: 128px; }
/* Only the mound reacts to the mouse, not the empty corners of the 36x54 box */
.csl-edge-hit { position: absolute; left: 0; top: ${BLOB_H / 2 - 18}px; width: 24px; height: 36px; border-radius: 0 50% 50% 0; pointer-events: auto; cursor: pointer; }
/* Orange button in the middle of the dome */
.csl-edge-dot { position: absolute; left: 8.5px; top: ${BLOB_H / 2 - 2.5}px; width: 5px; height: 5px; border-radius: 50%; background: #ff5722; box-shadow: 0 0 0 1px rgba(255,87,34,.25); pointer-events: none; transition: box-shadow .15s ease; }
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

// How far (px) the resting blob stands out from the edge at `d` px from its middle.
// A round dome (circle of radius DOME_R whose centre is DOME_C px from the edge) on a long thin gaussian
// skirt, merged with a smooth union of their distance fields: the dome stays round on top and flows into
// the skirt through concave fillets, and the skirt runs out along the edge without a corner.
const DOME_R = 13, DOME_C = 7, DOME_FILLET = 12;
const skirt = d => 3 * Math.exp(-(d * d) / (2 * 22 * 22));
function bellField(x, d) {
  const a = Math.hypot(x - DOME_C, d) - DOME_R;
  const b = x - skirt(d);
  const h = Math.max(DOME_FILLET - Math.abs(a - b), 0) / DOME_FILLET;
  return Math.min(a, b) - h * h * DOME_FILLET / 4;
}
export function bellHeight(d) {
  if (bellField(0, d) > 0) return 0;
  let lo = 0, hi = 40;   // the field grows away from the edge: find where it crosses zero
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2;
    if (bellField(m, d) <= 0) lo = m; else hi = m;
  }
  return lo;
}

// How far (px) the pool stands out from the edge at `d` px from its middle (left-edge frame).
// The same build as the bell: a box `depth` px deep and 2*half px long along the edge, rounded by POOL_R
// on the far side, merged with a thin skirt by a smooth union, so it flows into the edge like the resting
// blob. With half = 0 and depth = 20 it is the dome of the bell, so the pool can grow out of the blob.
export const POOL_R = 13;
const POOL_FILLET = 12;
function poolField(x, d, half, depth) {
  const hx = (depth + POOL_R) / 2, cx = (depth - POOL_R) / 2;
  const qx = Math.abs(x - cx) - Math.max(hx - POOL_R, 0);
  const qy = Math.abs(d) - Math.max(half - POOL_R, 0);
  const a = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - POOL_R;
  const out = Math.max(0, Math.abs(d) - half);
  const b = x - 3 * Math.exp(-(out * out) / (2 * 22 * 22));
  const h = Math.max(POOL_FILLET - Math.abs(a - b), 0) / POOL_FILLET;
  return Math.min(a, b) - h * h * POOL_FILLET / 4;
}
export function poolHeight(d, half, depth) {
  if (poolField(0, d, half, depth) > 0) return 0;
  let lo = 0, hi = depth + 20;
  for (let i = 0; i < 24; i++) {
    const m = (lo + hi) / 2;
    if (poolField(m, d, half, depth) <= 0) lo = m; else hi = m;
  }
  return lo;
}

// The dome of the resting blob as a pool shape
export const DOME_SHAPE = { half: 0, depth: 20 };

// Pool shape around the box of the buttons: centre along the edge, half length and depth
export function poolShapeFor(edge, box, vw, vh, pad = POOL_PAD) {
  if (isVertical(edge)) {
    const depth = edge === 'left' ? box.left + box.width + pad : vw - box.left + pad;
    return { c: box.top + box.height / 2, half: box.height / 2 + pad, depth };
  }
  const depth = edge === 'top' ? box.top + box.height + pad : vh - box.top + pad;
  return { c: box.left + box.width / 2, half: box.width / 2 + pad, depth };
}

// SVG path of a pool shape on the screen
export function poolPath(edge, shape, vw, vh) {
  const reach = shape.half + 90;
  const pts = [];
  for (let d = -reach; d <= reach; d += 2) {
    const h = poolHeight(d, shape.half, shape.depth);
    const a = shape.c + d;
    const p = { left: [h, a], right: [vw - h, a], top: [a, h], bottom: [a, vh - h] }[edge];
    pts.push(`${p[0].toFixed(1)},${p[1].toFixed(1)}`);
  }
  const s = shape.c - reach, e = shape.c + reach;
  const ends = { left: [[-4, e], [-4, s]], right: [[vw + 4, e], [vw + 4, s]], top: [[e, -4], [s, -4]], bottom: [[e, vh + 4], [s, vh + 4]] }[edge];
  return `M${pts.join(' L')} L${ends[0].join(',')} L${ends[1].join(',')} Z`;
}

function bellPath() {
  const pts = [];
  for (let y = 0; y <= BLOB_H; y += 1) pts.push(`${bellHeight(y - BLOB_H / 2).toFixed(2)},${y}`);
  return `M-4,0 L${pts.join(' L')} L-4,${BLOB_H} Z`;
}

function bell(parent) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'csl-edge-bell');
  svg.setAttribute('viewBox', `0 0 ${BLOB_W} ${BLOB_H}`);
  svg.innerHTML = `<path d="${bellPath()}"/>`;
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
 *  buttons()                 - the element that holds the buttons (clipped while they go back into the blob)
 * Callbacks:
 *  onBlob()                  - buttons became a blob: stop the drag, hide the buttons
 *  onPeek(edge, along)       - show the buttons next to the edge, the blob is hidden meanwhile; returns the box
 *                              of the buttons ({ left, top, width, height }), around which the dark pool is drawn
 *  onPeekEnd()               - the buttons go back into the blob: close their menus
 *  onTearOff(clientX, clientY) - the blob was pulled off the edge: show the buttons under the cursor and keep dragging
 *  onUndock()                - the buttons out of the blob were dragged out of their pool: they stay free, the drag goes on
 *  onSnapBack(box)           - the buttons were dragged less than a button height and let go: put them back at `box`
 */
export function createEdgeBlob({
  root, container, pageType, signal,
  tearDistance = () => TEAR_DISTANCE,
  iconDot = () => container?.querySelector('.csl-icon-dot'),
  buttons = () => container?.firstElementChild || container,
  onBlob, onPeek, onPeekEnd, onTearOff, onUndock, onSnapBack,
}) {
  ensureStyles();

  const svg = gooFilter();
  const wet = div('csl-edge-wet');
  wet.hidden = true;
  const wetGrow = div('csl-edge-wet-grow', wet);
  gooShapes(wetGrow, false);

  const blob = div('csl-edge-blob');
  blob.hidden = true;
  const parts = gooShapes(blob, true);
  const hit = div('csl-edge-hit', blob);
  const dot = div('csl-edge-dot', blob);
  hit.title = 'Clio satellite';

  // while the buttons are out of the blob they sit in this pool grown out of it, so it is clear they go back into it
  const pool = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  pool.setAttribute('class', 'csl-edge-pool');
  pool.innerHTML = '<path/>';
  // an SVG element has no `hidden` property: the attribute is used
  pool.setAttribute('hidden', '');
  const poolShapeEl = pool.firstChild;

  root.append(svg, wet, pool, blob);

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
  let peekBox = null;         // where the buttons stand while they are out of the blob
  let dragBox = null;         // where they are being dragged to, while still in the pool
  let poolGen = 0;            // bumped whenever the pool starts changing: stale animation frames are ignored
  let poolShape = null;       // { c, half, depth } of the pool now on screen
  let poolEdge = null;        // the edge the pool stands on (kept while it snaps back after the blob is gone)

  const vw = viewportWidth;
  const vh = viewportHeight;

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

  // checked when the blob is shown or moved; the middle of the blob is sampled
  function placeBlob() {
    placeOnEdge(blob, edge, along);
    dot.style.transform = `rotate(${-ROT[edge]}deg)`;
    updateShade();
  }

  function updateShade() {
    if (!edge) return;
    const x = { left: BLOB_W / 2, right: vw() - BLOB_W / 2 }[edge] ?? along;
    const y = { top: BLOB_W / 2, bottom: vh() - BLOB_W / 2 }[edge] ?? along;
    const shade = shadeAt(x, y, root);
    blob.classList.toggle('csl-edge-on-dark', shade.dark);
    // which page element decided the colour, for checking it on a live page
    blob.dataset.shade = `${shade.dark ? 'dark' : 'light'}: ${shade.by}`;
  }

  // Watches the page for a while and checks the background again each time it has been still for a moment
  let shadeWatch = null;
  function watchShade(ms = SHADE_WATCH_MS) {
    if (typeof MutationObserver !== 'function' || !document.body) return;
    stopShadeWatch();
    let settle = null;
    const observer = new MutationObserver((records) => {
      if (records.every(r => root.contains(r.target))) return;   // the extension's own changes
      clearTimeout(settle);
      settle = setTimeout(updateShade, SHADE_SETTLE_MS);
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    const end = setTimeout(() => { stopShadeWatch(); updateShade(); }, ms);
    shadeWatch = { observer, stop: () => { clearTimeout(settle); clearTimeout(end); observer.disconnect(); } };
  }
  function stopShadeWatch() {
    shadeWatch?.stop();
    shadeWatch = null;
  }
  // another page of Creatio (it is a single-page app): watch the background again for a shorter while
  window.addEventListener('hashchange', () => { if (edge) watchShade(SHADE_WATCH_MS / 2); }, { signal });
  signal?.addEventListener('abort', stopShadeWatch);

  function resetParts() {
    for (const el of Object.values(parts)) el.style.transform = '';
    dot.style.translate = '';
  }

  // ── the orange dot flies between the blob and the icon of the first button ──
  const centre = r => (r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2, d: r.width } : null);

  // where the orange dot of the blob is (or will be), measured without the blob being shown
  function domeDot() {
    const k = 11;   // centre of the dot from the edge
    const p = { left: [k, along], right: [vw() - k, along], top: [along, k], bottom: [along, vh() - k] }[edge];
    const rect = { left: p[0] - 2.5, top: p[1] - 2.5, width: 5, height: 5 };
    return { style: {}, getBoundingClientRect: () => rect };
  }

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
    const hide = [dot, target].filter(h => h instanceof Element);
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
    const squashed = squashButtons(el, ed);
    clearTimeout(splatTimer);
    splatTimer = setTimeout(splat, squashed ? 90 : 0);
  }

  // the buttons squash into the edge and hide; returns whether they are animated
  function squashButtons(el, ed) {
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
    return !!squash;
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
  function hideBlob(keyframes, duration = 260) {
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
    if (!animate(blob, keyframes(full), { duration, easing: 'ease-in' }, done)) done();
  }

  function clearHover() {
    clearTimeout(hoverTimer);
    hoverTimer = null;
    blob.classList.remove('csl-edge-charging');
  }

  // ── the pool ──
  function drawPool(shape) {
    poolShape = shape;
    poolShapeEl.setAttribute('d', poolPath(poolEdge, shape, vw(), vh()));
    if (clipped) clipToPool(shape);
  }

  const mix = (a, b, t) => a + (b - a) * t;
  const easeOutBack = t => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
  const easeIn = t => t * t;

  // Morphs the pool from one shape into another frame by frame (the path is rebuilt on each frame)
  function morphPool(from, to, duration, ease, done) {
    const gen = ++poolGen;
    if (typeof requestAnimationFrame !== 'function') {
      drawPool(to);
      done?.();
      return;
    }
    let start = null;
    const step = (now) => {
      if (gen !== poolGen) return;
      start ??= now;
      const t = Math.min(1, (now - start) / duration);
      const k = ease(t);
      drawPool({ c: mix(from.c, to.c, k), half: Math.max(0, mix(from.half, to.half, k)), depth: Math.max(0, mix(from.depth, to.depth, k)) });
      if (t < 1) requestAnimationFrame(step);
      else done?.();
    };
    requestAnimationFrame(step);
  }

  const domeShape = () => ({ c: along, ...DOME_SHAPE });

  // the pool grows out of the dome of the blob to the buttons
  function showPool(box) {
    pool.classList.toggle('csl-edge-on-dark', blob.classList.contains('csl-edge-on-dark'));
    poolEdge = edge;
    const from = domeShape();
    drawPool(from);
    pool.removeAttribute('hidden');
    morphPool(from, poolShapeFor(edge, box, vw(), vh()), 380, easeOutBack, () => {
      const reveal = clipped?.reveal;
      stopClip();
      reveal?.onfinish?.();
    });
  }

  function hidePool() {
    ++poolGen;
    stopClip();
    pool.setAttribute('hidden', '');
    poolShape = null;
  }

  // The buttons come out next to the edge for a while, in a pool grown out of the blob; the blob stays docked
  function peek() {
    clearHover();
    if (!edge || peeking) return;
    peeking = true;
    pointerOnButtons = false;
    const from = dot.getBoundingClientRect();
    // the pool starts as the dome of the blob, so the blob is swapped for it at once
    hideBlob(full => [{ transform: full }, { transform: full }], 1);
    peekBox = onPeek(edge, along) || container?.getBoundingClientRect() || null;
    if (peekBox) showPool(peekBox);
    flyDot(from, iconDot);
    armIdle();
    debugLog('Buttons came out of the blob');
  }

  // The buttons out of the blob are dragged to `box`: the pool stretches after them; dragged further from the
  // edge than a button is high, the pool tears and the buttons are free for good
  function dragButtons(box) {
    if (!peeking || !peekBox) return false;
    clearTimeout(idleTimer);
    idleTimer = null;
    const away = { left: box.left - peekBox.left, right: peekBox.left - box.left, top: box.top - peekBox.top, bottom: peekBox.top - box.top }[edge];
    if (away <= tearDistance()) {
      ++poolGen;   // the growing animation must not pull the pool back
      if (clipped) {
        const reveal = clipped.reveal;
        stopClip();
        reveal?.onfinish?.();
      }
      dragBox = box;
      drawPool(poolShapeFor(edge, box, vw(), vh()));
      return false;
    }
    undock();
    return true;
  }

  function undock() {
    dragBox = null;
    peeking = false;
    pointerOnButtons = false;
    edge = null;
    peekBox = null;
    clearTimeout(idleTimer);
    idleTimer = null;
    clearBlobState(pageType);
    // the torn pool runs back into the edge
    if (poolShape) morphPool(poolShape, { c: poolShape.c, half: 0, depth: 0 }, 220, easeIn, hidePool);
    else hidePool();
    onUndock?.();
    debugLog('Buttons dragged out of the blob');
  }

  // The drag ended before the pool tore: the buttons and the pool go back
  // Moved along the edge, they stay there and the blob moves with them; moved away from it, they go back.
  function releaseButtons() {
    if (!peeking || !peekBox) return;
    const box = { ...peekBox };
    if (dragBox) {
      if (isVertical(edge)) box.top = clamp(dragBox.top, 8, vh() - box.height - 8);
      else box.left = clamp(dragBox.left, 8, vw() - box.width - 8);
    }
    dragBox = null;
    if (box.top !== peekBox.top || box.left !== peekBox.left) {
      peekBox = box;
      along = clampAlong(edge, isVertical(edge) ? box.top + box.height / 2 : box.left + box.width / 2, vw(), vh());
      saveBlobState(pageType, edge, along);
    }
    if (poolShape) morphPool(poolShape, poolShapeFor(edge, peekBox, vw(), vh()), 420, easeOutBack);
    onSnapBack?.(peekBox);
    armIdle();
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
    peekBox = null;
    const ed = edge;
    // the dot flies from the icon into the dome while the pool carries the buttons back into the blob
    stopFlight();
    iconDotFrom = null;
    const icon = iconDot();
    const from = icon?.getBoundingClientRect();
    if (from?.width && typeof requestAnimationFrame === 'function') flyDot(from, domeDot);
    const gen = ++blobGen;
    const covered = poolShape && !pool.hasAttribute('hidden') && startClip();
    if (!covered) container.setAttribute('data-edge-docked', ed);
    const back = () => {
      hidePool();
      if (gen !== blobGen || edge !== ed || peeking) return;
      container.setAttribute('data-edge-docked', ed);
      // the pool is the dome again: the blob takes its place
      placeBlob();
      resetParts();
      blob.hidden = false;
    };
    if (poolShape && !pool.hasAttribute('hidden')) morphPool(poolShape, domeShape(), 300, easeIn, back);
    else back();
    debugLog('Buttons went back into the blob');
  }

  // While the pool grows or shrinks the buttons are clipped to it, so they come out of the blob and go back
  // into it together with the pool, from the side of the edge
  let clipped = null;         // { el, reveal } while the buttons follow the pool
  function clipToPool(shape) {
    const el = clipped?.el;
    const r = el?.getBoundingClientRect();
    if (!r?.width) return;
    const lo = shape.c - shape.half + POOL_PAD, hi = shape.c + shape.half - POOL_PAD, reach = shape.depth - POOL_PAD;
    // the part of the buttons inside the pool: along the edge between its ends, away from it up to its depth
    let top = 0, right = 0, bottom = 0, left = 0;
    if (isVertical(poolEdge)) {
      top = lo - r.top;
      bottom = r.bottom - hi;
      if (poolEdge === 'left') right = r.right - reach;
      else left = (vw() - reach) - r.left;
    } else {
      left = lo - r.left;
      right = r.right - hi;
      if (poolEdge === 'top') bottom = r.bottom - reach;
      else top = (vh() - reach) - r.top;
    }
    const px = v => `${Math.max(0, v).toFixed(1)}px`;
    el.style.clipPath = `inset(${px(top)} ${px(right)} ${px(bottom)} ${px(left)} round 8px)`;
  }

  function startClip() {
    const el = buttons();
    if (!el || typeof requestAnimationFrame !== 'function') return null;
    clipped = { el, reveal: { onfinish: null } };
    return clipped;
  }

  function stopClip() {
    if (clipped) clipped.el.style.clipPath = '';
    clipped = null;
  }

  // The buttons are uncovered as the pool grows under them; the returned handle's onfinish runs when they are
  // fully out (null when there is nothing to animate: they are shown at once)
  function uncoverButtons() {
    const c = startClip();
    if (!c) return null;
    poolEdge = edge;
    clipToPool(domeShape());
    return c.reveal;
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
    updateShade();   // the page under the blob may have changed since it was placed
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
    dragButtons,
    releaseButtons,
    uncoverButtons,

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

    // Restores the blob saved on a previous visit: it slides out of the edge with a small overshoot and the
    // orange dot fades in. Simpler than the splat of a new blob (no drops): the page is still loading.
    dock(ed, a) {
      blobGen++;
      clearTimeout(splatTimer);
      iconDotFrom = null;
      edge = ed;
      along = clampAlong(ed, a, vw(), vh());
      placeBlob();
      resetParts();
      blob.hidden = false;
      const out = { left: '-28px 0', right: '28px 0', top: '0 -28px', bottom: '0 28px' }[ed];
      animate(blob, [{ translate: out }, { translate: '0 0' }], { duration: 480, easing: 'cubic-bezier(.34,1.45,.64,1)' });
      animate(dot, [{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: 220, fill: 'backwards' });
      // the blob is restored while Creatio is still drawing the page: watch it for a while
      watchShade();
    },
  };
}

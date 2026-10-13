import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  PRESS_DISTANCE,
  EDGE_HOLD_MS,
  TEAR_DISTANCE,
  pressedEdge,
  isCursorAtEdge,
  clampAlong,
  alongForRect,
  buttonsPositionFor,
  saveBlobState,
  loadBlobState,
  clearBlobState,
  createEdgeBlob,
} from '../src/edgeBlob.js';

const VW = 1280;
const VH = 800;
const KEY = 'menuEdgeBlob_shell_https://app.example.com';

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: { origin: 'https://app.example.com', href: 'https://app.example.com/shell/' },
    writable: true, configurable: true,
  });
  Object.defineProperty(window, 'innerWidth', { value: VW, writable: true, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: VH, writable: true, configurable: true });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.getElementById('csl-edge-blob-style')?.remove();
});

// ─── Geometry ────────────────────────────────────────────────────────────────

describe('pressedEdge', () => {
  it('returns null while the buttons are inside the viewport', () => {
    expect(pressedEdge(100, 100, 200, 50, VW, VH)).toBeNull();
  });

  it('reports how far the buttons are pushed past the left edge', () => {
    expect(pressedEdge(-12, 100, 200, 50, VW, VH)).toEqual({ edge: 'left', over: 12 });
  });

  it('measures the right and bottom edges from the far side of the buttons', () => {
    expect(pressedEdge(VW - 200 + 5, 100, 200, 50, VW, VH)).toEqual({ edge: 'right', over: 5 });
    expect(pressedEdge(100, VH - 50 + 9, 200, 50, VW, VH)).toEqual({ edge: 'bottom', over: 9 });
  });

  it('picks the edge pushed furthest in a corner', () => {
    expect(pressedEdge(-3, -10, 200, 50, VW, VH).edge).toBe('top');
  });
});

describe('isCursorAtEdge', () => {
  it('detects the cursor pinned to each screen edge', () => {
    expect(isCursorAtEdge('left', 0, 300, VW, VH)).toBe(true);
    expect(isCursorAtEdge('right', VW - 1, 300, VW, VH)).toBe(true);
    expect(isCursorAtEdge('top', 300, 1, VW, VH)).toBe(true);
    expect(isCursorAtEdge('bottom', 300, VH - 1, VW, VH)).toBe(true);
    expect(isCursorAtEdge('left', 40, 300, VW, VH)).toBe(false);
  });
});

describe('clampAlong / alongForRect', () => {
  it('keeps the whole blob on screen', () => {
    expect(clampAlong('left', 0, VW, VH)).toBe(27);
    expect(clampAlong('left', VH, VW, VH)).toBe(VH - 27);
    expect(clampAlong('top', 500, VW, VH)).toBe(500);
  });

  it('puts the blob at the middle of the buttons along the edge', () => {
    const rect = { left: 0, top: 300, width: 220, height: 52 };
    expect(alongForRect('left', rect, VW, VH)).toBe(326);
    expect(alongForRect('top', rect, VW, VH)).toBe(110);
  });
});

describe('buttonsPositionFor', () => {
  it('places the buttons next to the edge, centred on the blob', () => {
    expect(buttonsPositionFor('left', 326, 220, 52, VW, VH)).toEqual({ x: 8, y: 300 });
    expect(buttonsPositionFor('right', 326, 220, 52, VW, VH)).toEqual({ x: VW - 220 - 8, y: 300 });
    expect(buttonsPositionFor('top', 400, 220, 52, VW, VH)).toEqual({ x: 290, y: 8 });
    expect(buttonsPositionFor('bottom', 400, 220, 52, VW, VH)).toEqual({ x: 290, y: VH - 52 - 8 });
  });

  it('keeps the buttons on screen near a corner', () => {
    expect(buttonsPositionFor('left', 10, 220, 52, VW, VH).y).toBe(8);
  });
});

// ─── Persistence ─────────────────────────────────────────────────────────────

describe('blob state storage', () => {
  it('stores the edge and the position along it as a fraction of the edge length', () => {
    saveBlobState('shell', 'left', 400);
    const stored = chrome.storage.local.set.mock.calls[0][0][KEY];
    expect(stored.edge).toBe('left');
    expect(stored.along).toBe(0.5);
  });

  it('restores the position for the current window size', () => {
    saveBlobState('shell', 'left', 400);
    window.innerHeight = 600;
    const cb = vi.fn();
    loadBlobState('shell', cb);
    expect(cb).toHaveBeenCalledWith({ edge: 'left', along: 300 });
  });

  it('returns null when nothing is stored or the record is broken', () => {
    const cb = vi.fn();
    loadBlobState('shell', cb);
    expect(cb).toHaveBeenCalledWith(null);
    chrome.storage.local.set({ [KEY]: { edge: 'middle', along: 0.5 } });
    loadBlobState('shell', cb);
    expect(cb).toHaveBeenLastCalledWith(null);
  });

  it('keeps blobs of different page types apart', () => {
    saveBlobState('configuration', 'top', 640);
    const cb = vi.fn();
    loadBlobState('shell', cb);
    expect(cb).toHaveBeenCalledWith(null);
  });

  it('clearBlobState removes the record', () => {
    saveBlobState('shell', 'left', 400);
    clearBlobState('shell');
    const cb = vi.fn();
    loadBlobState('shell', cb);
    expect(cb).toHaveBeenCalledWith(null);
  });
});

// ─── Controller ──────────────────────────────────────────────────────────────

function setup() {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const container = document.createElement('div');
  root.appendChild(container);
  // buttons standing against the left edge
  container.getBoundingClientRect = () => ({ left: 0, top: 300, width: 220, height: 52, right: 220, bottom: 352 });
  const callbacks = { onBlob: vi.fn(), onRestore: vi.fn(), onTearOff: vi.fn() };
  const controller = new AbortController();
  const blob = createEdgeBlob({ root, pageType: 'shell', signal: controller.signal, ...callbacks });
  return {
    root, container, blob, controller, ...callbacks,
    wet: root.querySelector('.csl-edge-wet'),
    blobEl: root.querySelector('.csl-edge-blob'),
    hit: root.querySelector('.csl-edge-hit'),
  };
}

// box of the visible buttons, 220x52, at x (y = 300)
const raw = x => ({ left: x, top: 300, width: 220, height: 52 });
const move = (x, y) => document.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
const up = () => document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

describe('createEdgeBlob — pushing the buttons into an edge', () => {
  it('injects its stylesheet once', () => {
    setup();
    setup();
    expect(document.querySelectorAll('#csl-edge-blob-style')).toHaveLength(1);
  });

  it('shows a growing wet spot instead of making a blob before the press distance', () => {
    const t = setup();
    const became = t.blob.press(t.container, raw(-PRESS_DISTANCE / 2), 100, 320);
    expect(became).toBe(false);
    expect(t.onBlob).not.toHaveBeenCalled();
    expect(t.wet.hidden).toBe(false);
    expect(Number(t.wet.style.getPropertyValue('--csl-wy'))).toBeGreaterThan(0);
    expect(t.blobEl.hidden).toBe(true);
  });

  it('the wet spot dries out when the buttons leave the edge', () => {
    const t = setup();
    t.blob.press(t.container, raw(-5), 100, 320);
    t.blob.press(t.container, raw(30), 100, 320);
    expect(t.wet.hidden).toBe(true);
  });

  it('the wet spot dries out when the drag ends before the blob appears', () => {
    const t = setup();
    t.blob.press(t.container, raw(-5), 100, 320);
    t.blob.release();
    expect(t.wet.hidden).toBe(true);
  });

  it('turns the buttons into a blob once the cursor is a press distance past the edge', () => {
    const t = setup();
    const became = t.blob.press(t.container, raw(-PRESS_DISTANCE), 80, 320);
    expect(became).toBe(true);
    expect(t.onBlob).toHaveBeenCalledTimes(1);
    expect(t.container.getAttribute('data-edge-docked')).toBe('left');
    expect(t.blob.edge).toBe('left');
    vi.advanceTimersByTime(100);
    expect(t.blobEl.hidden).toBe(false);
    expect(t.wet.hidden).toBe(true);
  });

  it('remembers the blob for the next visit', () => {
    const t = setup();
    t.blob.press(t.container, raw(-PRESS_DISTANCE), 80, 320);
    const cb = vi.fn();
    loadBlobState('shell', cb);
    expect(cb).toHaveBeenCalledWith({ edge: 'left', along: 326 });
  });

  it('holding the cursor at the screen edge also makes the blob', () => {
    const t = setup();
    t.blob.press(t.container, raw(-3), 0, 320);
    expect(t.onBlob).not.toHaveBeenCalled();
    vi.advanceTimersByTime(EDGE_HOLD_MS + 1);
    expect(t.onBlob).toHaveBeenCalledTimes(1);
  });

  it('the hold is cancelled when the cursor leaves the screen edge', () => {
    const t = setup();
    t.blob.press(t.container, raw(-3), 0, 320);
    t.blob.press(t.container, raw(-3), 40, 320);
    vi.advanceTimersByTime(EDGE_HOLD_MS + 1);
    expect(t.onBlob).not.toHaveBeenCalled();
  });

  it('the hold is cancelled when the drag ends', () => {
    const t = setup();
    t.blob.press(t.container, raw(-3), 0, 320);
    t.blob.release();
    vi.advanceTimersByTime(EDGE_HOLD_MS + 1);
    expect(t.onBlob).not.toHaveBeenCalled();
  });
});

describe('createEdgeBlob — the blob', () => {
  function docked() {
    const t = setup();
    t.blob.dock('left', 326);
    return t;
  }

  it('dock() shows the blob at once on the given edge', () => {
    const t = docked();
    expect(t.blobEl.hidden).toBe(false);
    expect(t.blobEl.style.left).toBe('0px');
    expect(t.blobEl.style.top).toBe(`${326 - 27}px`);
  });

  it('dock() on the right edge mirrors the blob', () => {
    const t = setup();
    t.blob.dock('right', 326);
    expect(t.blobEl.style.left).toBe(`${VW - 36}px`);
    expect(t.blobEl.style.transform).toBe('rotate(180deg)');
  });

  it('a click turns the blob back into the buttons and forgets it', () => {
    const t = docked();
    saveBlobState('shell', 'left', 326);
    t.hit.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 326, bubbles: true }));
    up();
    expect(t.onRestore).toHaveBeenCalledWith('left', 326);
    expect(t.blob.edge).toBeNull();
    expect(t.blobEl.hidden).toBe(true);
    const cb = vi.fn();
    loadBlobState('shell', cb);
    expect(cb).toHaveBeenCalledWith(null);
  });

  it('hovering does not turn the blob into the buttons', () => {
    const t = docked();
    t.hit.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    t.hit.dispatchEvent(new MouseEvent('mouseenter'));
    expect(t.onRestore).not.toHaveBeenCalled();
  });

  it('dragging the blob along the edge slides it and keeps it a blob', () => {
    const t = docked();
    t.hit.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 326, bubbles: true }));
    move(10, 426);
    up();
    expect(t.onRestore).not.toHaveBeenCalled();
    expect(t.blobEl.style.top).toBe(`${426 - 27}px`);
    const cb = vi.fn();
    loadBlobState('shell', cb);
    expect(cb).toHaveBeenCalledWith({ edge: 'left', along: 426 });
  });

  it('a short pull stretches the blob, releasing it keeps it on the edge', () => {
    const t = docked();
    t.hit.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 326, bubbles: true }));
    move(10 + TEAR_DISTANCE / 2, 326);
    expect(t.root.querySelector('.csl-edge-core').style.transform).toContain('translateX');
    up();
    expect(t.onTearOff).not.toHaveBeenCalled();
    expect(t.blob.edge).toBe('left');
    expect(t.root.querySelector('.csl-edge-core').style.transform).toBe('');
  });

  it('pulling past the tear distance tears the blob off and hands the drag to the buttons', () => {
    const t = docked();
    saveBlobState('shell', 'left', 326);
    t.hit.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 326, bubbles: true }));
    move(10 + TEAR_DISTANCE + 5, 330);
    expect(t.onTearOff).toHaveBeenCalledWith(10 + TEAR_DISTANCE + 5, 330);
    expect(t.blob.edge).toBeNull();
    const cb = vi.fn();
    loadBlobState('shell', cb);
    expect(cb).toHaveBeenCalledWith(null);
  });

  it('press() is ignored while the blob is on an edge', () => {
    const t = docked();
    expect(t.blob.press(t.container, raw(-50), 0, 320)).toBe(false);
    expect(t.onBlob).not.toHaveBeenCalled();
  });

  it('after becoming a blob mid-drag, the same drag keeps holding the blob', () => {
    const t = setup();
    t.blob.press(t.container, raw(-PRESS_DISTANCE), 80, 320);
    move(80, 420);   // slide along the edge without releasing the mouse
    expect(t.blobEl.style.top).toBe(`${426 - 27}px`);
    up();
    expect(t.onRestore).not.toHaveBeenCalled();
  });

  it('a blob torn off before the squash finished does not hide the buttons again', () => {
    const t = setup();
    let squash = null;
    t.container.animate = () => (squash = { onfinish: null });
    t.blob.press(t.container, raw(-PRESS_DISTANCE), 80, 320);
    move(80 + TEAR_DISTANCE + 5, 320);   // torn off while the buttons are still squashing
    expect(t.onTearOff).toHaveBeenCalled();
    t.container.removeAttribute('data-edge-docked');
    squash.onfinish();
    expect(t.container.hasAttribute('data-edge-docked')).toBe(false);
  });

  it('aborting the signal removes the blob elements', () => {
    const t = docked();
    t.controller.abort();
    expect(t.root.querySelector('.csl-edge-blob')).toBeNull();
    expect(t.root.querySelector('.csl-edge-wet')).toBeNull();
  });
});

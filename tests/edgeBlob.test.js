import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  PRESS_DISTANCE,
  EDGE_HOLD_MS,
  TEAR_DISTANCE,
  PEEK_HOVER_MS,
  PEEK_IDLE_MS,
  DOT_FLIGHT_MS,
  pressedEdge,
  isCursorAtEdge,
  clampAlong,
  alongForRect,
  buttonsPositionFor,
  saveBlobState,
  loadBlobState,
  clearBlobState,
  createEdgeBlob,
  bellHeight,
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
    expect(clampAlong('left', 0, VW, VH)).toBe(50);
    expect(clampAlong('left', VH, VW, VH)).toBe(VH - 50);
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

function setup(options = {}) {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const container = document.createElement('div');
  root.appendChild(container);
  // buttons standing against the left edge
  container.getBoundingClientRect = () => ({ left: 0, top: 300, width: 220, height: 52, right: 220, bottom: 352 });
  const callbacks = { onBlob: vi.fn(), onPeek: vi.fn(), onPeekEnd: vi.fn(), onTearOff: vi.fn() };
  const controller = new AbortController();
  const blob = createEdgeBlob({ root, container, pageType: 'shell', signal: controller.signal, ...callbacks, ...options });
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
  function docked(options) {
    const t = setup(options);
    t.blob.dock('left', 326);
    return t;
  }

  it('dock() shows the blob at once on the given edge', () => {
    const t = docked();
    expect(t.blobEl.hidden).toBe(false);
    expect(t.blobEl.style.left).toBe('0px');
    expect(t.blobEl.style.top).toBe(`${326 - 50}px`);
  });

  it('dock() on the right edge mirrors the blob', () => {
    const t = setup();
    t.blob.dock('right', 326);
    expect(t.blobEl.style.left).toBe(`${VW - 36}px`);
    expect(t.blobEl.style.transform).toBe('rotate(180deg)');
  });

  it('a click brings the buttons out but keeps them docked', () => {
    const t = docked();
    saveBlobState('shell', 'left', 326);
    t.hit.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 326, bubbles: true }));
    up();
    expect(t.onPeek).toHaveBeenCalledWith('left', 326);
    expect(t.blob.edge).toBe('left');
    expect(t.blob.peeking).toBe(true);
    expect(t.blobEl.hidden).toBe(true);
    const cb = vi.fn();
    loadBlobState('shell', cb);
    expect(cb).toHaveBeenCalledWith({ edge: 'left', along: 326 });
  });

  it(`resting the mouse on the blob for ${PEEK_HOVER_MS} ms brings the buttons out`, () => {
    const t = docked();
    t.hit.dispatchEvent(new MouseEvent('mouseenter'));
    expect(t.blobEl.classList.contains('csl-edge-charging')).toBe(true);
    vi.advanceTimersByTime(PEEK_HOVER_MS - 1);
    expect(t.onPeek).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(t.onPeek).toHaveBeenCalledWith('left', 326);
    expect(t.blob.edge).toBe('left');
    expect(t.blobEl.classList.contains('csl-edge-charging')).toBe(false);
  });

  it('a shorter hover does not bring the buttons out', () => {
    const t = docked();
    t.hit.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(PEEK_HOVER_MS - 500);
    t.hit.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(PEEK_HOVER_MS);
    expect(t.onPeek).not.toHaveBeenCalled();
    expect(t.blobEl.classList.contains('csl-edge-charging')).toBe(false);
  });

  it('grabbing the blob cancels the hover', () => {
    const t = docked();
    t.hit.dispatchEvent(new MouseEvent('mouseenter'));
    t.hit.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 326, bubbles: true }));
    move(10, 426);
    vi.advanceTimersByTime(PEEK_HOVER_MS);
    expect(t.onPeek).not.toHaveBeenCalled();
    up();
  });

  function peeked(options) {
    const t = docked(options);
    t.hit.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 326, bubbles: true }));
    up();
    return t;
  }

  it(`the buttons go back into the blob ${PEEK_IDLE_MS / 1000} s after they came out unused`, () => {
    const t = peeked();
    vi.advanceTimersByTime(PEEK_IDLE_MS - 1);
    expect(t.onPeekEnd).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(t.onPeekEnd).toHaveBeenCalledTimes(1);
    expect(t.blob.peeking).toBe(false);
    expect(t.blob.edge).toBe('left');
    expect(t.container.getAttribute('data-edge-docked')).toBe('left');
    vi.advanceTimersByTime(100);
    expect(t.blobEl.hidden).toBe(false);
  });

  it('the countdown waits while the mouse is on the buttons and restarts when it leaves', () => {
    const t = peeked();
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    vi.advanceTimersByTime(PEEK_IDLE_MS - 1000);
    t.container.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    vi.advanceTimersByTime(PEEK_IDLE_MS * 3);
    expect(t.onPeekEnd).not.toHaveBeenCalled();
    outside.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    vi.advanceTimersByTime(PEEK_IDLE_MS - 1);
    expect(t.onPeekEnd).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(t.onPeekEnd).toHaveBeenCalledTimes(1);
  });

  it('a menu of the buttons counts as the buttons being used', () => {
    const t = peeked();
    const menu = document.createElement('div');
    t.root.appendChild(menu);
    menu.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    vi.advanceTimersByTime(PEEK_IDLE_MS * 2);
    expect(t.onPeekEnd).not.toHaveBeenCalled();
  });

  it('a press on the page outside the extension sends the buttons back into the blob at once', () => {
    const t = peeked();
    const page = document.createElement('div');
    document.body.appendChild(page);
    page.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(t.onPeekEnd).toHaveBeenCalledTimes(1);
    expect(t.blob.peeking).toBe(false);
    expect(t.container.getAttribute('data-edge-docked')).toBe('left');
    vi.advanceTimersByTime(100);
    expect(t.blobEl.hidden).toBe(false);
    vi.advanceTimersByTime(PEEK_IDLE_MS);
    expect(t.onPeekEnd).toHaveBeenCalledTimes(1);   // the idle countdown was dropped
  });

  it('the press goes through the capture phase, so a page that stops it still sends the buttons back', () => {
    const t = peeked();
    const page = document.createElement('div');
    document.body.appendChild(page);
    page.addEventListener('mousedown', e => e.stopPropagation());
    page.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(t.onPeekEnd).toHaveBeenCalledTimes(1);
  });

  it('a press on the buttons or their menus keeps them out', () => {
    const t = peeked();
    const menu = document.createElement('div');
    t.root.appendChild(menu);
    t.container.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    menu.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(t.onPeekEnd).not.toHaveBeenCalled();
    expect(t.blob.peeking).toBe(true);
  });

  it('a press on the page while docked does nothing', () => {
    const t = docked();
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(t.onPeekEnd).not.toHaveBeenCalled();
    expect(t.blobEl.hidden).toBe(false);
  });

  it('after going back into the blob, it can be brought out again', () => {
    const t = peeked();
    vi.advanceTimersByTime(PEEK_IDLE_MS + 100);
    t.hit.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 326, bubbles: true }));
    up();
    expect(t.onPeek).toHaveBeenCalledTimes(2);
    expect(t.blob.peeking).toBe(true);
  });

  it('dragging the blob along the edge slides it and keeps it a blob', () => {
    const t = docked();
    t.hit.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 326, bubbles: true }));
    move(10, 426);
    up();
    expect(t.onPeek).not.toHaveBeenCalled();
    expect(t.blobEl.style.top).toBe(`${426 - 50}px`);
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

  it('the blob tears off only past the given tear distance (the button height)', () => {
    const t = docked({ tearDistance: () => 50 });
    t.hit.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 326, bubbles: true }));
    move(10 + 45, 326);
    expect(t.onTearOff).not.toHaveBeenCalled();
    move(10 + 51, 326);
    expect(t.onTearOff).toHaveBeenCalledWith(61, 326);
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
    expect(t.blobEl.style.top).toBe(`${426 - 50}px`);
    up();
    expect(t.onPeek).not.toHaveBeenCalled();
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

describe('createEdgeBlob — the orange dot flies between the blob and the icon', () => {
  const rect = (left, top, size) => () => ({ left, top, width: size, height: size, right: left + size, bottom: top + size });

  function withIcon() {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
    const t = setup();
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    icon.setAttribute('class', 'csl-icon-dot');
    icon.getBoundingClientRect = rect(30, 316, 5);
    t.container.appendChild(icon);
    t.dot = t.root.querySelector('.csl-edge-dot');
    t.dot.getBoundingClientRect = rect(2, 324, 5);
    t.icon = icon;
    t.blob.dock('left', 326);
    return t;
  }
  const flyer = t => t.root.querySelector('.csl-edge-flydot');
  const click = t => {
    t.hit.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 326, bubbles: true }));
    up();
  };

  it('on a peek the dot flies from the blob to the icon, the icon dot shows when it lands', () => {
    const t = withIcon();
    click(t);
    expect(flyer(t)).not.toBeNull();
    expect(t.icon.style.visibility).toBe('hidden');
    vi.advanceTimersByTime(16);
    expect(parseFloat(flyer(t).style.left)).toBeCloseTo(2, 0);
    vi.advanceTimersByTime(DOT_FLIGHT_MS + 32);
    expect(flyer(t)).toBeNull();
    expect(t.icon.style.visibility).toBe('');
  });

  it('the dot follows the icon while the buttons move', () => {
    const t = withIcon();
    click(t);
    vi.advanceTimersByTime(DOT_FLIGHT_MS / 2);
    t.icon.getBoundingClientRect = rect(130, 316, 5);
    vi.advanceTimersByTime(DOT_FLIGHT_MS / 2 - 48);   // still flying
    expect(parseFloat(flyer(t).style.left)).toBeGreaterThan(100);
  });

  it('when the peek ends the dot flies from the icon back into the blob', () => {
    const t = withIcon();
    click(t);
    vi.advanceTimersByTime(PEEK_IDLE_MS);   // the countdown started with the peek
    vi.advanceTimersByTime(1);   // the splat after the squash
    expect(t.icon.style.visibility).toBe('');   // the icon is shown again once its dot has left it
    expect(flyer(t)).not.toBeNull();
    expect(t.dot.style.visibility).toBe('hidden');
    vi.advanceTimersByTime(DOT_FLIGHT_MS + 32);
    expect(flyer(t)).toBeNull();
    expect(t.dot.style.visibility).toBe('');
  });

  it('without an icon on the buttons nothing flies', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
    const t = setup();
    t.blob.dock('left', 326);
    click(t);
    expect(flyer(t)).toBeNull();
  });

  it('aborting the signal stops a flight', () => {
    const t = withIcon();
    click(t);
    t.controller.abort();
    expect(flyer(t)).toBeNull();
    expect(t.icon.style.visibility).toBe('');
  });
});

describe('bellHeight', () => {
  it('is highest in the middle and runs out to almost nothing at the ends of the blob', () => {
    expect(bellHeight(0)).toBeGreaterThan(20);
    expect(bellHeight(20)).toBeLessThan(bellHeight(0) / 3);
    expect(bellHeight(50)).toBeLessThan(0.5);
    expect(bellHeight(-12)).toBeCloseTo(bellHeight(12));
  });
});

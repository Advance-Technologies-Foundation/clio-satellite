import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../src/positionManager.js', () => ({
  positionFloatingContainerRelativeToSearch: vi.fn(() => true),
  saveMenuPosition: vi.fn(),
  loadMenuPosition: vi.fn((_pageType, cb) => cb(null, null)),
  applySavedPosition: vi.fn(() => true),
  loadAutoPosition: vi.fn((_pageType, cb) => cb(null)),
  applyAutoPosition: vi.fn(),
}));

import { setupFloatingContainer } from '../src/floatingContainer.js';
import {
  loadMenuPosition,
  saveMenuPosition,
  applySavedPosition,
  positionFloatingContainerRelativeToSearch,
  loadAutoPosition,
  applyAutoPosition,
} from '../src/positionManager.js';

function makeWrapper() {
  const wrapper = document.createElement('div');
  wrapper.className = 'creatio-satelite';
  return wrapper;
}

function makeExtension() {
  const ec = document.createElement('div');
  document.body.appendChild(ec);
  return ec;
}

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: { hostname: 'app.example.com', pathname: '/shell/', href: 'https://app.example.com/shell/', origin: 'https://app.example.com' },
    writable: true, configurable: true,
  });
  Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: 800, writable: true, configurable: true });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

// ─── Container creation ───────────────────────────────────────────────────────

describe('setupFloatingContainer — creation', () => {
  it('returns a div with class creatio-satelite-floating', () => {
    const fc = setupFloatingContainer('shell', makeWrapper(), makeExtension());
    expect(fc.classList.contains('creatio-satelite-floating')).toBe(true);
  });

  it('appends container to extensionContainer', () => {
    const ec = makeExtension();
    setupFloatingContainer('shell', makeWrapper(), ec);
    expect(ec.querySelector('.creatio-satelite-floating')).not.toBeNull();
  });

  it('shell: adds creatio-satelite-shell class to buttonWrapper', () => {
    const wrapper = makeWrapper();
    setupFloatingContainer('shell', wrapper, makeExtension());
    expect(wrapper.classList.contains('creatio-satelite-shell')).toBe(true);
  });

  it('configuration: adds creatio-satelite-configuration class to buttonWrapper', () => {
    const wrapper = makeWrapper();
    setupFloatingContainer('configuration', wrapper, makeExtension());
    expect(wrapper.classList.contains('creatio-satelite-configuration')).toBe(true);
  });

  it('shell: fades in within 0.3s so the buttons are noticeable right away', () => {
    const fc = setupFloatingContainer('shell', makeWrapper(), makeExtension());
    expect(fc.style.transition).toContain('0.3s');
  });

  it('marks the container with its page type', () => {
    const fc = setupFloatingContainer('shell', makeWrapper(), makeExtension());
    expect(fc.getAttribute('data-page-type')).toBe('shell');
  });

  it('configuration: transition is 0.3s', () => {
    const fc = setupFloatingContainer('configuration', makeWrapper(), makeExtension());
    expect(fc.style.transition).toContain('0.3s');
  });

  it('starts with opacity 0', () => {
    const fc = setupFloatingContainer('shell', makeWrapper(), makeExtension());
    expect(fc.style.opacity).toBe('0');
  });
});

// ─── Position loading ─────────────────────────────────────────────────────────

describe('setupFloatingContainer — position loading', () => {
  it('calls loadMenuPosition with correct pageType', () => {
    setupFloatingContainer('shell', makeWrapper(), makeExtension());
    expect(loadMenuPosition).toHaveBeenCalledWith('shell', expect.any(Function));
  });

  it('calls applySavedPosition when saved coordinates exist', () => {
    loadMenuPosition.mockImplementationOnce((_pt, cb) => cb(200, 150));
    setupFloatingContainer('shell', makeWrapper(), makeExtension());
    expect(applySavedPosition).toHaveBeenCalledWith(expect.any(HTMLElement), 200, 150);
  });

  it('makes container visible after applying saved position', () => {
    loadMenuPosition.mockImplementationOnce((_pt, cb) => cb(200, 150));
    const fc = setupFloatingContainer('shell', makeWrapper(), makeExtension());
    vi.advanceTimersByTime(100);
    expect(fc.style.opacity).toBe('1');
  });

  it('restores the last auto position and shows the buttons at once when the user never dragged them', () => {
    loadAutoPosition.mockImplementationOnce((_pt, cb) => cb({ x: 500, y: 10, vw: 1280 }));
    const fc = setupFloatingContainer('shell', makeWrapper(), makeExtension());
    expect(applyAutoPosition).toHaveBeenCalledWith(fc, { x: 500, y: 10, vw: 1280 });
    expect(fc.style.opacity).toBe('1');
  });

  it('does not use the auto position when the user dragged the buttons', () => {
    loadMenuPosition.mockImplementationOnce((_pt, cb) => cb(200, 150));
    setupFloatingContainer('shell', makeWrapper(), makeExtension());
    expect(loadAutoPosition).not.toHaveBeenCalled();
  });

  it('calls positioning function when no saved position', () => {
    loadMenuPosition.mockImplementationOnce((_pt, cb) => cb(null, null));
    setupFloatingContainer('shell', makeWrapper(), makeExtension());
    vi.advanceTimersByTime(200);
    expect(positionFloatingContainerRelativeToSearch).toHaveBeenCalled();
  });
});

// ─── Drag ─────────────────────────────────────────────────────────────────────

describe('setupFloatingContainer — drag', () => {
  function setupDrag(pageType = 'shell') {
    const wrapper = makeWrapper();
    const ec = makeExtension();
    const fc = setupFloatingContainer(pageType, wrapper, ec);

    // Simulate container starting at (300, 200)
    fc.getBoundingClientRect = () => ({ left: 300, top: 200, width: 100, height: 40, right: 400, bottom: 240 });
    Object.defineProperty(fc, 'offsetWidth', { get: () => 100, configurable: true });
    Object.defineProperty(fc, 'offsetHeight', { get: () => 40, configurable: true });

    return fc;
  }

  it('sets cursor to grabbing on mousedown', () => {
    const fc = setupDrag();
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 310, clientY: 210, bubbles: true }));
    expect(fc.style.cursor).toBe('grabbing');
  });

  it('moves container on mousemove after mousedown', () => {
    const fc = setupDrag();
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 310, clientY: 210, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 360, clientY: 240, bubbles: true }));

    // delta: +50 x, +30 y → new position: 300+50=350, 200+30=230
    expect(fc.style.left).toBe('350px');
    expect(fc.style.top).toBe('230px');
  });

  it('clamps position within viewport on mousemove', () => {
    const fc = setupDrag();
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 310, clientY: 210, bubbles: true }));
    // Move far outside viewport
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 9999, clientY: 9999, bubbles: true }));

    expect(parseInt(fc.style.left)).toBe(1280 - 100); // innerWidth - offsetWidth
    expect(parseInt(fc.style.top)).toBe(800 - 40);    // innerHeight - offsetHeight
  });

  function drag(fc, toX = 360, toY = 240) {
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 310, clientY: 210, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: toX, clientY: toY, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  }

  it('saves position on mouseup after a drag', () => {
    const fc = setupDrag();
    drag(fc);
    expect(saveMenuPosition).toHaveBeenCalled();
  });

  it('sets data-user-positioned on mouseup after a drag', () => {
    const fc = setupDrag();
    drag(fc);
    expect(fc.getAttribute('data-user-positioned')).toBe('true');
  });

  it('a plain click on the buttons is not a drag: position is not saved', () => {
    const fc = setupDrag();
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 310, clientY: 210, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(saveMenuPosition).not.toHaveBeenCalled();
    expect(fc.hasAttribute('data-user-positioned')).toBe(false);
  });

  it('a move shorter than the drag threshold does not move the buttons', () => {
    const fc = setupDrag();
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 310, clientY: 210, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 312, clientY: 211, bubbles: true }));
    expect(fc.style.left).toBe('');
  });

  it('the click that ends a drag does not reach the button (no menu pops up)', () => {
    const wrapper = makeWrapper();
    const button = document.createElement('button');
    wrapper.appendChild(button);
    const onClick = vi.fn();
    button.addEventListener('click', onClick);
    const fc = setupFloatingContainer('shell', wrapper, makeExtension());
    fc.getBoundingClientRect = () => ({ left: 300, top: 200, width: 100, height: 40, right: 400, bottom: 240 });
    button.dispatchEvent(new MouseEvent('mousedown', { clientX: 310, clientY: 210, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 300, bubbles: true }));
    button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('a click without a drag still reaches the button', () => {
    const wrapper = makeWrapper();
    const button = document.createElement('button');
    wrapper.appendChild(button);
    const onClick = vi.fn();
    button.addEventListener('click', onClick);
    setupFloatingContainer('shell', wrapper, makeExtension());
    button.dispatchEvent(new MouseEvent('mousedown', { clientX: 310, clientY: 210, bubbles: true }));
    button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('suppression ends when no click follows the drag', () => {
    const wrapper = makeWrapper();
    const button = document.createElement('button');
    wrapper.appendChild(button);
    const onClick = vi.fn();
    button.addEventListener('click', onClick);
    const fc = setupFloatingContainer('shell', wrapper, makeExtension());
    fc.getBoundingClientRect = () => ({ left: 300, top: 200, width: 100, height: 40, right: 400, bottom: 240 });
    drag(fc);
    vi.advanceTimersByTime(1);
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('stops moving after mouseup', () => {
    const fc = setupDrag();
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 310, clientY: 210, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    // Further mousemove should not change position
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 999, clientY: 999, bubbles: true }));
    expect(fc.style.left).toBe(''); // not set by mousemove after mouseup
  });

  it('restores cursor to move on mouseup', () => {
    const fc = setupDrag();
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 310, clientY: 210, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(fc.style.cursor).toBe('move');
  });
});

// ─── Double-click ─────────────────────────────────────────────────────────────

describe('setupFloatingContainer — double-click', () => {
  it('does not move the buttons back next to the search or forget the dragged position', () => {
    const fc = setupFloatingContainer('shell', makeWrapper(), makeExtension());
    fc.setAttribute('data-user-positioned', 'true');
    positionFloatingContainerRelativeToSearch.mockClear();
    fc.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    vi.advanceTimersByTime(50);
    expect(fc.getAttribute('data-user-positioned')).toBe('true');
    expect(positionFloatingContainerRelativeToSearch).not.toHaveBeenCalled();
    expect(chrome.storage.local.remove).not.toHaveBeenCalled();
  });
});


// ─── Edge blob ────────────────────────────────────────────────────────────────

describe('setupFloatingContainer — edge blob', () => {
  function setupAtLeftEdge() {
    const ec = makeExtension();
    const fc = setupFloatingContainer('shell', makeWrapper(), ec);
    fc.getBoundingClientRect = () => ({ left: 0, top: 300, width: 200, height: 40, right: 200, bottom: 340 });
    Object.defineProperty(fc, 'offsetWidth', { get: () => 200, configurable: true });
    Object.defineProperty(fc, 'offsetHeight', { get: () => 40, configurable: true });
    return { ec, fc };
  }

  it('pushing the buttons 20px past the edge turns them into a blob and ends the drag', () => {
    const { ec, fc } = setupAtLeftEdge();
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 50, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 40, clientY: 320, bubbles: true }));
    expect(fc.hasAttribute('data-edge-docked')).toBe(false);
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 30, clientY: 320, bubbles: true }));
    expect(fc.getAttribute('data-edge-docked')).toBe('left');
    expect(fc.getAttribute('data-user-positioned')).toBe('true');
    vi.advanceTimersByTime(100);
    expect(ec.querySelector('.csl-edge-blob').hidden).toBe(false);
    // the drag is over: the mouse now holds the blob, sliding along the edge moves the blob, not the buttons
    fc.style.top = '300px';
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 30, clientY: 520, bubbles: true }));
    expect(fc.style.top).toBe('300px');
    expect(fc.getAttribute('data-edge-docked')).toBe('left');
  });

  it('a click on the blob brings the buttons back next to the edge', () => {
    const { ec, fc } = setupAtLeftEdge();
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 50, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 25, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    saveMenuPosition.mockClear();
    const hit = ec.querySelector('.csl-edge-hit');
    hit.dispatchEvent(new MouseEvent('mousedown', { clientX: 5, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(fc.hasAttribute('data-edge-docked')).toBe(false);
    expect(fc.style.left).toBe('8px');
    expect(saveMenuPosition).toHaveBeenCalledWith(8, 300, 'shell');
  });

  it('grabbing the buttons while they still pop in out of the blob does not make them jump', () => {
    const { ec, fc } = setupAtLeftEdge();
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 50, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 25, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    // the pop-in animation scales the buttons down: the box reads smaller and shifted while it runs
    let running = [];
    fc.animate = () => {
      const a = { cancel: () => { running = running.filter(x => x !== a); } };
      running.push(a);
      return a;
    };
    fc.getAnimations = () => running;
    const realRect = fc.getBoundingClientRect;
    fc.getBoundingClientRect = () => (running.length
      ? { left: 70, top: 314, width: 60, height: 12, right: 130, bottom: 326 }
      : realRect());
    const hit = ec.querySelector('.csl-edge-hit');
    hit.dispatchEvent(new MouseEvent('mousedown', { clientX: 5, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(running).toHaveLength(1);
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, clientY: 320, bubbles: true }));
    expect(fc.style.left).toBe('200px');
  });

  it('tearing the blob off saves where the buttons were dropped, not the box scaled by the pop-in', () => {
    const { ec, fc } = setupAtLeftEdge();
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 50, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 25, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    const hit = ec.querySelector('.csl-edge-hit');
    hit.dispatchEvent(new MouseEvent('mousedown', { clientX: 5, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 320, bubbles: true }));
    expect(fc.hasAttribute('data-edge-docked')).toBe(false);
    // the pop-in is still running: the box reads scaled down
    fc.getBoundingClientRect = () => ({ left: 370, top: 314, width: 60, height: 12, right: 430, bottom: 326 });
    saveMenuPosition.mockClear();
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(saveMenuPosition).toHaveBeenCalledWith(parseFloat(fc.style.left), parseFloat(fc.style.top), 'shell');
    expect(fc.style.left).toBe('300px');
  });

  it('restores the blob saved on the previous visit with the buttons hidden', () => {
    chrome.storage.local.set({ 'menuEdgeBlob_shell_https://app.example.com': { edge: 'right', along: 0.5, timestamp: Date.now() } });
    const ec = makeExtension();
    const fc = setupFloatingContainer('shell', makeWrapper(), ec);
    expect(fc.getAttribute('data-edge-docked')).toBe('right');
    expect(fc.getAttribute('data-user-positioned')).toBe('true');
    const blob = ec.querySelector('.csl-edge-blob');
    expect(blob.hidden).toBe(false);
    expect(blob.style.left).toBe(`${1280 - 36}px`);
  });
});

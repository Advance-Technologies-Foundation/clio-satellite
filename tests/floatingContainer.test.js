import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../src/positionManager.js', () => ({
  positionFloatingContainerRelativeToSearch: vi.fn(() => true),
  saveMenuPosition: vi.fn(),
  loadMenuPosition: vi.fn((_pageType, cb) => cb(null, null)),
  applySavedPosition: vi.fn(() => true),
  loadAutoPosition: vi.fn((_pageType, cb) => cb(null)),
  applyAutoPosition: vi.fn(),
}));

import { setupFloatingContainer, unpinTooltipPosition, UNPIN_LABEL } from '../src/floatingContainer.js';
import { loadBlobState, PEEK_IDLE_MS } from '../src/edgeBlob.js';
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

  function dockAtLeftEdge() {
    const t = setupAtLeftEdge();
    t.fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 50, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 25, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    return t;
  }

  function clickBlob(ec) {
    const hit = ec.querySelector('.csl-edge-hit');
    hit.dispatchEvent(new MouseEvent('mousedown', { clientX: 5, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  }

  const unpinOf = ec => ec.querySelector('.csl-unpin-button');

  it('the unpin button is hidden while the buttons are free or docked', () => {
    const ec = makeExtension();
    setupFloatingContainer('shell', makeWrapper(), ec);
    expect(unpinOf(ec).style.display).toBe('none');
    const { ec: docked } = dockAtLeftEdge();
    expect(unpinOf(docked).style.display).toBe('none');
  });

  it('the unpin button shows up with a tooltip once the buttons come out of the blob', () => {
    const { ec } = dockAtLeftEdge();
    clickBlob(ec);
    const btn = unpinOf(ec);
    expect(btn.style.display).toBe('');
    expect(btn.getAttribute('aria-label')).toBe(UNPIN_LABEL);
    expect(btn.querySelector('svg')).not.toBeNull();
    const tip = ec.querySelector('.csl-unpin-tooltip');
    expect(tip.hidden).toBe(true);
    btn.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(300);
    expect(tip.hidden).toBe(false);
    expect(tip.textContent).toBe(UNPIN_LABEL);
    expect(btn.getAttribute('aria-describedby')).toBe(tip.id);
    btn.dispatchEvent(new MouseEvent('mouseleave'));
    expect(tip.hidden).toBe(true);
  });

  it('the tooltip goes away with the peek', () => {
    const { ec } = dockAtLeftEdge();
    clickBlob(ec);
    unpinOf(ec).dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(300);
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));   // ends the peek
    expect(ec.querySelector('.csl-unpin-tooltip').hidden).toBe(true);
  });

  it('a click on the unpin button frees the buttons where they stand and forgets the blob', () => {
    const { ec, fc } = dockAtLeftEdge();
    clickBlob(ec);
    vi.advanceTimersByTime(400);
    saveMenuPosition.mockClear();
    const left = fc.style.left, top = fc.style.top;
    unpinOf(ec).click();
    expect(fc.hasAttribute('data-edge-peek')).toBe(false);
    expect(fc.hasAttribute('data-edge-docked')).toBe(false);
    expect(unpinOf(ec).style.display).toBe('none');
    expect(fc.style.left).toBe(left);
    expect(fc.style.top).toBe(top);
    expect(saveMenuPosition).toHaveBeenCalledWith(parseFloat(left), parseFloat(top), 'shell');
    // the idle countdown no longer sends them back
    vi.advanceTimersByTime(PEEK_IDLE_MS + 1000);
    expect(fc.hasAttribute('data-edge-docked')).toBe(false);
    expect(ec.querySelector('.csl-edge-blob').hidden).toBe(true);
  });

  it('the unpin button does nothing while the buttons go back into the blob', () => {
    const { ec, fc } = dockAtLeftEdge();
    clickBlob(ec);
    vi.advanceTimersByTime(400);
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));   // ends the peek
    saveMenuPosition.mockClear();
    unpinOf(ec).click();
    expect(saveMenuPosition).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(fc.getAttribute('data-edge-docked')).toBe('left');
  });

  it('tearing the blob off hides the unpin button', () => {
    const { ec } = dockAtLeftEdge();
    clickBlob(ec);
    vi.advanceTimersByTime(PEEK_IDLE_MS + 400);   // back into the blob
    const hit = ec.querySelector('.csl-edge-hit');
    hit.dispatchEvent(new MouseEvent('mousedown', { clientX: 5, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(unpinOf(ec).style.display).toBe('none');
  });

  it('releasing the mouse on a button right after it became a blob does not open its menu', () => {
    const ec = makeExtension();
    const wrapper = makeWrapper();
    const button = document.createElement('button');
    wrapper.appendChild(button);
    const onClick = vi.fn();
    button.addEventListener('click', onClick);
    const fc = setupFloatingContainer('shell', wrapper, ec);
    fc.getBoundingClientRect = () => ({ left: 0, top: 300, width: 200, height: 40, right: 200, bottom: 340 });
    button.dispatchEvent(new MouseEvent('mousedown', { clientX: 50, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 25, clientY: 320, bubbles: true }));
    expect(fc.getAttribute('data-edge-docked')).toBe('left');
    // the buttons are still squashing under the cursor: mouseup and click land on a button
    button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClick).not.toHaveBeenCalled();
    // the next click is a plain click again
    vi.advanceTimersByTime(1);
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('a click on the blob brings the buttons out next to the edge without undocking them', () => {
    const { ec, fc } = dockAtLeftEdge();
    saveMenuPosition.mockClear();
    clickBlob(ec);
    expect(fc.hasAttribute('data-edge-docked')).toBe(false);
    expect(fc.getAttribute('data-edge-peek')).toBe('left');
    expect(fc.style.left).toBe('8px');
    // the drag position is not overwritten: the buttons still belong to the blob
    expect(saveMenuPosition).not.toHaveBeenCalled();
    const cb = vi.fn();
    loadBlobState('shell', cb);
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ edge: 'left' }));
  });

  it(`the buttons go back into the blob ${PEEK_IDLE_MS / 1000} s later and their menus close`, () => {
    const { ec, fc } = dockAtLeftEdge();
    const menu = document.createElement('div');
    menu.className = 'scripts-menu-container visible';
    ec.appendChild(menu);
    clickBlob(ec);
    vi.advanceTimersByTime(PEEK_IDLE_MS);
    expect(fc.hasAttribute('data-edge-peek')).toBe(false);
    expect(menu.classList.contains('visible')).toBe(false);
    vi.advanceTimersByTime(400);
    expect(fc.getAttribute('data-edge-docked')).toBe('left');
    expect(ec.querySelector('.csl-edge-blob').hidden).toBe(false);
  });

  it('reports the buttons shown once they are uncovered out of the blob', () => {
    const ec = makeExtension();
    const onPeekShown = vi.fn();
    const wrapper = makeWrapper();
    const fc = setupFloatingContainer('shell', wrapper, ec, { onPeekShown });
    fc.getBoundingClientRect = () => ({ left: 0, top: 300, width: 200, height: 40, right: 200, bottom: 340 });
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 50, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 25, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    clickBlob(ec);
    expect(onPeekShown).not.toHaveBeenCalled();   // the buttons are still coming out with the pool
    vi.advanceTimersByTime(400);
    expect(onPeekShown).toHaveBeenCalledTimes(1);
  });

  it('does not report the buttons shown when they went back into the blob while being uncovered', () => {
    const ec = makeExtension();
    const onPeekShown = vi.fn();
    const wrapper = makeWrapper();
    const fc = setupFloatingContainer('shell', wrapper, ec, { onPeekShown });
    fc.getBoundingClientRect = () => ({ left: 0, top: 300, width: 200, height: 40, right: 200, bottom: 340 });
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 50, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 25, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    clickBlob(ec);
    fc.removeAttribute('data-edge-peek');
    vi.advanceTimersByTime(400);
    expect(onPeekShown).not.toHaveBeenCalled();
  });

  it('buttons on their way back into the blob cannot be dragged', () => {
    const { ec, fc } = dockAtLeftEdge();
    clickBlob(ec);
    vi.advanceTimersByTime(400);
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));   // a press on the page
    const left = fc.style.left;
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(fc.style.left).toBe(left);
    vi.advanceTimersByTime(400);
    expect(fc.getAttribute('data-edge-docked')).toBe('left');
  });

  it('a drag started while the buttons are still coming out does not open the menus and leaves no clip', () => {
    const ec = makeExtension();
    const onPeekShown = vi.fn();
    const wrapper = makeWrapper();
    const fc = setupFloatingContainer('shell', wrapper, ec, { onPeekShown });
    fc.getBoundingClientRect = () => ({ left: 0, top: 300, width: 200, height: 40, right: 200, bottom: 340 });
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 50, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 25, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    clickBlob(ec);
    vi.advanceTimersByTime(100);   // still coming out
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 340, bubbles: true }));
    vi.advanceTimersByTime(400);
    expect(onPeekShown).not.toHaveBeenCalled();
    expect(wrapper.style.clipPath).toBe('');
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  });

  it('buttons out of the blob dragged less than a button height go back into their pool', () => {
    const { ec, fc } = dockAtLeftEdge();
    clickBlob(ec);
    expect(ec.querySelector('.csl-edge-pool').hasAttribute('hidden')).toBe(false);
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, clientY: 320, bubbles: true }));
    expect(fc.style.left).toBe('20px');
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(fc.style.left).toBe('8px');
    expect(fc.getAttribute('data-edge-peek')).toBe('left');
    expect(chrome.storage.local.remove).not.toHaveBeenCalled();
    // still out of the blob: they go back into it after the idle time
    vi.advanceTimersByTime(10000 + 400);
    expect(fc.getAttribute('data-edge-docked')).toBe('left');
  });

  it('buttons out of the blob dragged further than a button height leave the blob for good', () => {
    const { ec, fc } = dockAtLeftEdge();
    clickBlob(ec);
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 320, bubbles: true }));
    expect(fc.hasAttribute('data-edge-peek')).toBe(false);
    expect(chrome.storage.local.remove).toHaveBeenCalled();
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(fc.style.left).toBe('300px');
    vi.advanceTimersByTime(10000 + 300);
    expect(fc.hasAttribute('data-edge-docked')).toBe(false);
    expect(ec.querySelector('.csl-edge-blob').hidden).toBe(true);
    expect(ec.querySelector('.csl-edge-pool').hasAttribute('hidden')).toBe(true);
  });

  it('the blob tears off once pulled further than a button is high', () => {
    const ec = makeExtension();
    const wrapper = makeWrapper();
    const button = document.createElement('button');
    button.getBoundingClientRect = () => ({ left: 0, top: 300, width: 90, height: 50, right: 90, bottom: 350 });
    wrapper.appendChild(button);
    const fc = setupFloatingContainer('shell', wrapper, ec);
    fc.getBoundingClientRect = () => ({ left: 0, top: 300, width: 200, height: 40, right: 200, bottom: 340 });
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 50, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 25, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    // hidden in the blob, the button measures 0: the height seen before is used
    button.getBoundingClientRect = () => ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 });
    const hit = ec.querySelector('.csl-edge-hit');
    hit.dispatchEvent(new MouseEvent('mousedown', { clientX: 5, clientY: 320, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 5 + 45, clientY: 320, bubbles: true }));
    expect(fc.getAttribute('data-edge-docked')).toBe('left');
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 5 + 51, clientY: 320, bubbles: true }));
    expect(fc.hasAttribute('data-edge-docked')).toBe(false);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
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

describe('unpinTooltipPosition', () => {
  const tip = { width: 200, height: 40 };
  it('stands right of the buttons, centred on them, when it fits', () => {
    expect(unpinTooltipPosition({ left: 8, top: 300, width: 180, height: 34 }, tip, 1280, 800))
      .toEqual({ left: 196, top: 297 });
  });
  it('goes left of the buttons on the right edge', () => {
    expect(unpinTooltipPosition({ left: 1092, top: 300, width: 180, height: 34 }, tip, 1280, 800))
      .toEqual({ left: 884, top: 297 });
  });
  it('stays on the screen at the top', () => {
    expect(unpinTooltipPosition({ left: 400, top: 8, width: 180, height: 20 }, tip, 1280, 800).top).toBe(8);
  });
});

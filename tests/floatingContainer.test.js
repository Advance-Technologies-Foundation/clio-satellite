import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../src/positionManager.js', () => ({
  positionFloatingContainerRelativeToSearch: vi.fn(() => true),
  saveMenuPosition: vi.fn(),
  loadMenuPosition: vi.fn((_pageType, cb) => cb(null, null)),
  applySavedPosition: vi.fn(() => true),
}));

import { setupFloatingContainer } from '../src/floatingContainer.js';
import {
  loadMenuPosition,
  saveMenuPosition,
  applySavedPosition,
  positionFloatingContainerRelativeToSearch,
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

  it('shell: transition is 3s', () => {
    const fc = setupFloatingContainer('shell', makeWrapper(), makeExtension());
    expect(fc.style.transition).toContain('3s');
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

  it('saves position on mouseup', () => {
    const fc = setupDrag();
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 310, clientY: 210, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(saveMenuPosition).toHaveBeenCalled();
  });

  it('sets data-user-positioned on mouseup', () => {
    const fc = setupDrag();
    fc.dispatchEvent(new MouseEvent('mousedown', { clientX: 310, clientY: 210, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(fc.getAttribute('data-user-positioned')).toBe('true');
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

// ─── Double-click reset ───────────────────────────────────────────────────────

describe('setupFloatingContainer — dblclick reset', () => {
  it('removes data-user-positioned on dblclick', () => {
    const fc = setupFloatingContainer('shell', makeWrapper(), makeExtension());
    fc.setAttribute('data-user-positioned', 'true');
    fc.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(fc.hasAttribute('data-user-positioned')).toBe(false);
  });

  it('removes data-fallback-position on dblclick', () => {
    const fc = setupFloatingContainer('shell', makeWrapper(), makeExtension());
    fc.setAttribute('data-fallback-position', 'true');
    fc.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(fc.hasAttribute('data-fallback-position')).toBe(false);
  });

  it('calls chrome.storage.local.remove with correct key on dblclick', () => {
    setupFloatingContainer('shell', makeWrapper(), makeExtension());
    const fc = document.querySelector('.creatio-satelite-floating');
    fc.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(chrome.storage.local.remove).toHaveBeenCalledWith(
      ['menuPosition_shell_https://app.example.com'],
      expect.any(Function)
    );
  });

  it('triggers repositioning after dblclick', () => {
    setupFloatingContainer('shell', makeWrapper(), makeExtension());
    const fc = document.querySelector('.creatio-satelite-floating');
    positionFloatingContainerRelativeToSearch.mockClear();
    fc.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    vi.advanceTimersByTime(20);
    expect(positionFloatingContainerRelativeToSearch).toHaveBeenCalledWith(fc);
  });
});

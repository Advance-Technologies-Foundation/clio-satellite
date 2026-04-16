import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  applySavedPosition,
  saveMenuPosition,
  loadMenuPosition,
  positionFloatingContainerRelativeToSearch,
} from '../src/positionManager.js';

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: { hostname: 'myapp.example.com', pathname: '/app', href: 'https://myapp.example.com/app', origin: 'https://myapp.example.com' },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: 800, writable: true, configurable: true });
});

describe('applySavedPosition', () => {
  it('applies position and sets data-user-positioned', () => {
    const el = document.createElement('div');
    el.getBoundingClientRect = () => ({ width: 100, height: 40 });
    document.body.appendChild(el);

    applySavedPosition(el, 200, 300);

    expect(el.style.left).toBe('200px');
    expect(el.style.top).toBe('300px');
    expect(el.style.right).toBe('auto');
    expect(el.getAttribute('data-user-positioned')).toBe('true');
  });

  it('clamps position within viewport bounds', () => {
    const el = document.createElement('div');
    el.getBoundingClientRect = () => ({ width: 100, height: 40 });
    document.body.appendChild(el);

    // x=9999, y=9999 should be clamped to viewport
    applySavedPosition(el, 9999, 9999);

    const left = parseInt(el.style.left);
    const top = parseInt(el.style.top);
    expect(left).toBeLessThanOrEqual(1280 - 100 - 10); // maxX
    expect(top).toBeLessThanOrEqual(800 - 40 - 10);    // maxY
  });

  it('clamps negative position to minimum 10px', () => {
    const el = document.createElement('div');
    el.getBoundingClientRect = () => ({ width: 100, height: 40 });
    document.body.appendChild(el);

    applySavedPosition(el, -100, -100);

    expect(parseInt(el.style.left)).toBe(10);
    expect(parseInt(el.style.top)).toBe(10);
  });
});

describe('saveMenuPosition + loadMenuPosition round-trip', () => {
  it('loads back the coordinates that were saved', () => {
    saveMenuPosition(350, 120, 'shell');

    const callback = vi.fn();
    loadMenuPosition('shell', callback);

    expect(callback).toHaveBeenCalledWith(350, 120);
  });

  it('shell and configuration positions are stored independently', () => {
    saveMenuPosition(100, 200, 'shell');
    saveMenuPosition(300, 400, 'configuration');

    const shellCb = vi.fn();
    const configCb = vi.fn();
    loadMenuPosition('shell', shellCb);
    loadMenuPosition('configuration', configCb);

    expect(shellCb).toHaveBeenCalledWith(100, 200);
    expect(configCb).toHaveBeenCalledWith(300, 400);
  });

  it('returns null after position is removed via storage.remove', () => {
    saveMenuPosition(100, 200, 'shell');

    const key = 'menuPosition_shell_https://myapp.example.com';
    chrome.storage.local.remove([key]);

    const callback = vi.fn();
    loadMenuPosition('shell', callback);
    expect(callback).toHaveBeenCalledWith(null, null);
  });
});

describe('saveMenuPosition', () => {
  it('calls chrome.storage.local.set with correct key and values', () => {
    saveMenuPosition(200, 300, 'shell');
    expect(chrome.storage.local.set).toHaveBeenCalledOnce();
    const [data] = chrome.storage.local.set.mock.calls[0];
    const key = 'menuPosition_shell_https://myapp.example.com';
    expect(data[key].x).toBe(200);
    expect(data[key].y).toBe(300);
    expect(data[key].timestamp).toBeLessThanOrEqual(Date.now());
  });
});

describe('saveMenuPosition', () => {
  it('logs error when storage.set fails', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    chrome.storage.local.set.mockImplementation((_data, callback) => {
      global.chrome.runtime.lastError = { message: 'QuotaExceededError' };
      callback();
      global.chrome.runtime.lastError = undefined;
    });

    saveMenuPosition(100, 200, 'shell');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Clio Satellite]'),
      expect.stringContaining('QuotaExceededError')
    );
    consoleSpy.mockRestore();
  });
});

describe('loadMenuPosition', () => {
  it('calls callback(null, null) and logs error when storage.get fails', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    chrome.storage.local.get.mockImplementation((_keys, callback) => {
      global.chrome.runtime.lastError = { message: 'StorageError' };
      callback({});
      global.chrome.runtime.lastError = undefined;
    });

    const callback = vi.fn();
    loadMenuPosition('shell', callback);

    expect(callback).toHaveBeenCalledWith(null, null);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('returns saved position if recent', () => {
    const recentTimestamp = Date.now() - 1000;
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ 'menuPosition_shell_https://myapp.example.com': { x: 100, y: 200, timestamp: recentTimestamp } });
    });

    const callback = vi.fn();
    loadMenuPosition('shell', callback);

    expect(callback).toHaveBeenCalledWith(100, 200);
  });

  it('returns null for positions older than 30 days', () => {
    const oldTimestamp = Date.now() - (31 * 24 * 60 * 60 * 1000);
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ 'menuPosition_shell_https://myapp.example.com': { x: 100, y: 200, timestamp: oldTimestamp } });
    });

    const callback = vi.fn();
    loadMenuPosition('shell', callback);

    expect(callback).toHaveBeenCalledWith(null, null);
    expect(chrome.storage.local.remove).toHaveBeenCalled();
  });

  it('returns null when no saved position', () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => callback({}));

    const callback = vi.fn();
    loadMenuPosition('shell', callback);

    expect(callback).toHaveBeenCalledWith(null, null);
  });
});

describe('positionFloatingContainerRelativeToSearch', () => {
  it('returns false when no floating container in DOM', () => {
    document.body.innerHTML = '';
    expect(positionFloatingContainerRelativeToSearch()).toBe(false);
  });

  it('returns true and skips repositioning for user-positioned containers', () => {
    const el = document.createElement('div');
    el.className = 'creatio-satelite-floating';
    el.setAttribute('data-user-positioned', 'true');
    document.body.appendChild(el);

    expect(positionFloatingContainerRelativeToSearch(el)).toBe(true);
    expect(el.style.left).toBe('');
  });

  it('uses fallback position when no anchor elements found', () => {
    const el = document.createElement('div');
    el.className = 'creatio-satelite-floating';
    el.getBoundingClientRect = () => ({ width: 150, height: 40, top: 0, left: 0, right: 150, bottom: 40 });
    document.body.innerHTML = '';
    document.body.appendChild(el);

    const result = positionFloatingContainerRelativeToSearch(el);

    expect(result).toBe(true);
    expect(el.getAttribute('data-fallback-position')).toBe('true');
    expect(el.style.top).toBe('16px');
  });
});

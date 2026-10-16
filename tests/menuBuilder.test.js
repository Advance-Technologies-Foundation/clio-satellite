import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createScriptsMenu } from '../src/menuBuilder.js';
import { state, resetState } from '../src/state.js';

beforeEach(() => {
  vi.useFakeTimers();
  resetState();
  // Simulate a shell page
  Object.defineProperty(window, 'location', {
    value: { hostname: 'myapp.example.com', pathname: '/app', href: 'https://myapp.example.com/shell/', origin: 'https://myapp.example.com' },
    writable: true,
    configurable: true,
  });
  document.body.innerHTML = '<crt-app-toolbar></crt-app-toolbar>';
  chrome.storage.local.get.mockImplementation((_keys, cb) => cb({}));
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('createScriptsMenu', () => {
  it('returns false for unsupported page types', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'github.com', pathname: '/', href: 'https://github.com/', origin: 'https://github.com' },
      writable: true,
      configurable: true,
    });
    document.body.innerHTML = '';
    expect(createScriptsMenu()).toBe(false);
  });

  it('returns false on login page', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'myapp.example.com', pathname: '/login', href: 'https://myapp.example.com/login', origin: 'https://myapp.example.com' },
      writable: true,
      configurable: true,
    });
    expect(createScriptsMenu()).toBe(false);
    expect(state.menuCreated).toBe(false);
  });

  it('creates menu container and appends to body', () => {
    createScriptsMenu();
    expect(document.querySelector('.creatio-satelite-extension-container')).not.toBeNull();
  });

  it('creates one button and no separate actions button', () => {
    createScriptsMenu();
    expect(document.querySelectorAll('.creatio-satelite button.mat-flat-button').length).toBe(1);
    expect(document.querySelector('.scripts-menu-button')).not.toBeNull();
    expect(document.querySelector('.actions-button')).toBeNull();
  });

  it('race condition: concurrent calls produce exactly one menu', () => {
    // Simulate two rapid concurrent calls before first completes
    createScriptsMenu();
    createScriptsMenu();

    const containers = document.querySelectorAll('.creatio-satelite-extension-container');
    expect(containers.length).toBe(1);
  });

  it('sets state.menuCreated immediately to block re-entry', () => {
    // The flag must be true right after the first call returns
    createScriptsMenu();
    expect(state.menuCreated).toBe(true);

    // Second call must be a no-op
    const result = createScriptsMenu();
    expect(result).toBe(false);
  });

  function menu() {
    return {
      btn: document.querySelector('.scripts-menu-button'),
      navMenu: document.querySelector('.scripts-menu-container'),
    };
  }
  const markers = el => [...el.querySelectorAll('[data-item-marker]')].map(b => b.getAttribute('data-item-marker'));

  it('builds one menu and no separate actions menu', () => {
    createScriptsMenu();
    expect(document.querySelectorAll('.scripts-menu-container')).toHaveLength(1);
    expect(document.querySelector('.actions-menu-container')).toBeNull();
  });

  it('a click on the button opens the menu with the actions between Configuration and Settings', () => {
    createScriptsMenu();
    const { btn, navMenu } = menu();
    btn.click();
    expect(navMenu.classList.contains('visible')).toBe(true);
    const all = markers(navMenu);
    expect(all.indexOf('RestartApp')).toBe(all.indexOf('Configuration') + 1);
    expect(all.indexOf('FlushRedisDB')).toBe(all.indexOf('RestartApp') + 1);
    expect(all[all.length - 1]).toBe('Settings');
    const section = navMenu.querySelector('.csl-actions-section');
    expect(section.getAttribute('role')).toBe('group');
    expect(markers(section)).toEqual(['RestartApp', 'FlushRedisDB']);
  });

  it('adds the autologin item to the actions when a profile logged in to this site', async () => {
    await new Promise(r => chrome.storage.sync.set({
      lastLoginProfiles: { 'https://myapp.example.com': 'Supervisor' },
      userProfiles: [{ username: 'Supervisor', autologin: true }],
    }, r));
    createScriptsMenu();
    const { btn, navMenu } = menu();
    btn.click();
    expect(markers(navMenu.querySelector('.csl-actions-section'))).toEqual(['RestartApp', 'FlushRedisDB', 'DisableAutologin']);
    btn.click();
    btn.click();   // opened again: the actions are rebuilt, not added twice
    expect(markers(navMenu.querySelector('.csl-actions-section'))).toEqual(['RestartApp', 'FlushRedisDB', 'DisableAutologin']);
  });

  it('a second click on the button closes the menu', () => {
    createScriptsMenu();
    const { btn, navMenu } = menu();
    btn.click();
    btn.click();
    expect(navMenu.classList.contains('hidden')).toBe(true);
  });

  it('picking a navigation item or an action closes the menu', () => {
    createScriptsMenu();
    const { btn, navMenu } = menu();
    btn.click();
    navMenu.querySelector('[data-item-marker="Users"]').click();
    expect(navMenu.classList.contains('hidden')).toBe(true);

    btn.click();
    navMenu.querySelector('[data-item-marker="RestartApp"]').click();
    expect(navMenu.classList.contains('hidden')).toBe(true);
  });

  it('a click inside the menu, not on an item, keeps it open', () => {
    createScriptsMenu();
    const { btn, navMenu } = menu();
    btn.click();
    navMenu.querySelector('.csl-actions-section').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(navMenu.classList.contains('visible')).toBe(true);
  });

  it('a click on the page closes the menu opened by the button', () => {
    createScriptsMenu();
    const { btn, navMenu } = menu();
    btn.click();
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(navMenu.classList.contains('hidden')).toBe(true);
  });

  function dockedMenu() {
    chrome.storage.local.get.mockImplementation((keys, cb) => cb(
      String(keys).startsWith('menuEdgeBlob_') ? { [keys[0]]: { edge: 'left', along: 0.5, timestamp: Date.now() } } : {}
    ));
    createScriptsMenu();
    return {
      hit: document.querySelector('.csl-edge-hit'),
      navMenu: document.querySelector('.scripts-menu-container'),
    };
  }

  it('a click on the docked blob opens the menu with the actions in it', () => {
    const { hit, navMenu } = dockedMenu();
    expect(document.querySelector('.creatio-satelite-floating').getAttribute('data-edge-docked')).toBe('left');
    hit.dispatchEvent(new MouseEvent('mousedown', { clientX: 5, clientY: 400, bubbles: true }));
    hit.dispatchEvent(new MouseEvent('mouseup', { clientX: 5, clientY: 400, bubbles: true }));
    hit.dispatchEvent(new MouseEvent('click', { clientX: 5, clientY: 400, bubbles: true }));
    vi.advanceTimersByTime(400);   // the menu opens once the buttons are out of the blob
    expect(navMenu.classList.contains('visible')).toBe(true);
    expect(markers(navMenu)).toContain('FlushRedisDB');
  });

  it('resting the mouse on the docked blob also opens the menu', () => {
    const { hit, navMenu } = dockedMenu();
    hit.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(2000 + 400);
    expect(navMenu.classList.contains('visible')).toBe(true);
  });

  it('a click on the page closes the menu opened from the blob', () => {
    const { hit, navMenu } = dockedMenu();
    hit.dispatchEvent(new MouseEvent('mousedown', { clientX: 5, clientY: 400, bubbles: true }));
    hit.dispatchEvent(new MouseEvent('mouseup', { clientX: 5, clientY: 400, bubbles: true }));
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(navMenu.classList.contains('visible')).toBe(false);
  });

  it('shows App Hub as the caption of Application_Managment while keeping the script file name', () => {
    createScriptsMenu();
    const item = document.querySelector('[data-item-marker="Application_Managment"] .caption');
    expect(item.textContent.trim()).toBe('App Hub');
  });

  it('renders duotone SVG icons inline for menu items and the button', () => {
    createScriptsMenu();
    for (const sel of ['[data-item-marker="Users"] mat-icon', '.scripts-menu-button']) {
      const svg = document.querySelector(`${sel} svg`);
      expect(svg, sel).not.toBeNull();
      expect(svg.innerHTML).toContain('var(--csl-icon-accent');
    }
    expect(document.querySelector('.creatio-satelite-extension-container img')).toBeNull();
  });

  it('mounts the container outside <body> so an inert body does not block the buttons', () => {
    document.body.inert = true;
    createScriptsMenu();
    const ec = document.querySelector('.creatio-satelite-extension-container');
    expect(ec.parentElement).toBe(document.documentElement);
    expect(document.body.contains(ec)).toBe(false);
    expect(ec.closest('[inert]')).toBeNull();
    document.body.inert = false;
  });

  it('resets state if DOM creation throws', () => {
    // Make appendChild throw
    const original = document.documentElement.appendChild.bind(document.documentElement);
    document.documentElement.appendChild = () => { throw new Error('DOM error'); };

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = createScriptsMenu();

    expect(result).toBe(false);
    expect(state.menuCreated).toBe(false);

    document.documentElement.appendChild = original;
    consoleSpy.mockRestore();
  });
});

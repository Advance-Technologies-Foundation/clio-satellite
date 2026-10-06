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

  it('creates navigation and actions buttons', () => {
    createScriptsMenu();
    expect(document.querySelector('.scripts-menu-button')).not.toBeNull();
    expect(document.querySelector('.actions-button')).not.toBeNull();
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

  it('clicking nav button twice toggles menu closed', () => {
    createScriptsMenu();
    const btn = document.querySelector('.scripts-menu-button');
    const menu = document.querySelector('.scripts-menu-container');

    btn.click();
    expect(menu.classList.contains('visible')).toBe(true);

    btn.click();
    expect(menu.classList.contains('visible')).toBe(false);
    expect(menu.classList.contains('hidden')).toBe(true);
  });

  it('clicking actions button twice toggles menu closed', () => {
    createScriptsMenu();
    const btn = document.querySelector('.actions-button');
    const menu = document.querySelector('.actions-menu-container');

    btn.click();
    expect(menu.classList.contains('visible')).toBe(true);

    btn.click();
    expect(menu.classList.contains('visible')).toBe(false);
    expect(menu.classList.contains('hidden')).toBe(true);
  });

  it('opening nav menu closes actions menu', () => {
    createScriptsMenu();
    const navBtn = document.querySelector('.scripts-menu-button');
    const actBtn = document.querySelector('.actions-button');
    const navMenu = document.querySelector('.scripts-menu-container');
    const actMenu = document.querySelector('.actions-menu-container');

    actBtn.click();
    expect(actMenu.classList.contains('visible')).toBe(true);

    navBtn.click();
    expect(navMenu.classList.contains('visible')).toBe(true);
    expect(actMenu.classList.contains('hidden')).toBe(true);
  });

  it('opening actions menu closes nav menu', () => {
    createScriptsMenu();
    const navBtn = document.querySelector('.scripts-menu-button');
    const actBtn = document.querySelector('.actions-button');
    const navMenu = document.querySelector('.scripts-menu-container');
    const actMenu = document.querySelector('.actions-menu-container');

    navBtn.click();
    expect(navMenu.classList.contains('visible')).toBe(true);

    actBtn.click();
    expect(actMenu.classList.contains('visible')).toBe(true);
    expect(navMenu.classList.contains('hidden')).toBe(true);
  });

  it('shows the corrected caption for Application management while keeping the script file name', () => {
    createScriptsMenu();
    const item = document.querySelector('[data-item-marker="Application_Managment"] .caption');
    expect(item.textContent.trim()).toBe('Application management');
  });

  it('gives the icon-only actions button an accessible name and tooltip', () => {
    createScriptsMenu();
    const actBtn = document.querySelector('.actions-button');
    expect(actBtn.getAttribute('aria-label')).toBe('Quick actions');
    expect(actBtn.title).toBe('Quick actions');
  });

  it('renders duotone SVG icons inline for menu items and both buttons', () => {
    createScriptsMenu();
    for (const sel of ['[data-item-marker="Users"] mat-icon', '.scripts-menu-button', '.actions-button']) {
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

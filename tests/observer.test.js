import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../src/pageDetection.js', () => ({
  getCreatioPageType: vi.fn(() => 'shell'),
  isShellPage: vi.fn(() => true),
}));

vi.mock('../src/menuBuilder.js', () => ({
  createScriptsMenu: vi.fn(() => true),
}));

vi.mock('../src/positionManager.js', () => ({
  positionFloatingContainerRelativeToSearch: vi.fn(),
  saveMenuPosition: vi.fn(),
  loadMenuPosition: vi.fn((_pt, cb) => cb(null, null)),
  applySavedPosition: vi.fn(() => true),
}));

import { checkCreatioPageAndCreateMenu, monitorButtons, setupObserver, initDebugHelper } from '../src/observer.js';
import { getCreatioPageType } from '../src/pageDetection.js';
import { createScriptsMenu } from '../src/menuBuilder.js';
import { positionFloatingContainerRelativeToSearch } from '../src/positionManager.js';
import { state, resetState } from '../src/state.js';

beforeEach(() => {
  resetState();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  delete window.creatioSatelliteDebug;
});

// ─── checkCreatioPageAndCreateMenu ────────────────────────────────────────────

describe('checkCreatioPageAndCreateMenu', () => {
  it('returns false and does not create menu on login page', () => {
    getCreatioPageType.mockReturnValue('login');
    expect(checkCreatioPageAndCreateMenu()).toBe(false);
    expect(createScriptsMenu).not.toHaveBeenCalled();
  });

  it('returns false on unrecognized page', () => {
    getCreatioPageType.mockReturnValue(null);
    expect(checkCreatioPageAndCreateMenu()).toBe(false);
    expect(createScriptsMenu).not.toHaveBeenCalled();
  });

  it('calls createScriptsMenu on shell page', () => {
    getCreatioPageType.mockReturnValue('shell');
    checkCreatioPageAndCreateMenu();
    expect(createScriptsMenu).toHaveBeenCalledOnce();
  });

  it('calls createScriptsMenu on configuration page', () => {
    getCreatioPageType.mockReturnValue('configuration');
    checkCreatioPageAndCreateMenu();
    expect(createScriptsMenu).toHaveBeenCalledOnce();
  });

  it('skips createScriptsMenu when menu already created', () => {
    getCreatioPageType.mockReturnValue('shell');
    state.menuCreated = true;
    checkCreatioPageAndCreateMenu();
    expect(createScriptsMenu).not.toHaveBeenCalled();
  });

  it('returns the result of createScriptsMenu', () => {
    getCreatioPageType.mockReturnValue('shell');
    createScriptsMenu.mockReturnValue(true);
    expect(checkCreatioPageAndCreateMenu()).toBe(true);
  });
});

// ─── monitorButtons ───────────────────────────────────────────────────────────

describe('monitorButtons — menuCreating guard', () => {
  it('does not tear down menu while it is being constructed', () => {
    getCreatioPageType.mockReturnValue('shell');
    state.menuCreating = true;
    document.body.innerHTML = ''; // no container — would normally trigger recreate

    monitorButtons();

    expect(createScriptsMenu).not.toHaveBeenCalled();
    expect(state.menuCreated).toBe(false); // resetState was NOT called
  });
});

describe('monitorButtons', () => {
  it('does nothing on login page', () => {
    getCreatioPageType.mockReturnValue('login');
    monitorButtons();
    expect(createScriptsMenu).not.toHaveBeenCalled();
  });

  it('does nothing on unrecognized page', () => {
    getCreatioPageType.mockReturnValue(null);
    monitorButtons();
    expect(createScriptsMenu).not.toHaveBeenCalled();
  });

  it('recreates menu when extension container is missing', () => {
    getCreatioPageType.mockReturnValue('shell');
    document.body.innerHTML = ''; // no extension container
    monitorButtons();
    expect(createScriptsMenu).toHaveBeenCalled();
  });

  it('resets state before recreating menu', () => {
    getCreatioPageType.mockReturnValue('shell');
    state.menuCreated = true;
    document.body.innerHTML = '';
    monitorButtons();
    // state is reset so createScriptsMenu sees menuCreated=false
    expect(state.menuCreated).toBe(false);
  });

  it('removes stale extension containers before recreating', () => {
    getCreatioPageType.mockReturnValue('shell');
    document.body.innerHTML = '<div class="creatio-satelite-extension-container"></div>';
    monitorButtons();
    // The stale one is removed before recreating
    expect(document.querySelectorAll('.creatio-satelite-extension-container').length).toBe(0);
  });

  it('repositions when search element not found on shell page', () => {
    getCreatioPageType.mockReturnValue('shell');

    // Full extension structure present
    document.body.innerHTML = `
      <div class="creatio-satelite-extension-container">
        <button class="scripts-menu-button"></button>
        <button class="actions-button"></button>
        <div class="creatio-satelite-floating"></div>
      </div>
    `;
    const fc = document.querySelector('.creatio-satelite-floating');
    monitorButtons();
    expect(positionFloatingContainerRelativeToSearch).toHaveBeenCalledWith(fc);
  });

  it('repositions when container has drifted from search element', () => {
    getCreatioPageType.mockReturnValue('shell');
    document.body.innerHTML = `
      <crt-global-search></crt-global-search>
      <div class="creatio-satelite-extension-container">
        <button class="scripts-menu-button"></button>
        <button class="actions-button"></button>
        <div class="creatio-satelite-floating"></div>
      </div>
    `;

    const search = document.querySelector('crt-global-search');
    const fc = document.querySelector('.creatio-satelite-floating');

    // Search at right=400, container at left=100 → gap is 280px (>50)
    search.getBoundingClientRect = () => ({ right: 400, width: 200, height: 40 });
    fc.getBoundingClientRect = () => ({ left: 100, width: 100, height: 40 });

    monitorButtons();
    expect(positionFloatingContainerRelativeToSearch).toHaveBeenCalledWith(fc);
  });

  it('does NOT reposition when container is correctly aligned', () => {
    getCreatioPageType.mockReturnValue('shell');
    document.body.innerHTML = `
      <crt-global-search></crt-global-search>
      <div class="creatio-satelite-extension-container">
        <button class="scripts-menu-button"></button>
        <button class="actions-button"></button>
        <div class="creatio-satelite-floating"></div>
      </div>
    `;

    const search = document.querySelector('crt-global-search');
    const fc = document.querySelector('.creatio-satelite-floating');

    // Search at right=400, container at left=420 → gap is exactly 20px (<50)
    search.getBoundingClientRect = () => ({ right: 400, width: 200, height: 40 });
    fc.getBoundingClientRect = () => ({ left: 420, width: 100, height: 40 });

    monitorButtons();
    expect(positionFloatingContainerRelativeToSearch).not.toHaveBeenCalled();
  });
});

// ─── setupObserver ────────────────────────────────────────────────────────────

describe('setupObserver', () => {
  it('returns a MutationObserver', () => {
    const obs = setupObserver();
    expect(obs).toBeInstanceOf(MutationObserver);
    obs.disconnect();
  });

  it('calls checkCreatioPageAndCreateMenu when >2 nodes are added', async () => {
    getCreatioPageType.mockReturnValue('shell');
    const obs = setupObserver();

    // Add 3 nodes at once to trigger shouldCheck
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createElement('div'));
    frag.appendChild(document.createElement('div'));
    frag.appendChild(document.createElement('div'));
    document.body.appendChild(frag);

    await vi.waitFor(() => expect(createScriptsMenu).toHaveBeenCalled());
    obs.disconnect();
  });

  it('triggers on .left-container appearance', async () => {
    getCreatioPageType.mockReturnValue('configuration');
    const obs = setupObserver();

    const el = document.createElement('div');
    el.className = 'left-container';
    document.body.appendChild(el);

    await vi.waitFor(() => expect(createScriptsMenu).toHaveBeenCalled());
    obs.disconnect();
  });

  it('does not create menu on login page mutations', async () => {
    getCreatioPageType.mockReturnValue('login');
    const obs = setupObserver();

    const frag = document.createDocumentFragment();
    for (let i = 0; i < 5; i++) frag.appendChild(document.createElement('div'));
    document.body.appendChild(frag);

    // Drain microtask queue so MutationObserver callback fires
    await Promise.resolve();
    await Promise.resolve();

    expect(createScriptsMenu).not.toHaveBeenCalled();
    obs.disconnect();
  });

  it('does not create menu when already created', async () => {
    getCreatioPageType.mockReturnValue('shell');
    state.menuCreated = true;
    const obs = setupObserver();

    const frag = document.createDocumentFragment();
    frag.appendChild(document.createElement('div'));
    frag.appendChild(document.createElement('div'));
    frag.appendChild(document.createElement('div'));
    document.body.appendChild(frag);

    await Promise.resolve();
    await Promise.resolve();

    expect(createScriptsMenu).not.toHaveBeenCalled();
    obs.disconnect();
  });
});

// ─── initDebugHelper ─────────────────────────────────────────────────────────

describe('initDebugHelper', () => {
  it('registers window.creatioSatelliteDebug', () => {
    initDebugHelper();
    expect(typeof window.creatioSatelliteDebug).toBe('function');
  });

  it('returns pageType and menuCreated in debug output', () => {
    getCreatioPageType.mockReturnValue('shell');
    state.menuCreated = true;
    initDebugHelper();

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const result = window.creatioSatelliteDebug();
    expect(result.pageType).toBe('shell');
    expect(result.menuCreated).toBe(true);
    consoleSpy.mockRestore();
  });
});

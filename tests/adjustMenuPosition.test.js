import { describe, it, expect, beforeEach } from 'vitest';
import { adjustMenuPosition, sideBySideLefts, placeMenusSideBySide } from '../src/menuVisibility.js';

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: 800, writable: true, configurable: true });
});

// Helper: create a button inside a .creatio-satelite-floating parent
function createFloatingButton(btnRect) {
  const floatingParent = document.createElement('div');
  floatingParent.className = 'creatio-satelite-floating';
  document.body.appendChild(floatingParent);

  const button = document.createElement('button');
  floatingParent.appendChild(button);
  button.getBoundingClientRect = () => btnRect;

  return button;
}

function createMenu(menuRect) {
  const ec = document.createElement('div');
  ec.className = 'creatio-satelite-extension-container';
  document.body.appendChild(ec);

  const menu = document.createElement('div');
  ec.appendChild(menu);
  menu.getBoundingClientRect = () => menuRect;

  return menu;
}

describe('adjustMenuPosition — inside floating container', () => {
  it('positions menu below button with 8px gap', () => {
    const button = createFloatingButton({ top: 100, bottom: 130, left: 200, right: 280, width: 80, height: 30 });
    const menu = createMenu({ right: 350, bottom: 200, width: 150, height: 70 });

    adjustMenuPosition(button, menu);

    expect(menu.style.top).toBe('138px');   // 130 + 8
    expect(menu.style.left).toBe('200px');
  });

  it('shifts left when menu would overflow right edge', () => {
    // Button near right edge: right=1250, menu width=150 → right would be 1400 > 1280
    const button = createFloatingButton({ top: 100, bottom: 130, left: 1200, right: 1250, width: 50, height: 30 });
    const menu = createMenu({ right: 1400, bottom: 200, width: 150, height: 70 });

    adjustMenuPosition(button, menu);

    // Should shift left: btnRight - menuWidth = 1250 - 150 = 1100
    expect(parseInt(menu.style.left)).toBe(1100);
  });

  it('shows menu above button when it would overflow bottom edge', () => {
    // Button near bottom: bottom=780, menu height=70 → bottom would be 858 > 800
    const button = createFloatingButton({ top: 750, bottom: 780, left: 200, right: 280, width: 80, height: 30 });
    const menu = createMenu({ right: 350, bottom: 858, width: 150, height: 70 });

    adjustMenuPosition(button, menu);

    // Should go above: top - menuHeight - 8 = 750 - 70 - 8 = 672
    expect(parseInt(menu.style.top)).toBe(672);
  });

  it('clamps overflow-left correction to 0 when menu is wider than viewport', () => {
    const button = createFloatingButton({ top: 100, bottom: 130, left: 10, right: 60, width: 50, height: 30 });
    // Menu wider than distance from btnRight to left edge: right=1400, width=1300
    const menu = createMenu({ right: 1400, bottom: 200, width: 1300, height: 70 });

    adjustMenuPosition(button, menu);

    expect(parseInt(menu.style.left)).toBeGreaterThanOrEqual(0);
  });

  it('moves menu to extension container if parent differs', () => {
    const button = createFloatingButton({ top: 100, bottom: 130, left: 200, right: 280, width: 80, height: 30 });
    const menu = createMenu({ right: 350, bottom: 200, width: 150, height: 70 });

    // Detach menu from extension container (simulate wrong parent)
    const otherParent = document.createElement('div');
    document.body.appendChild(otherParent);
    otherParent.appendChild(menu);

    adjustMenuPosition(button, menu);

    const ec = document.querySelector('.creatio-satelite-extension-container');
    expect(ec.contains(menu)).toBe(true);
  });

  it('makes menu visible after reflow calculation', () => {
    const button = createFloatingButton({ top: 100, bottom: 130, left: 200, right: 280, width: 80, height: 30 });
    const menu = createMenu({ right: 350, bottom: 200, width: 150, height: 70 });

    adjustMenuPosition(button, menu);

    expect(menu.style.visibility).toBe('visible');
  });
});

describe('sideBySideLefts — both menus open at once', () => {
  it('moves the second menu right of the first when they would overlap', () => {
    // the navigation menu is wider than its button and would cover the actions menu
    expect(sideBySideLefts({ left: 8, width: 220 }, { left: 158, width: 200 }, 1280))
      .toEqual({ first: 8, second: 236 });
  });

  it('keeps menus that do not overlap where they are', () => {
    expect(sideBySideLefts({ left: 8, width: 100 }, { left: 158, width: 200 }, 1280))
      .toEqual({ first: 8, second: 158 });
  });

  it('shifts the pair left at the right screen edge', () => {
    expect(sideBySideLefts({ left: 1000, width: 220 }, { left: 1150, width: 200 }, 1280))
      .toEqual({ first: 844, second: 1072 });
  });

  it('keeps the first menu on screen when the pair is wider than the screen', () => {
    expect(sideBySideLefts({ left: 100, width: 300 }, { left: 150, width: 300 }, 500))
      .toEqual({ first: 8, second: 316 });
  });
});

describe('placeMenusSideBySide', () => {
  it('places two menus under their buttons without overlap', () => {
    const navBtn = createFloatingButton({ left: 8, top: 300, right: 158, bottom: 334, width: 150, height: 34 });
    const actBtn = createFloatingButton({ left: 166, top: 300, right: 213, bottom: 334, width: 47, height: 34 });
    const nav = createMenu({ left: 8, top: 342, right: 228, bottom: 600, width: 220, height: 258 });
    const act = createMenu({ left: 166, top: 342, right: 366, bottom: 500, width: 200, height: 158 });
    placeMenusSideBySide(navBtn, nav, actBtn, act);
    expect(nav.style.left).toBe('8px');
    expect(act.style.left).toBe('236px');
    expect(nav.style.top).toBe('342px');
    expect(act.style.top).toBe('342px');
  });
});

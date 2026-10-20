import { describe, it, expect } from 'vitest';
import { showMenuContainer, hideMenuContainer, adjustMenuPosition, menuPositionAtEdge } from '../src/menuVisibility.js';

function createContainer() {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

describe('hideMenuContainer', () => {
  it('adds hidden class and removes visible', () => {
    const el = createContainer();
    el.classList.add('visible');
    hideMenuContainer(el);
    expect(el.classList.contains('hidden')).toBe(true);
    expect(el.classList.contains('visible')).toBe(false);
  });

  it('does nothing when called with null', () => {
    expect(() => hideMenuContainer(null)).not.toThrow();
  });
});

describe('showMenuContainer', () => {
  it('adds visible class and removes hidden', () => {
    const el = createContainer();
    el.classList.add('hidden');
    showMenuContainer(el);
    expect(el.classList.contains('visible')).toBe(true);
    expect(el.classList.contains('hidden')).toBe(false);
  });

  it('does nothing when called with null', () => {
    expect(() => showMenuContainer(null)).not.toThrow();
  });
});

describe('adjustMenuPosition — standard (no floating parent)', () => {
  it('positions container below the button with 8px gap', () => {
    const button = createContainer();
    button.style.cssText = 'position: fixed; top: 100px; left: 50px; width: 80px; height: 30px;';

    // Mock getBoundingClientRect
    button.getBoundingClientRect = () => ({ top: 100, bottom: 130, left: 50, right: 130, width: 80, height: 30 });

    const container = createContainer();
    adjustMenuPosition(button, container);

    expect(container.style.top).toBe('138px'); // 130 + 8
    expect(container.style.left).toBe('50px');
  });
});

describe('menuPositionAtEdge', () => {
  const VW = 1280, VH = 720;
  const menu = { width: 400, height: 300 };

  it('opens beside a blob on a side edge, centred on it', () => {
    expect(menuPositionAtEdge('left', { left: 0, top: 310, width: 36, height: 100 }, menu, VW, VH)).toEqual({ left: 44, top: 210 });
    expect(menuPositionAtEdge('right', { left: 1244, top: 310, width: 36, height: 100 }, menu, VW, VH)).toEqual({ left: 836, top: 210 });
  });

  it('opens below a blob on the top edge and above one on the bottom edge', () => {
    expect(menuPositionAtEdge('top', { left: 590, top: 0, width: 100, height: 36 }, menu, VW, VH)).toEqual({ left: 440, top: 44 });
    expect(menuPositionAtEdge('bottom', { left: 590, top: 684, width: 100, height: 36 }, menu, VW, VH)).toEqual({ left: 440, top: 376 });
  });

  it('stays on screen for a blob near a corner', () => {
    expect(menuPositionAtEdge('left', { left: 0, top: 650, width: 36, height: 100 }, menu, VW, VH).top).toBe(VH - 300 - 8);
    expect(menuPositionAtEdge('top', { left: 1200, top: 0, width: 100, height: 36 }, menu, VW, VH).left).toBe(VW - 400 - 8);
    expect(menuPositionAtEdge('bottom', { left: 0, top: 684, width: 100, height: 36 }, menu, VW, VH).left).toBe(8);
  });
});

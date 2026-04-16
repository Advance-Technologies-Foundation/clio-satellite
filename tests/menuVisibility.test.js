import { describe, it, expect } from 'vitest';
import { showMenuContainer, hideMenuContainer, adjustMenuPosition } from '../src/menuVisibility.js';

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

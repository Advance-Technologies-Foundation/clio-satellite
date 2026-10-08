import { describe, it, expect, vi, beforeEach } from 'vitest';

// Developer news are optional: a failure inside them must not mark the menu as failed
vi.mock('../src/news/shellIndicator.js', () => ({
  attachShellNews: vi.fn(() => { throw new Error('news broke'); }),
}));

import { createScriptsMenu } from '../src/menuBuilder.js';
import { state, resetState } from '../src/state.js';

beforeEach(() => {
  resetState();
  Object.defineProperty(window, 'location', {
    value: { hostname: 'myapp.example.com', pathname: '/app', href: 'https://myapp.example.com/shell/', origin: 'https://myapp.example.com' },
    writable: true,
    configurable: true,
  });
  document.body.innerHTML = '<crt-app-toolbar></crt-app-toolbar>';
  chrome.storage.local.get.mockImplementation((_keys, cb) => cb({}));
});

describe('menu and developer news', () => {
  it('builds the menu even when the news indicator throws', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(createScriptsMenu()).toBe(true);
    expect(state.actionsMenuCreated).toBe(true);
    expect(document.querySelector('.scripts-menu-button')).not.toBeNull();
    expect(errors).toHaveBeenCalledWith('[Clio Satellite] Developer news failed:', expect.any(Error));
    errors.mockRestore();
  });
});

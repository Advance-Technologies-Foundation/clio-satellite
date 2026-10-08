import { describe, it, expect } from 'vitest';
import { loadState } from '../../src/news/newsStore.js';

describe('newsStore.loadState', () => {
  it('news are on by default', async () => {
    expect((await loadState()).enabled).toBe(true);
  });

  it('news are off after the user turns them off in Options', async () => {
    await new Promise(resolve => chrome.storage.sync.set({ newsEnabled: false }, resolve));
    expect((await loadState()).enabled).toBe(false);
  });
});

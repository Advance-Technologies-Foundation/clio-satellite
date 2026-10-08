import { describe, it, expect } from 'vitest';
import { loadState } from '../../src/news/newsStore.js';

describe('newsStore.loadState', () => {
  it('news are off until the user turns them on in Options', async () => {
    expect((await loadState()).enabled).toBe(false);
  });

  it('news are on only after an explicit opt-in', async () => {
    await new Promise(resolve => chrome.storage.sync.set({ newsEnabled: true }, resolve));
    expect((await loadState()).enabled).toBe(true);
  });
});

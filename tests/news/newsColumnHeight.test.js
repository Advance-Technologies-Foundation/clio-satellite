import { describe, it, expect } from 'vitest';
import { newsListMaxHeight, NEWS_MAX_SHARE } from '../../src/news/shellIndicator.js';

describe('newsListMaxHeight', () => {
  it('lets the column reach 80% of the window height', () => {
    expect(NEWS_MAX_SHARE).toBe(0.8);
    expect(newsListMaxHeight({ viewportHeight: 1000, columnTop: 80, chromeHeight: 90 })).toBe(800 - 90);
  });

  it('stops at the bottom edge of the window when the column starts low', () => {
    expect(newsListMaxHeight({ viewportHeight: 1000, columnTop: 400, chromeHeight: 90 })).toBe(1000 - 400 - 16 - 90);
  });

  it('keeps room for at least one card on tiny windows', () => {
    expect(newsListMaxHeight({ viewportHeight: 300, columnTop: 250, chromeHeight: 90 })).toBe(120);
  });
});

import { describe, it, expect } from 'vitest';
import { flyoutListMaxHeight, FLYOUT_MAX_SHARE } from '../../src/news/shellIndicator.js';

describe('flyoutListMaxHeight', () => {
  it('lets the flyout reach 80% of the window height', () => {
    expect(FLYOUT_MAX_SHARE).toBe(0.8);
    expect(flyoutListMaxHeight({ viewportHeight: 1000, flyoutTop: 80, chromeHeight: 90 })).toBe(800 - 90);
  });

  it('stops at the bottom edge of the window when the flyout starts low', () => {
    expect(flyoutListMaxHeight({ viewportHeight: 1000, flyoutTop: 400, chromeHeight: 90 })).toBe(1000 - 400 - 16 - 90);
  });

  it('keeps room for at least one card on tiny windows', () => {
    expect(flyoutListMaxHeight({ viewportHeight: 300, flyoutTop: 250, chromeHeight: 90 })).toBe(120);
  });
});

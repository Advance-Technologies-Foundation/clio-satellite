import { describe, it, expect, vi } from 'vitest';
import { getIconUrl, renderIcon } from '../src/icons.js';

const SVG = '<svg data-fallback="1"></svg>';

describe('getIconUrl', () => {
  it('resolves files inside icons/ui/ through chrome.runtime.getURL', () => {
    expect(getIconUrl('users.png')).toBe('chrome-extension://test-id/icons/ui/users.png');
  });

  it('returns null when the extension context is gone', () => {
    const original = chrome.runtime.getURL;
    chrome.runtime.getURL = vi.fn(() => { throw new Error('Extension context invalidated.'); });
    expect(getIconUrl('users.png')).toBeNull();
    chrome.runtime.getURL = original;
  });

  it('returns null without a file name', () => {
    expect(getIconUrl(undefined)).toBeNull();
  });
});

describe('renderIcon', () => {
  it('renders an img for the raster icon', () => {
    const el = document.createElement('span');
    renderIcon(el, 'users.png', SVG);
    const img = el.querySelector('img.creatio-satelite-icon');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('chrome-extension://test-id/icons/ui/users.png');
    expect(img.getAttribute('alt')).toBe('');
  });

  it('falls back to the inline SVG when no URL can be resolved', () => {
    const el = document.createElement('span');
    renderIcon(el, undefined, SVG);
    expect(el.querySelector('svg[data-fallback]')).not.toBeNull();
  });

  it('falls back to the inline SVG when the image fails to load', () => {
    const el = document.createElement('span');
    renderIcon(el, 'missing.png', SVG);
    el.querySelector('img').dispatchEvent(new Event('error'));
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('svg[data-fallback]')).not.toBeNull();
  });
});

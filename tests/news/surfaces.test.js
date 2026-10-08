import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initLoginNews, _resetLoginNews } from '../../src/news/loginStrip.js';
import { attachShellNews, _resetShellNews } from '../../src/news/shellIndicator.js';

const day = n => new Date(Date.now() + n * 24 * 3600 * 1000).toISOString();

function item(id, extra = {}) {
  return { id, type: 'release', title: `News ${id}`, body: `Body ${id}`, publishedAt: day(-1), expiresAt: day(20), ...extra };
}

let feedItems = [];
let sent = [];

function storeSync(data) {
  return new Promise(resolve => chrome.storage.sync.set(data, resolve));
}
function readSync(defaults) {
  return new Promise(resolve => chrome.storage.sync.get(defaults, resolve));
}
function readLocal(keys) {
  return new Promise(resolve => chrome.storage.local.get(keys, resolve));
}

beforeEach(async () => {
  // News are on by default; tests set newsEnabled explicitly to cover both states
  await storeSync({ newsEnabled: true });
  _resetLoginNews();
  _resetShellNews();
  sent = [];
  feedItems = [item('a', { audiences: ['developer'] }), item('b', { audiences: ['admin'], type: 'tip' })];
  chrome.runtime.sendMessage.mockImplementation((message, callback) => {
    sent.push(message);
    if (message.action === 'getNews') {
      callback?.({ ok: true, raw: JSON.stringify({ schemaVersion: 1, items: feedItems }) });
    } else {
      callback?.({ ok: false });
    }
  });
  document.querySelectorAll('.csl-news-video').forEach(n => n.remove());
});

async function mountLogin() {
  const row = document.createElement('div');
  row.className = 'creatio-satelite-login-profiles-container';
  row.style.width = '300px';
  document.body.appendChild(row);
  await initLoginNews();
  return document.querySelector('.csl-news');
}

describe('first run', () => {
  it('a new user sees only the 3 newest news of the last month; later news flow normally', async () => {
    feedItems = [
      item('n1', { publishedAt: day(-1) }), item('n2', { publishedAt: day(-2) }), item('n3', { publishedAt: day(-3) }),
      item('n4', { publishedAt: day(-4) }), item('old', { publishedAt: day(-40) }),
    ];
    const root = await mountLogin();
    expect(root.querySelector('.csl-news-strip__count').textContent).toBe('3 new');
    const { newsSkipped, newsOnboardedAt } = await readSync({ newsSkipped: {}, newsOnboardedAt: 0 });
    expect(Object.keys(newsSkipped).sort()).toEqual(['n4', 'old']);
    expect(newsOnboardedAt).toBeGreaterThan(0);
  });

  it('does not skip anything once the user is onboarded', async () => {
    await storeSync({ newsOnboardedAt: 1 });
    feedItems = [item('n1'), item('n2'), item('n3'), item('n4')];
    const root = await mountLogin();
    expect(root.querySelector('.csl-news-strip__count').textContent).toBe('4 new');
  });
});

describe('login news strip', () => {
  it('shows the count and the newest headline under the profile row', async () => {
    const root = await mountLogin();
    expect(root.hidden).toBe(false);
    expect(root.previousElementSibling.className).toBe('creatio-satelite-login-profiles-container');
    expect(root.style.width).toBe('300px');
    expect(root.querySelector('.csl-news-strip__count').textContent).toBe('2 new');
    expect(root.classList.contains('csl-news--unread')).toBe(true);
    expect(root.querySelector('.csl-news-panel').hidden).toBe(true);
  });

  it('opens the list on click and marks it read when closed', async () => {
    const root = await mountLogin();
    root.querySelector('.csl-news-strip').click();
    await vi.waitFor(() => expect(root.querySelectorAll('.csl-news-card')).toHaveLength(2));
    expect(root.querySelector('.csl-news-panel').hidden).toBe(false);
    root.querySelector('.csl-news-strip').click();
    await vi.waitFor(async () => {
      const { newsRead } = await readSync({ newsRead: {} });
      expect(Object.keys(newsRead).sort()).toEqual(['a', 'b']);
    });
  });

  it('renders feed text as text, never as HTML', async () => {
    feedItems = [item('x', { title: '<img src=x onerror=alert(1)>' })];
    const root = await mountLogin();
    root.querySelector('.csl-news-strip').click();
    await vi.waitFor(() => expect(root.querySelector('.csl-news-card__title')).not.toBeNull());
    expect(root.querySelector('.csl-news-card__title').textContent).toBe('<img src=x onerror=alert(1)>');
    expect(root.querySelector('.csl-news-card img')).toBeNull();
  });

  it('stays hidden when everything is read', async () => {
    await storeSync({ newsRead: { a: 1, b: 1 } });
    const root = await mountLogin();
    expect(root.hidden).toBe(true);
  });

  it('stays until reload after the list is read and collapsed, without a count', async () => {
    const root = await mountLogin();
    root.querySelector('.csl-news-strip').click();
    await vi.waitFor(() => expect(root.querySelector('.csl-news-panel').hidden).toBe(false));
    root.querySelector('.csl-news-strip').click();
    await vi.waitFor(() => expect(root.classList.contains('csl-news--unread')).toBe(false));
    expect(root.hidden).toBe(false);
    expect(root.querySelector('.csl-news-strip__count').textContent).toBe('');
    expect(root.querySelector('.csl-news-strip__headline').textContent).toMatch(/^What's new · /);
  });

  it('is gone on the next page load once everything is read', async () => {
    const first = await mountLogin();
    first.querySelector('.csl-news-panel__head .csl-news-linkbtn').click();
    await vi.waitFor(async () => expect(Object.keys((await readSync({ newsRead: {} })).newsRead)).toHaveLength(2));
    expect(first.hidden).toBe(false);
    first.remove();
    document.querySelector('.creatio-satelite-login-profiles-container')?.remove();
    _resetLoginNews();
    const root = await mountLogin();
    expect(root.hidden).toBe(true);
  });

  it('filters by the roles chosen in Options', async () => {
    await storeSync({ newsAudiences: ['admin'] });
    const root = await mountLogin();
    expect(root.querySelector('.csl-news-strip__count').textContent).toBe('1 new');
    expect(root.querySelector('.csl-news-strip__headline').textContent).toBe('News b');
  });

  it('stays hidden when news are turned off', async () => {
    await storeSync({ newsEnabled: false });
    const root = await mountLogin();
    expect(root.hidden).toBe(true);
  });

  it('auto-expands a critical item once', async () => {
    feedItems = [item('c', { type: 'breaking', priority: 'critical' })];
    const root = await mountLogin();
    expect(root.classList.contains('csl-news--critical')).toBe(true);
    expect(root.querySelector('.csl-news-panel').hidden).toBe(false);
    await vi.waitFor(async () => expect((await readSync({ newsAutoOpened: {} })).newsAutoOpened.c).toBe(true));
  });

  it('records when an item was first shown (starts its trending window)', async () => {
    feedItems = [item('t', { trending: { hours: 24 } })];
    await mountLogin();
    await vi.waitFor(async () => expect((await readSync({ newsFirstShown: {} })).newsFirstShown.t).toBeGreaterThan(0));
  });

  it('opens the built-in player for an embedded YouTube video', async () => {
    feedItems = [item('v', { media: { type: 'youtube', videoId: 'dQw4w9WgXcQ', title: 'Demo' } })];
    const root = await mountLogin();
    root.querySelector('.csl-news-strip').click();
    await vi.waitFor(() => expect(root.querySelector('.csl-news-media--video')).not.toBeNull());
    root.querySelector('.csl-news-media--video').click();
    const iframe = document.querySelector('.csl-news-video iframe');
    expect(iframe.src).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.querySelector('.csl-news-video')).toBeNull();
  });

  it('asks the background for images instead of loading them in the page', async () => {
    const url = 'https://advance-technologies-foundation.github.io/clio-news-feed/v1/media/2026/10/a.webp';
    feedItems = [item('i', { media: { type: 'image', url, alt: 'Screenshot' } })];
    const root = await mountLogin();
    root.querySelector('.csl-news-strip').click();
    await vi.waitFor(() => expect(sent.some(m => m.action === 'getNewsMedia' && m.url === url)).toBe(true));
    // the background refused it in this test, so the image is dropped
    await vi.waitFor(() => expect(root.querySelector('.csl-news-media--image')).toBeNull());
  });
});

function mountShell(pageType = 'shell') {
  const host = document.createElement('div');
  host.className = 'creatio-satelite-extension-container';
  const buttonWrapper = document.createElement('div');
  buttonWrapper.className = 'creatio-satelite';
  const menuButton = document.createElement('button');
  menuButton.className = 'scripts-menu-button';
  buttonWrapper.appendChild(menuButton);
  const menuContainer = document.createElement('div');
  menuContainer.className = 'scripts-menu-container hidden';
  menuContainer.appendChild(document.createElement('div'));
  host.append(buttonWrapper, menuContainer);
  document.documentElement.appendChild(host);
  return { host, buttonWrapper, menuButton, menuContainer, done: attachShellNews({ menuButton, menuContainer, buttonWrapper, pageType }) };
}

describe('shell news indicator', () => {
  it('shows a dot on the button and a What\'s new row at the top of the menu', async () => {
    const { buttonWrapper, menuButton, menuContainer, done } = mountShell();
    await done;
    expect(buttonWrapper.querySelector('.csl-news-dot').hidden).toBe(false);
    expect(menuButton.getAttribute('aria-label')).toBe('Clio satellite, 2 unread news');
    const row = menuContainer.firstElementChild;
    expect(row.className).toBe('csl-news-row');
    expect(row.hidden).toBe(false);
    expect(row.querySelector('.csl-news-pill').textContent).toBe('2');
  });

  it('opening the menu clears the dot; the count stays until the flyout is read', async () => {
    const { buttonWrapper, menuContainer, done } = mountShell();
    await done;
    menuContainer.classList.replace('hidden', 'visible');
    await vi.waitFor(() => expect(buttonWrapper.querySelector('.csl-news-dot').hidden).toBe(true));
    expect(menuContainer.querySelector('.csl-news-row').hidden).toBe(false);

    menuContainer.querySelector('.csl-news-row').click();
    await vi.waitFor(() => expect(menuContainer.querySelectorAll('.csl-news-flyout .csl-news-card')).toHaveLength(2));
    menuContainer.classList.replace('visible', 'hidden');
    await vi.waitFor(async () => {
      const { newsRead } = await readSync({ newsRead: {} });
      expect(Object.keys(newsRead).sort()).toEqual(['a', 'b']);
    });
    // The row stays until reload, without a count
    await vi.waitFor(() => expect(menuContainer.querySelector('.csl-news-pill').hidden).toBe(true));
    expect(menuContainer.querySelector('.csl-news-row').hidden).toBe(false);
  });

  it('counts the Shell load for the dot decay once per page', async () => {
    const { done } = mountShell();
    await done;
    await vi.waitFor(async () => {
      const { newsNoticed } = await readLocal(['newsNoticed']);
      expect(newsNoticed.a.shellLoads).toBe(1);
    });
  });

  it('peeks a critical item once in Shell', async () => {
    feedItems = [item('c', { type: 'breaking', priority: 'critical' })];
    const { host, done } = mountShell();
    await done;
    expect(host.querySelector('.csl-news-peek')).not.toBeNull();
    expect(host.querySelector('.csl-news-peek').getAttribute('role')).toBe('status');
    await vi.waitFor(async () => expect((await readSync({ newsAutoOpened: {} })).newsAutoOpened.c).toBe(true));
  });

  it('does not peek on the Configuration page', async () => {
    feedItems = [item('c', { type: 'breaking', priority: 'critical' })];
    const { host, done } = mountShell('configuration');
    await done;
    expect(host.querySelector('.csl-news-peek')).toBeNull();
  });

  it('adds nothing to the menu when everything is read', async () => {
    await storeSync({ newsRead: { a: 1, b: 1 } });
    const { buttonWrapper, menuContainer, done } = mountShell();
    await done;
    expect(buttonWrapper.querySelector('.csl-news-dot').hidden).toBe(true);
    expect(menuContainer.querySelector('.csl-news-row').hidden).toBe(true);
    expect(menuContainer.querySelector('.csl-news-row-sep').hidden).toBe(true);
    expect(menuContainer.querySelector('.csl-news-all')).toBeNull();
  });

  it('shows nothing when the feed is unavailable', async () => {
    chrome.runtime.sendMessage.mockImplementation((m, cb) => cb?.({ ok: false }));
    const { buttonWrapper, menuContainer, done } = mountShell();
    await done;
    expect(buttonWrapper.querySelector('.csl-news-dot').hidden).toBe(true);
    expect(menuContainer.querySelector('.csl-news-row').hidden).toBe(true);
  });
});

import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupChromeMock, injectContentScript, waitForMenu } from './helpers.js';

const BASE = 'http://localhost:3737';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = f => readFileSync(path.join(ROOT, f), 'utf8');
const day = n => new Date(Date.now() + n * 24 * 3600 * 1000).toISOString();

const PROFILES = [{ alias: 'Admin', username: 'Supervisor', password: 'test', url: '', autologin: false }];

function feed(items) {
  return { schemaVersion: 1, channel: 'clio-satellite', items };
}

function item(id, extra = {}) {
  return {
    id,
    type: 'release',
    title: `Deploy packages faster ${id}`,
    body: 'pushw now uploads only the packages that changed.',
    cta: { label: 'Read release notes', url: 'https://github.com/Advance-Technologies-Foundation/clio' },
    publishedAt: day(-1),
    expiresAt: day(20),
    ...extra,
  };
}

const TWO = feed([item('a', { audiences: ['developer'] }), item('b', { type: 'tip', audiences: ['admin'] })]);

// News are on by default; tests that cover the turned-off state set newsEnabled: false
async function loadLogin(page, { newsFeed = TWO, syncData = {} } = {}) {
  await setupChromeMock(page, { syncData: { newsEnabled: true, userProfiles: PROFILES, ...syncData }, newsFeed });
  await page.goto(`${BASE}/login/`);
  await page.addStyleTag({ content: read('styles/login.css') });
  await page.addStyleTag({ content: read('styles/news.css') });
  await page.addScriptTag({ content: read('login/login-events.js') });
  await page.addScriptTag({ content: read('login/login.js') });
  await injectContentScript(page);
  await page.waitForSelector('.creatio-satelite-login-profiles-container');
}

async function loadShell(page, { newsFeed = TWO, syncData = { newsEnabled: true } } = {}) {
  await setupChromeMock(page, { syncData, newsFeed });
  await page.goto(`${BASE}/shell/`);
  for (const css of ['styles/shell.css', 'menu-item.css', 'styles/news.css']) {
    await page.addStyleTag({ content: read(css) });
  }
  await injectContentScript(page);
  await waitForMenu(page);
}

test.describe('Developer news on the login page', () => {
  test('strip sits under the profile row, as wide as it, 32 px high', async ({ page }) => {
    await loadLogin(page);
    const strip = page.locator('.csl-news-strip');
    await expect(strip).toBeVisible();
    await expect(page.locator('.csl-news-strip__count')).toHaveText('2 new');
    const row = await page.locator('.creatio-satelite-login-profiles-container').boundingBox();
    const box = await strip.boundingBox();
    expect(Math.round(box.width)).toBe(Math.round(row.width));
    expect(Math.round(box.height)).toBe(32);
    expect(box.y).toBeGreaterThan(row.y + row.height);
  });

  test('opens the list, shows cards, and marks them read after closing', async ({ page }) => {
    await loadLogin(page);
    await page.locator('.csl-news-strip').click();
    await expect(page.locator('.csl-news-card')).toHaveCount(2);
    await expect(page.locator('.csl-news-card__cta').first()).toHaveAttribute('target', '_blank');
    await page.locator('.csl-news-strip').click();
    await expect(page.locator('.csl-news-panel')).toBeHidden();
    // Read, but the strip stays until the page reloads
    await expect(page.locator('.csl-news-strip__count')).toHaveText('');
    await expect(page.locator('.csl-news-strip__headline')).toHaveText(/^What's new · /);
  });

  test('news are shown by default, when the user never touched the switch', async ({ page }) => {
    await setupChromeMock(page, { syncData: { userProfiles: PROFILES }, newsFeed: TWO });
    await page.goto(`${BASE}/login/`);
    await page.addStyleTag({ content: read('styles/news.css') });
    await page.addScriptTag({ content: read('login/login-events.js') });
    await page.addScriptTag({ content: read('login/login.js') });
    await injectContentScript(page);
    await page.waitForSelector('.creatio-satelite-login-profiles-container');
    await expect(page.locator('.csl-news')).toBeVisible();
  });

  test('nothing is shown when all news are read', async ({ page }) => {
    await loadLogin(page, { syncData: { newsRead: { a: 1, b: 1 } } });
    await expect(page.locator('.csl-news')).toBeHidden();
  });

  test('role filter from Options hides news for other roles', async ({ page }) => {
    await loadLogin(page, { syncData: { newsAudiences: ['admin'] } });
    await expect(page.locator('.csl-news-strip__count')).toHaveText('1 new');
  });

  test('nothing is shown when news are off or the feed is unavailable', async ({ page }) => {
    await loadLogin(page, { syncData: { newsEnabled: false } });
    await expect(page.locator('.csl-news')).toBeHidden();
    await loadLogin(page, { newsFeed: null });
    await expect(page.locator('.csl-news')).toBeHidden();
  });

  test('a YouTube item opens the built-in player and Esc closes it', async ({ page }) => {
    await loadLogin(page, { newsFeed: feed([item('v', { media: { type: 'youtube', videoId: 'dQw4w9WgXcQ', title: 'Demo' } })]) });
    // Do not load YouTube in tests
    await page.route('https://www.youtube-nocookie.com/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<html></html>' }));
    await page.locator('.csl-news-strip').click();
    await page.locator('.csl-news-media--video').click();
    const dialog = page.locator('.csl-news-video__dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
    await page.keyboard.press('Escape');
    await expect(page.locator('.csl-news-video')).toHaveCount(0);
  });
});

test.describe('First run and the full feed', () => {
  test('a new user starts with the 3 newest news of the last month', async ({ page }) => {
    const many = feed([1, 2, 3, 4, 5].map(n => item(`n${n}`, { publishedAt: day(-n) })));
    await loadLogin(page, { newsFeed: many });
    await expect(page.locator('.csl-news-strip__count')).toHaveText('3 new');
    await page.locator('.csl-news-strip').click();
    await expect(page.locator('.csl-news-card')).toHaveCount(3);
  });

  test('the Shell menu has no news entries when nothing is new', async ({ page }) => {
    await loadShell(page, { syncData: { newsRead: { a: 1, b: 1 } } });
    await page.locator('.scripts-menu-button').click();
    await expect(page.locator('.csl-news-row')).toBeHidden();
    await expect(page.locator('.csl-news-all')).toHaveCount(0);
    await expect(page.locator('.csl-news-dot')).toBeHidden();
  });

  test('the panel footer links to the archive in a new tab', async ({ page }) => {
    await loadLogin(page);
    await page.locator('.csl-news-strip').click();
    const link = page.locator('.csl-news-panel__foot a');
    await expect(link).toHaveAttribute('href', 'https://advance-technologies-foundation.github.io/clio-news-feed/');
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('Options has a button that opens all news', async ({ page }) => {
    await setupChromeMock(page);
    await page.goto(`${BASE}/options.html`, { waitUntil: 'domcontentloaded' });
    await page.locator('#news-open-all').click();
    expect(await page.evaluate(() => window.__sentMessages.map(m => m.action))).toContain('openNewsArchive');
  });
});

test.describe('Developer news in Shell', () => {
  test('news are shown by default, when the user never touched the switch', async ({ page }) => {
    await loadShell(page, { syncData: {} });
    await expect(page.locator('.creatio-satelite .csl-news-dot')).toBeVisible();
  });

  test('dot on the Clio satellite button, cleared when the menu opens', async ({ page }) => {
    await loadShell(page);
    const dot = page.locator('.creatio-satelite .csl-news-dot');
    await expect(dot).toBeVisible();
    await expect(page.locator('.scripts-menu-button')).toHaveAttribute('aria-label', 'Clio satellite, 2 unread news');
    await page.locator('.scripts-menu-button').click();
    await expect(dot).toBeHidden();
    await expect(page.locator('.csl-news-row')).toBeVisible();
    await expect(page.locator('.csl-news-row .csl-news-pill')).toHaveText('2');
  });

  test('What\'s new opens the flyout next to the menu, inside the window', async ({ page }) => {
    await loadShell(page);
    await page.locator('.scripts-menu-button').click();
    await page.locator('.csl-news-row').click();
    const flyout = page.locator('.csl-news-flyout');
    await expect(flyout).toBeVisible();
    await expect(flyout.locator('.csl-news-card')).toHaveCount(2);
    const box = await flyout.boundingBox();
    const viewport = page.viewportSize();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  });

  test('the flyout is as tall as its news when there are few, without a scrollbar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await loadShell(page);
    await page.locator('.scripts-menu-button').click();
    await page.locator('.csl-news-row').click();
    const list = page.locator('.csl-news-flyout .csl-news-list');
    await expect(list.locator('.csl-news-card')).toHaveCount(2);
    const { scroll, client } = await list.evaluate(el => ({ scroll: el.scrollHeight, client: el.clientHeight }));
    expect(scroll).toBeLessThanOrEqual(client);
  });

  test('with many news the flyout stops at 80% of the window height and the list scrolls', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 500 });
    const many = feed(Array.from({ length: 5 }, (_, i) => item(`m${i}`)));
    await loadShell(page, { newsFeed: many, syncData: { newsOnboardedAt: 1 } });
    await page.locator('.scripts-menu-button').click();
    await page.locator('.csl-news-row').click();
    const flyout = page.locator('.csl-news-flyout');
    await expect(flyout.locator('.csl-news-card')).toHaveCount(5);
    const box = await flyout.boundingBox();
    expect(box.height).toBeLessThanOrEqual(500 * 0.8 + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(500);
    expect(box.height).toBeGreaterThan(500 * 0.5);
    const scrolls = await flyout.locator('.csl-news-list').evaluate(el => el.scrollHeight > el.clientHeight);
    expect(scrolls).toBe(true);
  });

  test('closing the menu marks the flyout news read; the row stays without a count until reload', async ({ page }) => {
    await loadShell(page);
    await page.locator('.scripts-menu-button').click();
    await page.locator('.csl-news-row').click();
    await expect(page.locator('.csl-news-flyout')).toBeVisible();
    await page.mouse.click(900, 600);
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/hidden/);
    await page.locator('.scripts-menu-button').click();
    await expect(page.locator('.csl-news-row')).toBeVisible();
    await expect(page.locator('.csl-news-pill')).toBeHidden();
  });

  test('a critical item shows a one-time peek card', async ({ page }) => {
    await loadShell(page, { newsFeed: feed([item('c', { type: 'breaking', priority: 'critical', title: 'Update clio before Nov 1' })]) });
    const peek = page.locator('.csl-news-peek');
    await expect(peek).toBeVisible();
    await expect(peek).toContainText('Update clio before Nov 1');
    await peek.locator('.csl-news-peek__read').click();
    await expect(peek).toHaveCount(0);
    await expect(page.locator('.csl-news-flyout')).toBeVisible();
  });
});

test.describe('Developer news usage events', () => {
  const tracked = page => page.evaluate(() => window.__sentMessages.filter(m => m.action === 'trackEvent').map(m => [m.name, m.params]));

  test('opening the Shell flyout, a card link and the panel controls are reported', async ({ page }) => {
    await loadShell(page);
    await page.locator('.scripts-menu-button').click();
    await page.locator('.csl-news-row').click();
    const flyout = page.locator('.csl-news-flyout');
    await flyout.locator('.csl-news-card[data-news-id="a"] .csl-news-card__cta').evaluate(a => a.addEventListener('click', e => e.preventDefault()));
    await flyout.locator('.csl-news-card[data-news-id="a"] .csl-news-card__cta').click();
    await flyout.getByRole('link', { name: 'All news →' }).evaluate(a => a.addEventListener('click', e => e.preventDefault()));
    await flyout.getByRole('link', { name: 'All news →' }).click();
    await flyout.getByRole('button', { name: 'Choose topics' }).click();
    await flyout.getByRole('button', { name: 'Mark all as read' }).click();
    expect((await tracked(page)).filter(([name]) => name.startsWith('news_'))).toEqual([
      ['news_open', { surface: 'shell' }],
      ['news_cta_click', { surface: 'shell', news_id: 'a' }],
      ['news_archive_open', { surface: 'shell' }],
      ['news_topics_open', { surface: 'shell' }],
      ['news_mark_all_read', { surface: 'shell' }],
    ]);
  });

  test('opening the login news list is reported once per opening', async ({ page }) => {
    await loadLogin(page);
    await page.locator('.csl-news-strip').click();
    await page.locator('.csl-news-strip').click();
    await page.locator('.csl-news-strip').click();
    expect((await tracked(page)).filter(([name]) => name === 'news_open')).toEqual([
      ['news_open', { surface: 'login' }],
      ['news_open', { surface: 'login' }],
    ]);
  });
});

test.describe('Usage statistics settings', () => {
  test('on by default; the switch stores an explicit false', async ({ page }) => {
    await setupChromeMock(page);
    await page.goto(`${BASE}/options.html`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#analytics-enabled')).toBeChecked();
    await page.locator('#analytics-enabled').uncheck();
    expect(await page.evaluate(() => new Promise(r => chrome.storage.sync.get({ analyticsEnabled: true }, d => r(d.analyticsEnabled))))).toBe(false);
  });
});

test.describe('Developer news settings', () => {
  test('news are on by default with all roles on; at least one role stays on', async ({ page }) => {
    await setupChromeMock(page);
    await page.goto(`${BASE}/options.html`, { waitUntil: 'domcontentloaded' });
    const boxes = page.locator('input[name="news-audience"]');
    await expect(page.locator('#news-enabled')).toBeChecked();
    await expect(page.locator('#news-aud-admin')).toBeEnabled();
    await expect(boxes).toHaveCount(3);
    for (const box of await boxes.all()) await expect(box).toBeChecked();

    await page.locator('#news-aud-admin').uncheck();
    await page.locator('#news-aud-other').uncheck();
    await page.locator('#news-aud-developer').click();
    await expect(page.locator('#news-aud-developer')).toBeChecked();
    expect(await page.evaluate(() => new Promise(r => chrome.storage.sync.get({ newsAudiences: [] }, d => r(d.newsAudiences))))).toEqual(['developer']);

    await page.locator('#news-enabled').uncheck();
    await expect(page.locator('#news-aud-admin')).toBeDisabled();
    expect(await page.evaluate(() => new Promise(r => chrome.storage.sync.get({ newsEnabled: true }, d => r(d.newsEnabled))))).toBe(false);
  });

  test('troubleshooting explains why each cached news item is shown or hidden', async ({ page }) => {
    const cached = feed([
      item('read1', { title: 'Already read news' }),
      item('dev', { title: 'Developer news', audiences: ['developer'] }),
      item('new1', { title: 'Fresh admin news', audiences: ['admin'] }),
      item('later', { title: 'Needs a newer extension', minVersion: '9.9' }),
      item('login1', { title: 'Login only news', surfaces: ['login'] }),
    ]);
    await setupChromeMock(page, { syncData: { newsEnabled: true, newsAudiences: ['admin'], newsRead: { read1: 1 } } });
    await page.addInitScript(raw => {
      const set = window.chrome.storage.local.set;
      set({ newsFeedCache: { raw, fetchedAt: Date.now(), refreshHours: 6 } });
    }, JSON.stringify(cached));
    await page.goto(`${BASE}/options.html`, { waitUntil: 'domcontentloaded' });
    await page.locator('#news-debug summary').click();
    await expect(page.locator('#news-debug-status')).toContainText('Cached feed: 5 item(s)');
    const row = title => page.locator('.news-debug__item', { hasText: title }).locator('.news-debug__state');
    await expect(row('Already read news')).toHaveText('read');
    await expect(row('Developer news')).toHaveText('hidden: topic is turned off above');
    await expect(row('Fresh admin news')).toHaveText('new');
    await expect(row('Needs a newer extension')).toHaveText('hidden: needs Clio Satellite 9.9');
    await expect(page.locator('.news-debug__item', { hasText: 'Login only news' })).toContainText('login page only');
  });

  test('"Mark all news as unread" forgets read, opened and skipped news', async ({ page }) => {
    await setupChromeMock(page, { syncData: { newsEnabled: true, newsRead: { a: 1 }, newsFirstShown: { a: 1 }, newsAutoOpened: { a: true }, newsSkipped: { b: 1 } } });
    await page.goto(`${BASE}/options.html`, { waitUntil: 'domcontentloaded' });
    await page.locator('#news-debug summary').click();
    await page.locator('#news-reset-read').click();
    await expect(page.locator('#news-debug-status')).toContainText('All news are unread again.');
    const state = await page.evaluate(() => new Promise(r => chrome.storage.sync.get({ newsRead: null, newsFirstShown: null, newsAutoOpened: null, newsSkipped: null }, r)));
    expect(state).toEqual({ newsRead: {}, newsFirstShown: {}, newsAutoOpened: {}, newsSkipped: {} });
  });

  test('"Download news now" clears the cache and fetches the feed again', async ({ page }) => {
    await setupChromeMock(page, { syncData: { newsEnabled: true }, newsFeed: TWO });
    await page.addInitScript(() => window.chrome.storage.local.set({ newsFeedCache: { raw: '{"schemaVersion":1,"items":[]}', fetchedAt: 1, refreshHours: 24 }, newsMediaCache: { x: 1 } }));
    await page.goto(`${BASE}/options.html`, { waitUntil: 'domcontentloaded' });
    await page.locator('#news-debug summary').click();
    await expect(page.locator('#news-debug-status')).toContainText('Cached feed: 0 item(s)');
    await page.locator('#news-refresh').click();
    await expect(page.locator('#news-debug-status')).toContainText('Cached feed: 2 item(s)');
    expect(await page.evaluate(() => window.__sentMessages.map(m => m.action))).toContain('getNews');
    const media = await page.evaluate(() => new Promise(r => chrome.storage.local.get(['newsMediaCache'], r)));
    expect(media.newsMediaCache).toBeUndefined();
  });

  test('troubleshooting says when news are turned off', async ({ page }) => {
    await setupChromeMock(page, { syncData: { newsEnabled: false }, newsFeed: null });
    await page.goto(`${BASE}/options.html`, { waitUntil: 'domcontentloaded' });
    await page.locator('#news-debug summary').click();
    await expect(page.locator('#news-debug-status')).toHaveText('News are turned off: nothing is downloaded.');
  });
});

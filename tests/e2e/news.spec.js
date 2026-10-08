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

async function loadLogin(page, { newsFeed = TWO, syncData = {} } = {}) {
  await setupChromeMock(page, { syncData: { userProfiles: PROFILES, ...syncData }, newsFeed });
  await page.goto(`${BASE}/login/`);
  await page.addStyleTag({ content: read('styles/login.css') });
  await page.addStyleTag({ content: read('styles/news.css') });
  await page.addScriptTag({ content: read('login/login-events.js') });
  await page.addScriptTag({ content: read('login/login.js') });
  await injectContentScript(page);
  await page.waitForSelector('.creatio-satelite-login-profiles-container');
}

async function loadShell(page, { newsFeed = TWO, syncData = {} } = {}) {
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
    // Nothing new is left, so the whole strip goes away
    await expect(page.locator('.csl-news')).toBeHidden();
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

  test('closing the menu marks the flyout news read and hides the row', async ({ page }) => {
    await loadShell(page);
    await page.locator('.scripts-menu-button').click();
    await page.locator('.csl-news-row').click();
    await expect(page.locator('.csl-news-flyout')).toBeVisible();
    await page.mouse.click(900, 600);
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/hidden/);
    await page.locator('.scripts-menu-button').click();
    await expect(page.locator('.csl-news-row')).toBeHidden();
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

test.describe('Developer news settings', () => {
  test('all roles on by default; at least one stays on; news can be turned off', async ({ page }) => {
    await setupChromeMock(page);
    await page.goto(`${BASE}/options.html`, { waitUntil: 'domcontentloaded' });
    const boxes = page.locator('input[name="news-audience"]');
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
});

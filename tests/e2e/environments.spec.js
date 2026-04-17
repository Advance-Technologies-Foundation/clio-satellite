import { test, expect } from '@playwright/test';
import { setupChromeMock } from './helpers.js';

const BASE = 'http://localhost:3737';

const PROFILE = { username: 'Supervisor', password: 'Supervisor', alias: 'Classic', url: '', autologin: false };

const T_NEW = new Date('2026-04-17T12:00:00').getTime();
const T_OLD = new Date('2026-01-01T08:00:00').getTime();

async function loadEnv(page, { syncData = {} } = {}) {
  await setupChromeMock(page, { syncData });
  await page.goto(`${BASE}/environments.html`, { waitUntil: 'domcontentloaded' });
}

test.describe('Environments page', () => {
  test('shows empty state when no login history', async ({ page }) => {
    await loadEnv(page, { syncData: { userProfiles: [PROFILE] } });
    await expect(page.locator('.env-empty')).toBeVisible();
  });

  test('renders a tile for each site in lastLoginProfiles', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: {
          'https://site1.example.com': { username: 'Supervisor', timestamp: T_NEW },
          'https://site2.example.com': { username: 'Supervisor', timestamp: T_OLD },
        },
      },
    });
    await expect(page.locator('#environments-grid .env-tile')).toHaveCount(2);
  });

  test('tiles show hostname', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: { 'https://myapp.example.com': { username: 'Supervisor', timestamp: T_NEW } },
      },
    });
    await expect(page.locator('.env-tile__hostname')).toContainText('myapp.example.com');
  });

  test('tile link opens the site', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: { 'https://myapp.example.com': { username: 'Supervisor', timestamp: T_NEW } },
      },
    });
    await expect(page.locator('.env-tile__link')).toHaveAttribute('href', 'https://myapp.example.com');
    await expect(page.locator('.env-tile__link')).toHaveAttribute('target', '_blank');
  });

  test('tiles are sorted newest first', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: {
          'https://old.example.com': { username: 'Supervisor', timestamp: T_OLD },
          'https://new.example.com': { username: 'Supervisor', timestamp: T_NEW },
        },
      },
    });
    const tiles = page.locator('#environments-grid .env-tile__hostname');
    await expect(tiles.first()).toContainText('new.example.com');
    await expect(tiles.last()).toContainText('old.example.com');
  });

  test('each tile has a different background color', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: {
          'https://alpha.example.com': { username: 'Supervisor', timestamp: T_NEW },
          'https://beta.example.com':  { username: 'Supervisor', timestamp: T_OLD },
        },
      },
    });
    const tiles = page.locator('#environments-grid .env-tile');
    const c1 = await tiles.nth(0).evaluate(el => el.style.background);
    const c2 = await tiles.nth(1).evaluate(el => el.style.background);
    expect(c1).not.toBe(c2);
  });

  test('favorites section is hidden when no favorites', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: { 'https://site.example.com': { username: 'Supervisor', timestamp: T_NEW } },
      },
    });
    await expect(page.locator('#favorites-section')).toBeHidden();
  });

  test('clicking star moves tile to favorites section', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: { 'https://site.example.com': { username: 'Supervisor', timestamp: T_NEW } },
      },
    });
    await expect(page.locator('#environments-grid .env-tile')).toHaveCount(1);
    await page.locator('.env-tile__fav-btn').click();

    await expect(page.locator('#favorites-section')).toBeVisible();
    await expect(page.locator('#favorites-grid .env-tile')).toHaveCount(1);
    await expect(page.locator('#environments-grid .env-tile')).toHaveCount(0);
  });

  test('clicking star on favorite removes it from favorites section', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: { 'https://site.example.com': { username: 'Supervisor', timestamp: T_NEW } },
        favoriteEnvironments: ['https://site.example.com'],
      },
    });
    await expect(page.locator('#favorites-section')).toBeVisible();
    await page.locator('#favorites-grid .env-tile__fav-btn').click();

    await expect(page.locator('#favorites-section')).toBeHidden();
    await expect(page.locator('#environments-grid .env-tile')).toHaveCount(1);
  });

  test('favorites do not appear in main grid', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: {
          'https://fav.example.com':   { username: 'Supervisor', timestamp: T_NEW },
          'https://other.example.com': { username: 'Supervisor', timestamp: T_OLD },
        },
        favoriteEnvironments: ['https://fav.example.com'],
      },
    });
    await expect(page.locator('#favorites-grid .env-tile')).toHaveCount(1);
    await expect(page.locator('#environments-grid .env-tile')).toHaveCount(1);
    await expect(page.locator('#environments-grid .env-tile__hostname')).toContainText('other.example.com');
  });

  test('section title changes to "All environments" when favorites exist', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: { 'https://site.example.com': { username: 'Supervisor', timestamp: T_NEW } },
        favoriteEnvironments: ['https://site.example.com'],
      },
    });
    await expect(page.locator('#all-section-title')).toContainText('All environments');
  });
});

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

  test('tile shows port when origin has non-standard port', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: { 'https://myapp.example.com:8080': { username: 'Supervisor', timestamp: T_NEW } },
      },
    });
    await expect(page.locator('.env-tile__hostname')).toContainText('myapp.example.com:8080');
  });

  test('same hostname on different ports gets different colors', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: {
          'https://myapp.example.com':      { username: 'Supervisor', timestamp: T_NEW },
          'https://myapp.example.com:8080': { username: 'Supervisor', timestamp: T_OLD },
        },
      },
    });
    const tiles = page.locator('#environments-grid .env-tile');
    const c1 = await tiles.nth(0).evaluate(el => el.style.background);
    const c2 = await tiles.nth(1).evaluate(el => el.style.background);
    expect(c1).not.toBe(c2);
  });

  test('delete button shows confirm modal', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: { 'https://site.example.com': { username: 'Supervisor', timestamp: T_NEW } },
      },
    });
    await page.locator('#environments-grid .env-tile__del-btn').click();
    await expect(page.locator('#confirm-modal')).toBeVisible();
  });

  test('cancelling confirm modal keeps the tile', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: { 'https://site.example.com': { username: 'Supervisor', timestamp: T_NEW } },
      },
    });
    await page.locator('#environments-grid .env-tile__del-btn').click();
    await page.locator('#cancel-delete-btn').click();
    await expect(page.locator('#confirm-modal')).toBeHidden();
    await expect(page.locator('#environments-grid .env-tile')).toHaveCount(1);
  });

  test('confirming delete removes tile from grid', async ({ page }) => {
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
    await page.locator('#environments-grid .env-tile__del-btn').first().click();
    await page.locator('#confirm-delete-btn').click();
    await expect(page.locator('#environments-grid .env-tile')).toHaveCount(1);
  });

  test('confirming delete on favorite removes it from favorites section', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: { 'https://site.example.com': { username: 'Supervisor', timestamp: T_NEW } },
        favoriteEnvironments: ['https://site.example.com'],
      },
    });
    await expect(page.locator('#favorites-section')).toBeVisible();
    await page.locator('#favorites-grid .env-tile__del-btn').click();
    await page.locator('#confirm-delete-btn').click();
    await expect(page.locator('#favorites-section')).toBeHidden();
    await expect(page.locator('#environments-grid .env-tile')).toHaveCount(0);
  });

  // ── Search ──────────────────────────────────────────────

  test('search input is visible in the all-environments toolbar', async ({ page }) => {
    await loadEnv(page, { syncData: { userProfiles: [PROFILE] } });
    await expect(page.locator('#env-search')).toBeVisible();
  });

  test('search filters tiles by hostname', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: {
          'https://alpha.example.com': { username: 'Supervisor', timestamp: T_NEW },
          'https://beta.example.com':  { username: 'Supervisor', timestamp: T_OLD },
        },
      },
    });
    await page.locator('#env-search').fill('alpha');
    await expect(page.locator('#environments-grid .env-tile:visible')).toHaveCount(1);
    await expect(page.locator('#environments-grid .env-tile__hostname:visible')).toContainText('alpha.example.com');
  });

  test('search filters tiles by port', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: {
          'https://myapp.example.com':      { username: 'Supervisor', timestamp: T_NEW },
          'https://myapp.example.com:8080': { username: 'Supervisor', timestamp: T_OLD },
        },
      },
    });
    await page.locator('#env-search').fill('8080');
    await expect(page.locator('#environments-grid .env-tile:visible')).toHaveCount(1);
    await expect(page.locator('#environments-grid .env-tile__hostname:visible')).toContainText(':8080');
  });

  test('search shows no-match message when nothing matches', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: { 'https://site.example.com': { username: 'Supervisor', timestamp: T_NEW } },
      },
    });
    await page.locator('#env-search').fill('zzznomatch');
    await expect(page.locator('#environments-grid .env-empty--search')).toBeVisible();
    await expect(page.locator('#environments-grid .env-empty--search')).toContainText('No environments match');
  });

  test('clearing search restores all tiles', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: {
          'https://alpha.example.com': { username: 'Supervisor', timestamp: T_NEW },
          'https://beta.example.com':  { username: 'Supervisor', timestamp: T_OLD },
        },
      },
    });
    await page.locator('#env-search').fill('alpha');
    await expect(page.locator('#environments-grid .env-tile:visible')).toHaveCount(1);
    await page.locator('#env-search').fill('');
    await expect(page.locator('#environments-grid .env-tile:visible')).toHaveCount(2);
  });

  // ── Selection ───────────────────────────────────────────

  test('clicking checkbox selects tile and shows bulk bar in the same block', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: { 'https://site.example.com': { username: 'Supervisor', timestamp: T_NEW } },
      },
    });
    await expect(page.locator('#env-bulk-bar')).toBeHidden();
    await page.locator('#environments-grid .env-tile__check').first().click();
    await expect(page.locator('#env-bulk-bar')).toBeVisible();
    await expect(page.locator('#env-bulk-count')).toContainText('1 selected');
    await expect(page.locator('#favorites-bulk-bar')).toBeHidden();
    await expect(page.locator('.env-tile--selected')).toHaveCount(1);
  });

  test('selecting a favourite tile shows bulk bar inside favourites block', async ({ page }) => {
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
    await page.locator('#favorites-grid .env-tile__check').first().click();
    await expect(page.locator('#favorites-bulk-bar')).toBeVisible();
    await expect(page.locator('#favorites-bulk-count')).toContainText('1 selected');
    await expect(page.locator('#env-bulk-bar')).toBeHidden();
  });

  test('clicking checkbox again deselects the tile', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: { 'https://site.example.com': { username: 'Supervisor', timestamp: T_NEW } },
      },
    });
    await page.locator('.env-tile__check').first().click();
    await expect(page.locator('.env-tile--selected')).toHaveCount(1);
    await page.locator('.env-tile__check').first().click();
    await expect(page.locator('.env-tile--selected')).toHaveCount(0);
    await expect(page.locator('#env-bulk-bar')).toBeHidden();
  });

  test('ctrl+click on tile link selects tile', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: { 'https://site.example.com': { username: 'Supervisor', timestamp: T_NEW } },
      },
    });
    // Use synthetic event to bypass Chromium's native "open in new tab" on Ctrl+Click
    await page.locator('.env-tile__link').first().evaluate(el => {
      el.dispatchEvent(new MouseEvent('click', { ctrlKey: true, bubbles: true, cancelable: true }));
    });
    await expect(page.locator('.env-tile--selected')).toHaveCount(1);
    await expect(page.locator('#env-bulk-bar')).toBeVisible();
  });

  test('deselect all button clears selection', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: {
          'https://site1.example.com': { username: 'Supervisor', timestamp: T_NEW },
          'https://site2.example.com': { username: 'Supervisor', timestamp: T_OLD },
        },
      },
    });
    await page.locator('.env-tile__check').nth(0).click();
    await page.locator('.env-tile__check').nth(1).click();
    await expect(page.locator('.env-tile--selected')).toHaveCount(2);
    await page.locator('#deselect-all-btn').click();
    await expect(page.locator('.env-tile--selected')).toHaveCount(0);
    await expect(page.locator('#env-bulk-bar')).toBeHidden();
  });

  // ── Bulk delete ─────────────────────────────────────────

  test('delete selected button shows modal with count', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: {
          'https://site1.example.com': { username: 'Supervisor', timestamp: T_NEW },
          'https://site2.example.com': { username: 'Supervisor', timestamp: T_OLD },
        },
      },
    });
    await page.locator('.env-tile__check').nth(0).click();
    await page.locator('.env-tile__check').nth(1).click();
    await page.locator('#delete-selected-btn').click();
    await expect(page.locator('#confirm-modal')).toBeVisible();
    await expect(page.locator('#confirm-modal-text')).toContainText('2 selected environments');
  });

  test('confirming delete selected removes those tiles', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: {
          'https://site1.example.com': { username: 'Supervisor', timestamp: T_NEW },
          'https://site2.example.com': { username: 'Supervisor', timestamp: T_OLD },
          'https://site3.example.com': { username: 'Supervisor', timestamp: T_OLD - 1000 },
        },
      },
    });
    await page.locator('.env-tile__check').nth(0).click();
    await page.locator('.env-tile__check').nth(1).click();
    await page.locator('#delete-selected-btn').click();
    await page.locator('#confirm-delete-btn').click();
    await expect(page.locator('#environments-grid .env-tile')).toHaveCount(1);
    await expect(page.locator('#env-bulk-bar')).toBeHidden();
  });

  test('"delete all environments" button is visible when non-fav environments exist', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: { 'https://site.example.com': { username: 'Supervisor', timestamp: T_NEW } },
      },
    });
    await expect(page.locator('#env-card-footer')).toBeVisible();
    await expect(page.locator('#delete-non-fav-btn')).toBeVisible();
  });

  test('"delete all environments" button is hidden when main grid is empty', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: { 'https://site.example.com': { username: 'Supervisor', timestamp: T_NEW } },
        favoriteEnvironments: ['https://site.example.com'],
      },
    });
    await expect(page.locator('#env-card-footer')).toBeHidden();
  });

  test('"delete all environments" shows modal explaining favourites are preserved', async ({ page }) => {
    await loadEnv(page, {
      syncData: {
        userProfiles: [PROFILE],
        lastLoginProfiles: { 'https://site.example.com': { username: 'Supervisor', timestamp: T_NEW } },
      },
    });
    await page.locator('#delete-non-fav-btn').click();
    await expect(page.locator('#confirm-modal')).toBeVisible();
    await expect(page.locator('#confirm-modal-text')).toContainText('favourites will be preserved');
  });

  test('confirming "delete all except favourites" removes only non-fav environments', async ({ page }) => {
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
    await expect(page.locator('#environments-grid .env-tile')).toHaveCount(1);
    await page.locator('#delete-non-fav-btn').click();
    await page.locator('#confirm-delete-btn').click();
    await expect(page.locator('#environments-grid .env-tile')).toHaveCount(0);
    await expect(page.locator('#favorites-grid .env-tile')).toHaveCount(1);
  });
});

import { test, expect } from '@playwright/test';
import { setupChromeMock } from './helpers.js';

const BASE = 'http://localhost:3737';

const TEST_PROFILE = {
  username: 'AdminUser',
  password: 'secret123',
  alias: 'Test Admin',
  url: '',
  autologin: false,
};

async function loadOptions(page, { syncData = {} } = {}) {
  await setupChromeMock(page, { syncData });
  await page.goto(`${BASE}/options.html`, { waitUntil: 'domcontentloaded' });
}

test.describe('Options page', () => {
  test('page loads with Add Profile button visible', async ({ page }) => {
    await loadOptions(page, { syncData: { userProfiles: [TEST_PROFILE] } });
    await expect(page.locator('#add-profile-btn')).toBeVisible();
    await expect(page.locator('#user-list')).toBeAttached();
  });

  test('default Supervisor profile is created when storage is empty', async ({ page }) => {
    await loadOptions(page);
    // initializeDefaultProfilesIfNeeded auto-creates Supervisor when no profiles exist
    await expect(page.locator('#user-list li')).toHaveCount(1, { timeout: 3000 });
    await expect(page.locator('#user-list li').first()).toContainText('Supervisor');
  });

  test('pre-saved profile renders with alias and username', async ({ page }) => {
    await loadOptions(page, { syncData: { userProfiles: [TEST_PROFILE] } });
    await expect(page.locator('#user-list li')).toHaveCount(1, { timeout: 3000 });
    await expect(page.locator('#user-list li').first()).toContainText('Test Admin (AdminUser)');
  });

  test('Add Profile button opens modal with correct title', async ({ page }) => {
    await loadOptions(page, { syncData: { userProfiles: [TEST_PROFILE] } });
    await page.locator('#add-profile-btn').click();
    await expect(page.locator('#profile-modal')).toBeVisible();
    await expect(page.locator('#modal-title')).toHaveText('Add Profile');
  });

  test('submitting Add Profile form appends the profile to the list', async ({ page }) => {
    await loadOptions(page, { syncData: { userProfiles: [TEST_PROFILE] } });
    await expect(page.locator('#user-list li')).toHaveCount(1, { timeout: 3000 });

    await page.locator('#add-profile-btn').click();
    await page.locator('#profile-username').fill('NewUser');
    await page.locator('#profile-password').fill('newpass');
    await page.locator('#save-profile-btn').click();

    await expect(page.locator('#profile-modal')).not.toBeVisible();
    await expect(page.locator('#user-list li')).toHaveCount(2, { timeout: 3000 });
    await expect(page.locator('#user-list li').last()).toContainText('NewUser');
  });

  test('Edit button opens modal pre-filled with profile data', async ({ page }) => {
    await loadOptions(page, { syncData: { userProfiles: [TEST_PROFILE] } });
    await expect(page.locator('#user-list li')).toHaveCount(1, { timeout: 3000 });

    await page.locator('.edit-button').click();
    await expect(page.locator('#profile-modal')).toBeVisible();
    await expect(page.locator('#modal-title')).toHaveText('Edit Profile');
    await expect(page.locator('#profile-username')).toHaveValue(TEST_PROFILE.username);
    await expect(page.locator('#profile-password')).toHaveValue(TEST_PROFILE.password);
    await expect(page.locator('#profile-alias')).toHaveValue(TEST_PROFILE.alias);
  });

  test('saving an edit updates the profile in the list', async ({ page }) => {
    await loadOptions(page, { syncData: { userProfiles: [TEST_PROFILE] } });
    await expect(page.locator('#user-list li')).toHaveCount(1, { timeout: 3000 });

    await page.locator('.edit-button').click();
    await page.locator('#profile-alias').fill('Updated Alias');
    await page.locator('#save-profile-btn').click();

    await expect(page.locator('#profile-modal')).not.toBeVisible();
    await expect(page.locator('#user-list li').first()).toContainText('Updated Alias');
  });

  test('Delete button shows confirmation modal', async ({ page }) => {
    await loadOptions(page, { syncData: { userProfiles: [TEST_PROFILE] } });
    await expect(page.locator('#user-list li')).toHaveCount(1, { timeout: 3000 });

    await page.locator('.delete-button').click();
    await expect(page.locator('#confirm-modal')).toBeVisible();
  });

  test('confirming deletion removes the profile from the list', async ({ page }) => {
    await loadOptions(page, { syncData: { userProfiles: [TEST_PROFILE] } });
    await expect(page.locator('#user-list li')).toHaveCount(1, { timeout: 3000 });

    await page.locator('.delete-button').click();
    await page.locator('#confirm-delete-btn').click();

    await expect(page.locator('#confirm-modal')).not.toBeVisible();
    await expect(page.locator('#user-list li')).toHaveCount(0, { timeout: 3000 });
  });

  test('password toggle switches input type between password and text', async ({ page }) => {
    await loadOptions(page, { syncData: { userProfiles: [TEST_PROFILE] } });
    await page.locator('#add-profile-btn').click();

    const pwInput = page.locator('#profile-password');
    await expect(pwInput).toHaveAttribute('type', 'password');

    await page.locator('#toggle-password').click();
    await expect(pwInput).toHaveAttribute('type', 'text');

    await page.locator('#toggle-password').click();
    await expect(pwInput).toHaveAttribute('type', 'password');
  });

  test('history card is hidden when no login history exists', async ({ page }) => {
    await loadOptions(page, { syncData: { userProfiles: [TEST_PROFILE] } });
    await expect(page.locator('#user-list li')).toHaveCount(1, { timeout: 3000 });
    await expect(page.locator('#history-card')).toBeHidden();
  });

  test('history card is collapsed by default', async ({ page }) => {
    await loadOptions(page, {
      syncData: {
        userProfiles: [TEST_PROFILE],
        lastLoginProfiles: { 'https://myapp.example.com': TEST_PROFILE.username },
      },
    });
    await expect(page.locator('#history-card')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('.history-details')).not.toHaveAttribute('open');
    await expect(page.locator('#history-list')).toBeHidden();
  });

  test('history card expands on summary click and shows site, profile and date', async ({ page }) => {
    const ts = new Date('2026-04-17T10:30:00').getTime();
    await loadOptions(page, {
      syncData: {
        userProfiles: [TEST_PROFILE],
        lastLoginProfiles: { 'https://myapp.example.com': { username: TEST_PROFILE.username, timestamp: ts } },
      },
    });
    await page.locator('.history-summary').click();
    await expect(page.locator('#history-list')).toBeVisible();
    await expect(page.locator('.history-item__site')).toContainText('myapp.example.com');
    await expect(page.locator('.history-item__site')).toHaveAttribute('href', 'https://myapp.example.com');
    await expect(page.locator('.history-item__profile')).toContainText('Test Admin');
    await expect(page.locator('.history-item__date')).not.toContainText('—');
  });

  test('history shows — for legacy entries without timestamp', async ({ page }) => {
    await loadOptions(page, {
      syncData: {
        userProfiles: [TEST_PROFILE],
        lastLoginProfiles: { 'https://myapp.example.com': TEST_PROFILE.username },
      },
    });
    await page.locator('.history-summary').click();
    await expect(page.locator('.history-item__date')).toContainText('—');
  });

  test('history entries are sorted newest first', async ({ page }) => {
    const t1 = new Date('2026-01-01').getTime();
    const t2 = new Date('2026-04-17').getTime();
    await loadOptions(page, {
      syncData: {
        userProfiles: [TEST_PROFILE],
        lastLoginProfiles: {
          'https://old.example.com': { username: TEST_PROFILE.username, timestamp: t1 },
          'https://new.example.com': { username: TEST_PROFILE.username, timestamp: t2 },
        },
      },
    });
    await page.locator('.history-summary').click();
    const items = page.locator('.history-item__site');
    await expect(items.first()).toContainText('new.example.com');
    await expect(items.last()).toContainText('old.example.com');
  });

  test('history card shows one row per site', async ({ page }) => {
    await loadOptions(page, {
      syncData: {
        userProfiles: [TEST_PROFILE],
        lastLoginProfiles: {
          'https://site1.example.com': { username: TEST_PROFILE.username, timestamp: Date.now() },
          'https://site2.example.com': { username: TEST_PROFILE.username, timestamp: Date.now() },
        },
      },
    });
    await page.locator('.history-summary').click();
    await expect(page.locator('#history-list li')).toHaveCount(2, { timeout: 3000 });
  });

  test('profile list items have no inline history', async ({ page }) => {
    await loadOptions(page, {
      syncData: {
        userProfiles: [TEST_PROFILE],
        lastLoginProfiles: { 'https://myapp.example.com': TEST_PROFILE.username },
      },
    });
    await expect(page.locator('#user-list li')).toHaveCount(1, { timeout: 3000 });
    await expect(page.locator('#user-list .history-item__site')).toHaveCount(0);
  });

  test('"Delete all profiles" shows confirmation modal with bulk message', async ({ page }) => {
    await loadOptions(page, { syncData: { userProfiles: [TEST_PROFILE] } });
    await page.locator('#set-to-defaults').click();
    await expect(page.locator('#confirm-modal')).toBeVisible();
    await expect(page.locator('#confirm-modal .modal-body p')).toContainText('all profiles');
  });

  // ── Profile search ──────────────────────────────────────

  test('search input is visible in profiles toolbar', async ({ page }) => {
    await loadOptions(page, { syncData: { userProfiles: [TEST_PROFILE] } });
    await expect(page.locator('#profile-search')).toBeVisible();
  });

  test('search filters profiles by username', async ({ page }) => {
    const second = { username: 'OtherUser', password: 'pass', alias: '', url: '', autologin: false };
    await loadOptions(page, { syncData: { userProfiles: [TEST_PROFILE, second] } });
    await expect(page.locator('#user-list li')).toHaveCount(2, { timeout: 3000 });
    await page.locator('#profile-search').fill('AdminUser');
    await expect(page.locator('#user-list li:visible')).toHaveCount(1);
    await expect(page.locator('#user-list li:visible')).toContainText('AdminUser');
  });

  test('search filters profiles by alias', async ({ page }) => {
    const second = { username: 'OtherUser', password: 'pass', alias: 'DevAlias', url: '', autologin: false };
    await loadOptions(page, { syncData: { userProfiles: [TEST_PROFILE, second] } });
    await expect(page.locator('#user-list li')).toHaveCount(2, { timeout: 3000 });
    await page.locator('#profile-search').fill('DevAlias');
    await expect(page.locator('#user-list li:visible')).toHaveCount(1);
    await expect(page.locator('#user-list li:visible')).toContainText('DevAlias');
  });

  test('search filters profiles by URL', async ({ page }) => {
    const withUrl = { username: 'SiteUser', password: 'pass', alias: '', url: 'https://mysite.example.com', autologin: false };
    await loadOptions(page, { syncData: { userProfiles: [TEST_PROFILE, withUrl] } });
    await expect(page.locator('#user-list li')).toHaveCount(2, { timeout: 3000 });
    await page.locator('#profile-search').fill('mysite');
    await expect(page.locator('#user-list li:visible')).toHaveCount(1);
    await expect(page.locator('#user-list li:visible')).toContainText('SiteUser');
  });

  test('search with no match shows empty message', async ({ page }) => {
    await loadOptions(page, { syncData: { userProfiles: [TEST_PROFILE] } });
    await expect(page.locator('#user-list li')).toHaveCount(1, { timeout: 3000 });
    await page.locator('#profile-search').fill('zzznomatch');
    await expect(page.locator('#profile-search-empty')).toBeVisible();
    await expect(page.locator('#profile-search-empty')).toContainText('No profiles match');
  });

  test('clearing search restores all profiles', async ({ page }) => {
    const second = { username: 'OtherUser', password: 'pass', alias: '', url: '', autologin: false };
    await loadOptions(page, { syncData: { userProfiles: [TEST_PROFILE, second] } });
    await expect(page.locator('#user-list li')).toHaveCount(2, { timeout: 3000 });
    await page.locator('#profile-search').fill('AdminUser');
    await expect(page.locator('#user-list li:visible')).toHaveCount(1);
    await page.locator('#profile-search').fill('');
    await expect(page.locator('#user-list li:visible')).toHaveCount(2);
    await expect(page.locator('#profile-search-empty')).toBeHidden();
  });
});

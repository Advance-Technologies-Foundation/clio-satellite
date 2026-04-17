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

  test('profile shows site link when it was last used on a site', async ({ page }) => {
    await loadOptions(page, {
      syncData: {
        userProfiles: [TEST_PROFILE],
        lastLoginProfiles: { 'https://myapp.example.com': TEST_PROFILE.username },
      },
    });
    await expect(page.locator('#user-list li')).toHaveCount(1, { timeout: 3000 });
    const link = page.locator('.profile-item__site-link');
    await expect(link).toBeVisible();
    await expect(link).toContainText('myapp.example.com');
    await expect(link).toHaveAttribute('href', 'https://myapp.example.com');
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('profile shows no history when it has no last login', async ({ page }) => {
    await loadOptions(page, { syncData: { userProfiles: [TEST_PROFILE] } });
    await expect(page.locator('#user-list li')).toHaveCount(1, { timeout: 3000 });
    await expect(page.locator('.profile-item__site-link')).toHaveCount(0);
  });

  test('profile shows links for multiple sites', async ({ page }) => {
    await loadOptions(page, {
      syncData: {
        userProfiles: [TEST_PROFILE],
        lastLoginProfiles: {
          'https://site1.example.com': TEST_PROFILE.username,
          'https://site2.example.com': TEST_PROFILE.username,
        },
      },
    });
    await expect(page.locator('#user-list li')).toHaveCount(1, { timeout: 3000 });
    await expect(page.locator('.profile-item__site-link')).toHaveCount(2);
  });

  test('"Delete all profiles" shows confirmation modal with bulk message', async ({ page }) => {
    await loadOptions(page, { syncData: { userProfiles: [TEST_PROFILE] } });
    await page.locator('#set-to-defaults').click();
    await expect(page.locator('#confirm-modal')).toBeVisible();
    await expect(page.locator('#confirm-modal .modal-body p')).toContainText('all profiles');
  });
});

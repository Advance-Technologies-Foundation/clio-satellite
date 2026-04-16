/**
 * Real-site login tests for Clio Satellite.
 *
 * Run:
 *   BASE_URL=https://dev2.krylov.cloud npm run test:login
 *
 * Optional env vars:
 *   TEST_USER  (default: Supervisor)
 *   TEST_PASS  (default: Supervisor)
 */

import { test as base, expect, chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = path.resolve(__dirname, '../..');

const BASE_URL   = process.env.BASE_URL  || 'https://dev2.krylov.cloud';
const LOGIN_USER = process.env.TEST_USER || 'Supervisor';
const LOGIN_PASS = process.env.TEST_PASS || 'Supervisor';

// ─── Fixture: real Chrome with extension loaded ───────────────────────────────

const test = base.extend({
  context: [async ({}, use) => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-clio-'));
    const context = await chromium.launchPersistentContext(tmpDir, {
      headless: false, // extensions require headless:false; --headless=new arg handles actual headless
      args: [
        '--headless=new',
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-sandbox',
        '--disable-dev-shm-usage',
      ],
    });
    try {
      await use(context);
    } finally {
      await context.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }, { scope: 'test' }],

  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
  },
});

// ─── Helper: inject profiles into extension storage via service worker ────────

async function setStorageProfiles(context, profiles, lastLoginProfiles = {}) {
  // Service worker may already be running or may start shortly after context creation
  let sw = context.serviceWorkers()[0];
  if (!sw) {
    sw = await context.waitForEvent('serviceworker', { timeout: 8000 })
      .catch(() => { throw new Error('Extension service worker did not start — check extension path'); });
  }
  await sw.evaluate(async (data) => {
    await new Promise((resolve, reject) => {
      chrome.storage.sync.set(data, () => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve();
      });
    });
  }, { userProfiles: profiles, lastLoginProfiles });
}

const SUPERVISOR_PROFILE = {
  username: LOGIN_USER,
  password: LOGIN_PASS,
  alias:    'Test Supervisor',
  url:      BASE_URL,
  autologin: false,
};

// ─── Smoke: page loads ────────────────────────────────────────────────────────

test.describe('Smoke — login page', () => {
  test('login form is present on the site', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });

    const username = page.locator('#loginEdit-el, input[type="text"], input[name*="user"]').first();
    const password = page.locator('#passwordEdit-el, input[type="password"]').first();

    await expect(username).toBeVisible({ timeout: 15000 });
    await expect(password).toBeVisible({ timeout: 5000 });
  });
});

// ─── Extension UI injection ───────────────────────────────────────────────────

test.describe('Extension UI — profile selector', () => {
  test('extension injects profile selector into the login form', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });

    const container = page.locator('.creatio-satelite-login-profiles-container');
    await expect(container).toBeVisible({ timeout: 15000 });

    await expect(page.locator('.creatio-satelite-login-profile-select')).toBeVisible();
    await expect(page.locator('.auto-login-button:not(.settings-button)')).toBeVisible();
    await expect(page.locator('.settings-button')).toBeVisible();
  });

  test('shows "Setup user in options" when storage is empty', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });

    const select = page.locator('.creatio-satelite-login-profile-select');
    await expect(select).toBeVisible({ timeout: 15000 });

    const optionText = await select.textContent();
    expect(optionText).toContain('Setup user in options');
  });

  test('saved profile appears in the dropdown', async ({ context, page }) => {
    await setStorageProfiles(context, [SUPERVISOR_PROFILE]);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });

    const select = page.locator('.creatio-satelite-login-profile-select');
    await expect(select).toBeVisible({ timeout: 15000 });

    // Profile option with the test username must be present
    const option = select.locator(`option[data-username="${LOGIN_USER}"]`);
    await expect(option).toHaveCount(1);
  });
});

// ─── Login flow ───────────────────────────────────────────────────────────────

test.describe('Login flow — real credentials', () => {
  test('Login with profile redirects to Creatio shell', async ({ context, page }) => {
    await setStorageProfiles(context, [SUPERVISOR_PROFILE]);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });

    const select   = page.locator('.creatio-satelite-login-profile-select');
    const loginBtn = page.locator('.auto-login-button:not(.settings-button)');

    await expect(loginBtn).toBeVisible({ timeout: 15000 });
    await select.selectOption({ value: LOGIN_USER });
    await loginBtn.click();

    // Creatio redirects to Shell after login
    await page.waitForURL(/shell/i, { timeout: 40000 });
    expect(page.url().toLowerCase()).toMatch(/shell/);
  });

  test('Satellite menu is visible in the shell after login', async ({ context, page }) => {
    await setStorageProfiles(context, [SUPERVISOR_PROFILE]);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });

    const loginBtn = page.locator('.auto-login-button:not(.settings-button)');
    await expect(loginBtn).toBeVisible({ timeout: 15000 });
    await page.locator('.creatio-satelite-login-profile-select').selectOption({ value: LOGIN_USER });
    await loginBtn.click();

    await page.waitForURL(/shell/i, { timeout: 40000 });

    // Both satellite buttons must appear in the shell
    await expect(page.locator('.scripts-menu-button')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('.actions-button')).toBeVisible();
  });
});

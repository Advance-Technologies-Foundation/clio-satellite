import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupChromeMock } from './helpers.js';

const BASE = 'http://localhost:3737';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = f => readFileSync(path.join(ROOT, f), 'utf8');

const PROFILES = [
  { alias: 'Admin', username: 'Supervisor', password: 'test', url: '', autologin: false },
];

async function loadLoginPanel(page) {
  await setupChromeMock(page, { syncData: { userProfiles: PROFILES } });
  await page.goto(`${BASE}/login/`);
  await page.addStyleTag({ content: read('styles/login.css') });
  await page.addScriptTag({ content: read('login/login-events.js') });
  await page.addScriptTag({ content: read('login/login.js') });
  await page.waitForSelector('.creatio-satelite-login-profiles-container');
}

test.describe('Login page profile panel', () => {
  test('is one row: profile selector and login with profile', async ({ page }) => {
    await loadLoginPanel(page);
    const order = await page.$$eval(
      '.creatio-satelite-login-profiles-container > *',
      els => els.map(e => e.className)
    );
    expect(order).toHaveLength(2);
    expect(order[0]).toContain('creatio-satelite-login-profile-select');
    expect(order[1]).toContain('login-with-profile-button');
    const select = await page.locator('.creatio-satelite-login-profile-select').boundingBox();
    const login = await page.locator('.login-with-profile-button').boundingBox();
    expect(Math.abs(select.y - login.y)).toBeLessThan(1);
  });

  test('row is as wide and as tall as the native login button', async ({ page }) => {
    await loadLoginPanel(page);
    const row = await page.locator('.creatio-satelite-login-profiles-container').boundingBox();
    expect(Math.round(row.width)).toBe(300);
    expect(Math.round(row.height)).toBe(34);
  });

  test('the dropdown lists profiles first, then the extension pages', async ({ page }) => {
    await loadLoginPanel(page);
    const options = await page.locator('.creatio-satelite-login-profile-select option').allTextContents();
    expect(options).toEqual(['Admin (Supervisor)', 'Manage profiles…', 'Environments…']);
    await expect(page.locator('.creatio-satelite-login-profile-select optgroup')).toHaveAttribute('label', 'Clio satellite');
  });

  for (const [text, action] of [['Manage profiles…', 'openOptionsPage'], ['Environments…', 'openEnvironmentsPage']]) {
    test(`choosing "${text}" opens the page and keeps the profile selected`, async ({ page }) => {
      await loadLoginPanel(page);
      await page.evaluate(() => {
        window.__sent = [];
        chrome.runtime.sendMessage = (m) => window.__sent.push(m);
      });
      const select = page.locator('.creatio-satelite-login-profile-select');
      await select.selectOption({ label: text });
      expect(await page.evaluate(() => window.__sent)).toEqual([{ action }]);
      await expect(select).toHaveValue('Supervisor');
    });
  }

  test('login with profile is an orange icon button with an accessible name', async ({ page }) => {
    await loadLoginPanel(page);
    const btn = page.getByRole('button', { name: 'Login with profile' });
    await expect(btn).toHaveAttribute('title', 'Login with profile');
    await expect(btn).toHaveCSS('background-color', 'rgb(255, 87, 34)');
    const accent = await btn.evaluate(el => getComputedStyle(el).getPropertyValue('--csl-icon-accent').trim());
    expect(accent).toBe('#ffffff');
    await expect(btn.locator('svg')).toHaveCount(1);
  });
});

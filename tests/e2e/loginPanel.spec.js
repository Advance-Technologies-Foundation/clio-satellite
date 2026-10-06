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
  test('is one row: profile selector, login with profile, settings', async ({ page }) => {
    await loadLoginPanel(page);
    const order = await page.$$eval(
      '.creatio-satelite-login-profiles-container > *',
      els => els.map(e => e.className)
    );
    expect(order).toHaveLength(3);
    expect(order[0]).toContain('creatio-satelite-login-profile-select');
    expect(order[1]).toContain('login-with-profile-button');
    expect(order[2]).toContain('settings-button');

    const boxes = await Promise.all(
      ['.creatio-satelite-login-profile-select', '.login-with-profile-button', '.settings-button']
        .map(sel => page.locator(sel).boundingBox())
    );
    for (const b of boxes) expect(Math.abs(b.y - boxes[0].y)).toBeLessThan(1);
  });

  test('row is as wide and as tall as the native login button', async ({ page }) => {
    await loadLoginPanel(page);
    const row = await page.locator('.creatio-satelite-login-profiles-container').boundingBox();
    expect(Math.round(row.width)).toBe(300);
    expect(Math.round(row.height)).toBe(34);
  });

  test('icon-only buttons have accessible names and tooltips', async ({ page }) => {
    await loadLoginPanel(page);
    await expect(page.getByRole('button', { name: 'Login with profile' })).toHaveAttribute('title', 'Login with profile');
    await expect(page.getByRole('button', { name: 'Clio satellite settings' })).toHaveAttribute('title', 'Clio satellite settings');
  });

  test('login with profile is the orange primary action, settings is neutral', async ({ page }) => {
    await loadLoginPanel(page);
    await expect(page.locator('.login-with-profile-button')).toHaveCSS('background-color', 'rgb(255, 87, 34)');
    await expect(page.locator('.settings-button')).not.toHaveClass(/auto-login-button/);
    await expect(page.locator('.settings-button')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  });

  test('settings opens the extension options page', async ({ page }) => {
    await loadLoginPanel(page);
    await page.evaluate(() => {
      window.__sent = [];
      chrome.runtime.sendMessage = (m) => window.__sent.push(m);
    });
    await page.locator('.settings-button').click();
    expect(await page.evaluate(() => window.__sent)).toEqual([{ action: 'openOptionsPage' }]);
  });

  test('button icons are inline duotone SVGs; the accent turns white on the orange button', async ({ page }) => {
    await loadLoginPanel(page);
    await expect(page.locator('.creatio-satelite-login-profiles-container .creatio-satelite-login-icon svg')).toHaveCount(2);
    const accent = await page.locator('.login-with-profile-button').evaluate(el => getComputedStyle(el).getPropertyValue('--csl-icon-accent').trim());
    expect(accent).toBe('#ffffff');
  });
});

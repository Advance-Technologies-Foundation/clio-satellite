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
  test('primary action comes right after the profile selector', async ({ page }) => {
    await loadLoginPanel(page);
    const order = await page.$$eval(
      '.creatio-satelite-login-profiles-container > *',
      els => els.map(e => e.className)
    );
    expect(order[0]).toContain('creatio-satelite-login-header');
    expect(order[1]).toContain('creatio-satelite-login-profile-select');
    expect(order[2]).toContain('login-with-profile-button');
    expect(order[3]).toContain('creatio-satelite-login-secondary-row');
  });

  test('Environments and Profiles buttons share one row', async ({ page }) => {
    await loadLoginPanel(page);
    const env = await page.locator('.environments-button').boundingBox();
    const profiles = await page.locator('.settings-button').boundingBox();
    expect(Math.abs(env.y - profiles.y)).toBeLessThan(1);
    expect(profiles.x).toBeGreaterThan(env.x + env.width - 1);
  });

  test('panel width matches the native login button', async ({ page }) => {
    await loadLoginPanel(page);
    const panel = await page.locator('.creatio-satelite-login-profiles-container').boundingBox();
    expect(Math.round(panel.width)).toBe(300);
  });

  test('login with profile button uses sentence case and the accent color', async ({ page }) => {
    await loadLoginPanel(page);
    const btn = page.locator('.login-with-profile-button');
    await expect(btn).toHaveText('Login with profile');
    await expect(btn).toHaveCSS('text-transform', 'none');
    await expect(btn).toHaveCSS('background-color', 'rgb(255, 87, 34)');
  });

  test('secondary buttons are not styled as the primary action', async ({ page }) => {
    await loadLoginPanel(page);
    await expect(page.locator('.environments-button')).not.toHaveClass(/auto-login-button/);
    await expect(page.locator('.settings-button')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  });

  test('button icons are inline duotone SVGs; the accent turns white on the orange button', async ({ page }) => {
    await loadLoginPanel(page);
    await expect(page.locator('.creatio-satelite-login-profiles-container .creatio-satelite-login-icon svg')).toHaveCount(3);
    const accent = await page.locator('.login-with-profile-button').evaluate(el => getComputedStyle(el).getPropertyValue('--csl-icon-accent').trim());
    expect(accent).toBe('#ffffff');
  });
});

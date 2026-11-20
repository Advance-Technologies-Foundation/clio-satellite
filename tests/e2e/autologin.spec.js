import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupChromeMock } from './helpers.js';

const BASE = 'http://localhost:3737';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = f => readFileSync(path.join(ROOT, f), 'utf8');

const PROFILE = { alias: '', username: 'Supervisor', password: 'secret-pass', url: '', autologin: true };

// Mimics the Creatio login page: a field's DOM value reaches the view model only on that field's
// blur, and the login button validates the model, not the DOM ("Enter a value" when empty).
// With unfocusedWindow, focus() fires no focus/blur events, as in a Chrome window without focus.
function creatioLoginModel({ unfocusedWindow }) {
  // Real chrome.storage answers asynchronously, after login.js has added its panel
  const syncGet = chrome.storage.sync.get;
  chrome.storage.sync.get = (defaults, cb) => syncGet(defaults, r => setTimeout(() => cb(r), 0));
  const localGet = chrome.storage.local.get;
  const localSet = chrome.storage.local.set;
  // Like Chrome: async, and the callback gets a copy, not the stored array
  chrome.storage.local.get = (keys, cb) => setTimeout(() => localGet(keys, r => cb(JSON.parse(JSON.stringify(r)))), 0);
  window.__readLocalNow = localGet;
  chrome.storage.local.set = (data, cb) => setTimeout(() => localSet(data, cb), 0);
  window.__model = { login: '', password: '' };
  window.__loginRequests = [];
  if (unfocusedWindow) HTMLElement.prototype.focus = function () {};
  document.addEventListener('DOMContentLoaded', () => {
    const user = document.querySelector('#loginEdit-el');
    const pass = document.querySelector('#passwordEdit-el');
    user.addEventListener('blur', () => { window.__model.login = user.value; });
    pass.addEventListener('blur', () => { window.__model.password = pass.value; });
    document.querySelector('button[type="submit"]').addEventListener('click', (e) => {
      e.preventDefault();
      if (!window.__model.login || !window.__model.password) {
        const msg = document.createElement('div');
        msg.className = 'base-edit-validation';
        msg.textContent = 'Enter a value';
        user.parentElement.appendChild(msg);
        return;
      }
      window.__loginRequests.push({ ...window.__model });
    });
  });
}

async function openLoginPage(page, { unfocusedWindow = false, lastUser = 'Supervisor', profile = PROFILE } = {}) {
  await setupChromeMock(page, {
    syncData: {
      userProfiles: [profile],
      lastLoginProfiles: lastUser ? { [BASE]: { username: lastUser, timestamp: 1 } } : {},
    },
  });
  await page.addInitScript(creatioLoginModel, { unfocusedWindow });
  await page.goto(`${BASE}/login/`);
  await page.addScriptTag({ content: read('login/login-events.js') });
  await page.addScriptTag({ content: read('login/login.js') });
  await page.waitForSelector('.creatio-satelite-login-profiles-container');
}

const readLog = page => page.evaluate(() => new Promise(r =>
  window.__readLocalNow({ autologinLog: [] }, d => r(d.autologinLog || []))));

test.describe('Autologin on the Creatio login page', () => {
  test('logs in when the window has focus', async ({ page }) => {
    await openLoginPage(page);
    await expect.poll(() => page.evaluate(() => window.__loginRequests)).toEqual([
      { login: 'Supervisor', password: 'secret-pass' },
    ]);
  });

  test('logs in when the window has no focus (focus() fires no blur)', async ({ page }) => {
    await openLoginPage(page, { unfocusedWindow: true });
    await expect.poll(() => page.evaluate(() => window.__loginRequests)).toEqual([
      { login: 'Supervisor', password: 'secret-pass' },
    ]);
    await expect(page.locator('.base-edit-validation')).toHaveCount(0);
  });

  test('writes the decisions to the local log without the password', async ({ page }) => {
    await openLoginPage(page);
    await expect.poll(async () => (await readLog(page)).map(e => e.event))
      .toEqual(['form-found', 'autologin-start', 'login-clicked']);
    const log = await readLog(page);
    expect(log[2]).toMatchObject({ trigger: 'autologin', usernameFilled: true, origin: BASE });
    expect(log[1]).toHaveProperty('hasFocus');
    expect(log[1]).toHaveProperty('visibility');
    expect(JSON.stringify(log)).not.toContain('secret-pass');
  });

  test('logs why autologin did not start when the last profile is gone', async ({ page }) => {
    await openLoginPage(page, { lastUser: 'DeletedUser' });
    await expect.poll(async () => (await readLog(page)).map(e => e.reason).filter(Boolean))
      .toEqual(['last used profile is not in the list for this site']);
    await expect(page.locator('.creatio-satelite-login-profile-select')).toHaveValue('Supervisor');
    expect(await page.evaluate(() => window.__loginRequests)).toEqual([]);
  });

  test('logs that autologin is off for the last used profile', async ({ page }) => {
    await openLoginPage(page, { profile: { ...PROFILE, autologin: false } });
    await expect.poll(async () => (await readLog(page)).map(e => e.reason).filter(Boolean))
      .toEqual(['autologin is off for the last used profile']);
  });

  test('logs the visible validation message when the page stays on the login form', async ({ page }) => {
    await page.clock.install();
    await openLoginPage(page, { lastUser: null });
    // The model ignores every value, so the mock answers the click with "Enter a value"
    await page.evaluate(() => { window.__model = new Proxy({}, { get: () => '', set: () => true }); });
    await page.locator('.login-with-profile-button').click();
    await page.clock.fastForward(9000);
    await page.clock.runFor(1000); // lets the queued log writes finish
    const stuck = (await readLog(page)).filter(e => e.event === 'still-on-login-page');
    expect(stuck).toEqual([expect.objectContaining({ trigger: 'button', messages: ['Enter a value'] })]);
  });
});

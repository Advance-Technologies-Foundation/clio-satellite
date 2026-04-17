import { test, expect } from '@playwright/test';
import { setupChromeMock, injectContentScript, waitForMenu } from './helpers.js';

const BASE = 'http://localhost:3737';

async function load(page, path) {
  await setupChromeMock(page);
  await page.goto(`${BASE}${path}`);
  await injectContentScript(page);
}

// ─── Shell page ───────────────────────────────────────────────────────────────

test.describe('Shell page', () => {
  test('menu container appears after page load', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);
    await expect(page.locator('.creatio-satelite-extension-container')).toBeAttached();
  });

  test('scripts and actions buttons are rendered', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);
    await expect(page.locator('.scripts-menu-button')).toBeVisible();
    await expect(page.locator('.actions-button')).toBeVisible();
  });

  test('scripts menu opens when button is clicked', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    await page.locator('.scripts-menu-button').click();
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/visible/);
  });

  test('scripts menu closes when clicking outside', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    await page.locator('.scripts-menu-button').click();
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/visible/);

    await page.mouse.click(10, 400); // click far from menu
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/hidden/);
  });

  test('actions menu opens when button is clicked', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    await page.locator('.actions-button').click();
    await expect(page.locator('.actions-menu-container')).toHaveClass(/visible/);
  });

  test('drag sets data-user-positioned and moves the container', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    const floating = page.locator('.creatio-satelite-floating');
    const box = await floating.boundingBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 150, cy + 80, { steps: 10 });
    await page.mouse.up();

    await expect(floating).toHaveAttribute('data-user-positioned', 'true');
    const newBox = await floating.boundingBox();
    expect(newBox.x).toBeGreaterThan(box.x + 100);
  });

  test('double-click removes data-user-positioned', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    const floating = page.locator('.creatio-satelite-floating');

    // Simulate a prior drag by setting the attribute programmatically
    await page.evaluate(() => {
      document.querySelector('.creatio-satelite-floating').setAttribute('data-user-positioned', 'true');
    });
    await expect(floating).toHaveAttribute('data-user-positioned', 'true');

    // Dispatch dblclick directly — tests the handler without actionability checks
    // (avoids menu-open-covers-element issue that real dblclick causes)
    await floating.dispatchEvent('dblclick');
    await expect(floating).not.toHaveAttribute('data-user-positioned');
  });

  test('only one menu container is created on concurrent calls', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);
    await expect(page.locator('.creatio-satelite-extension-container')).toHaveCount(1);
  });

  test('clicking scripts button again closes the menu (toggle)', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    await page.locator('.scripts-menu-button').click();
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/visible/);

    await page.locator('.scripts-menu-button').click();
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/hidden/);
  });

  test('clicking actions button again closes the menu (toggle)', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    await page.locator('.actions-button').click();
    await expect(page.locator('.actions-menu-container')).toHaveClass(/visible/);

    await page.locator('.actions-button').click();
    await expect(page.locator('.actions-menu-container')).toHaveClass(/hidden/);
  });

  test('opening actions menu closes the scripts menu', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    await page.locator('.scripts-menu-button').click();
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/visible/);

    await page.locator('.actions-button').click();
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/hidden/);
    await expect(page.locator('.actions-menu-container')).toHaveClass(/visible/);
  });

  test('actions menu contains RestartApp and FlushRedisDB items', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    await page.locator('.actions-button').click();
    await expect(page.locator('.actions-menu-container')).toHaveClass(/visible/);

    await expect(page.locator('[data-item-marker="RestartApp"]')).toBeVisible();
    await expect(page.locator('[data-item-marker="FlushRedisDB"]')).toBeVisible();
  });
});

// ─── Login page ──────────────────────────────────────────────────────────────

test.describe('Login page', () => {
  test('menu does not appear on login page', async ({ page }) => {
    await load(page, '/login/');
    await page.waitForTimeout(1500); // let initial timers fire
    await expect(page.locator('.creatio-satelite-extension-container')).toHaveCount(0);
  });
});

// ─── Configuration page ───────────────────────────────────────────────────────

test.describe('Configuration page', () => {
  test('menu appears on configuration page', async ({ page }) => {
    await load(page, '/configuration/');
    await waitForMenu(page);
    await expect(page.locator('.creatio-satelite-extension-container')).toBeAttached();
  });
});

// ─── Unknown page ─────────────────────────────────────────────────────────────

test.describe('Unknown page', () => {
  test('menu does not appear on unrecognized page', async ({ page }) => {
    await load(page, '/other/');
    await page.waitForTimeout(1500);
    await expect(page.locator('.creatio-satelite-extension-container')).toHaveCount(0);
  });
});

// ─── Excluded domains ─────────────────────────────────────────────────────────

// Shell-like HTML used to verify the exclusion is domain-based, not content-based.
// A page with these elements would normally trigger shell detection.
const SHELL_LIKE_HTML = `<!DOCTYPE html><html><body>
  <crt-app-toolbar style="display:block;position:fixed;top:0;left:0;height:48px;width:100%;"></crt-app-toolbar>
  <crt-global-search style="display:block;position:fixed;top:4px;left:200px;width:300px;height:40px;"></crt-global-search>
</body></html>`;

test.describe('Excluded domains', () => {
  test('menu does not appear on academy.creatio.com even with shell-like content', async ({ page }) => {
    // Intercept the real domain so window.location.hostname === 'academy.creatio.com'
    await page.route('https://academy.creatio.com/**', route =>
      route.fulfill({ contentType: 'text/html', body: SHELL_LIKE_HTML })
    );

    await setupChromeMock(page);
    await page.goto('https://academy.creatio.com/courses', { waitUntil: 'domcontentloaded' });
    await injectContentScript(page);

    await page.waitForTimeout(1500);
    await expect(page.locator('.creatio-satelite-extension-container')).toHaveCount(0);
  });
});

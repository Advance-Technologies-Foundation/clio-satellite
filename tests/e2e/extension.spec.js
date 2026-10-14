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

  test('menu opens and item clicks are reported as anonymous usage events', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);
    await page.locator('.scripts-menu-button').click();
    // Unstyled test page: the items exist but are not laid out, so dispatch the clicks
    await page.locator('[data-item-marker="SysSettings"]').dispatchEvent('click');
    await page.locator('.actions-button').click();
    await page.locator('.actions-menu-container [data-item-marker="RestartApp"]').dispatchEvent('click');
    const events = await page.evaluate(() => window.__sentMessages.filter(m => m.action === 'trackEvent').map(m => [m.name, m.params]));
    expect(events).toEqual([
      ['menu_open', { menu: 'navigation' }],
      ['menu_click', { menu: 'navigation', item: 'SysSettings' }],
      ['menu_open', { menu: 'actions' }],
      ['menu_click', { menu: 'actions', item: 'RestartApp' }],
    ]);
  });

  test('menu items and buttons show duotone SVG icons that follow the hover colour', async ({ page }) => {
    await load(page, '/shell/');
    await page.addStyleTag({ url: '/styles/shell.css' });
    await page.addStyleTag({ url: '/menu-item.css' });
    await waitForMenu(page);
    await page.locator('.scripts-menu-button').click();
    await expect(page.locator('.scripts-menu-container mat-icon svg')).toHaveCount(9);
    await expect(page.locator('.scripts-menu-button svg')).toHaveCount(1);
    await expect(page.locator('.actions-button svg')).toHaveCount(1);

    const icon = page.locator('[data-item-marker="Users"] mat-icon');
    const normal = await icon.evaluate(el => getComputedStyle(el).color);
    await page.locator('[data-item-marker="Users"]').hover();
    await expect.poll(() => icon.evaluate(el => getComputedStyle(el).color)).not.toBe(normal);
  });

  test('buttons stay clickable while Creatio keeps <body> inert during loading', async ({ page }) => {
    await setupChromeMock(page);
    await page.goto(`${BASE}/shell/`);
    // Creatio sets `inert` on <body> until Shell finishes loading
    await page.evaluate(() => { document.body.inert = true; });
    await injectContentScript(page);
    await waitForMenu(page);

    await page.locator('.scripts-menu-button').click({ timeout: 2000 });
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/visible/);
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

// ─── Position next to the Creatio toolbar ────────────────────────────────────

test.describe('Initial position', () => {
  test('buttons do not cover Creatio controls placed right after the search (CPQ operator status)', async ({ page }) => {
    // Same layout as Creatio Shell with chats: search and operator status share one toolbar group
    await page.route(`${BASE}/cpq/shell/`, route => route.fulfill({ contentType: 'text/html', body: `<!DOCTYPE html><html><head>
      <style>* { transition: none !important; animation: none !important; }</style></head><body>
      <crt-app-toolbar style="display:block;position:fixed;top:0;left:0;height:56px;width:100%;">
        <div style="position:absolute;top:8px;left:16px;display:flex;gap:16px;align-items:center;height:40px;">
          <crt-global-search style="display:block;width:218px;height:32px;"></crt-global-search>
          <crt-operator-state style="display:block;width:108px;height:24px;"></crt-operator-state>
        </div>
      </crt-app-toolbar></body></html>` }));
    await load(page, '/cpq/shell/');
    await waitForMenu(page);
    const floating = page.locator('.creatio-satelite-floating');
    await expect.poll(async () => {
      const op = await page.locator('crt-operator-state').boundingBox();
      const box = await floating.boundingBox();
      return box && op && box.x >= op.x + op.width;
    }, { timeout: 5000 }).toBe(true);
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

// ─── Dragging and the edge blob ──────────────────────────────────────────────

test.describe('Dragging the buttons', () => {
  test('releasing a drag over a button does not open its menu', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    const button = page.locator('.scripts-menu-button');
    const box = await button.boundingBox();
    await page.mouse.move(box.x + 20, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 220, box.y + 200, { steps: 10 });
    await page.mouse.up();   // the mouse is still over the same button

    await expect(page.locator('.creatio-satelite-floating')).toHaveAttribute('data-user-positioned', 'true');
    await expect(page.locator('.scripts-menu-container')).not.toHaveClass(/visible/);
  });

  test('a click on a button still opens its menu', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    await page.locator('.scripts-menu-button').click();
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/visible/);
    await expect(page.locator('.creatio-satelite-floating')).not.toHaveAttribute('data-user-positioned', 'true');
  });
});

test.describe('Edge blob', () => {
  // Drags the buttons to the left edge and then `past` px further, without releasing the mouse
  async function pushIntoLeftEdge(page, past) {
    // the container box is smaller than the absolutely positioned buttons: measure the buttons
    const box = await page.locator('.creatio-satelite').boundingBox();
    const grabX = box.x + 60, grabY = box.y + box.height / 2;
    await page.mouse.move(grabX, grabY);
    await page.mouse.down();
    await page.mouse.move(400, 400, { steps: 8 });
    const touchX = grabX - box.x;   // cursor x at which the buttons touch the left edge
    await page.mouse.move(touchX, 400, { steps: 8 });
    await page.mouse.move(touchX - past, 400, { steps: 4 });
  }

  test('pushing the buttons 20px past the edge turns them into a blob without releasing the mouse', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    await pushIntoLeftEdge(page, 10);
    await expect(page.locator('.csl-edge-wet')).toBeVisible();
    await expect(page.locator('.csl-edge-blob')).toBeHidden();

    await page.mouse.move(25, 400, { steps: 4 });   // 35px past the edge
    await expect(page.locator('.csl-edge-blob')).toBeVisible();
    await expect(page.locator('.creatio-satelite-floating')).toHaveAttribute('data-edge-docked', 'left');
    await expect(page.locator('.scripts-menu-button')).toBeHidden();
    await page.mouse.up();

    const blob = await page.locator('.csl-edge-blob').boundingBox();
    expect(blob.x).toBe(0);
  });

  test('releasing the mouse right after the buttons became a blob does not open a menu', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    await pushIntoLeftEdge(page, 40);
    await page.mouse.up();   // the buttons are still squashing under the cursor
    await expect(page.locator('.creatio-satelite-floating')).toHaveAttribute('data-edge-docked', 'left');
    await page.waitForTimeout(300);
    await expect(page.locator('.scripts-menu-container')).not.toHaveClass(/visible/);
    await expect(page.locator('.actions-menu-container')).not.toHaveClass(/visible/);
  });

  test('releasing before the press distance leaves the buttons as they are', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    await pushIntoLeftEdge(page, 10);
    await page.mouse.up();
    await expect(page.locator('.csl-edge-wet')).toBeHidden();
    await expect(page.locator('.csl-edge-blob')).toBeHidden();
    await expect(page.locator('.scripts-menu-button')).toBeVisible();
  });

  async function dockAtLeftEdge(page) {
    await pushIntoLeftEdge(page, 40);
    await page.mouse.up();
    await expect(page.locator('.csl-edge-blob')).toBeVisible();
    await page.waitForTimeout(800);   // let the splat animation finish
    await page.mouse.move(600, 600);
    return page.locator('.csl-edge-hit').boundingBox();
  }

  test('a click on the blob brings the buttons out next to the edge with both menus open, still docked', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    const hit = await dockAtLeftEdge(page);
    await page.mouse.click(hit.x + 5, hit.y + hit.height / 2);

    await expect(page.locator('.scripts-menu-button')).toBeVisible();
    await expect(page.locator('.creatio-satelite-floating')).toHaveAttribute('data-edge-peek', 'left');
    await expect(page.locator('.csl-edge-blob')).toBeHidden();
    expect((await page.locator('.creatio-satelite').boundingBox()).x).toBe(8);
    // two clicks to any action: the blob, then the menu item
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/visible/);
    await expect(page.locator('.actions-menu-container')).toHaveClass(/visible/);
  });

  test('the orange dot of the blob flies into the dot on the icon of the first button', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    const hit = await dockAtLeftEdge(page);
    const start = await page.locator('.csl-edge-dot').boundingBox();
    await page.mouse.click(hit.x + 5, hit.y + hit.height / 2);

    const flyer = page.locator('.csl-edge-flydot');
    await expect(flyer).toBeVisible();
    const iconDot = page.locator('.scripts-menu-button .csl-icon-dot');
    await expect(iconDot).toHaveCSS('visibility', 'hidden');
    // it lands on the icon dot and leaves the icon dot visible
    await expect(flyer).toHaveCount(0);
    await expect(iconDot).toHaveCSS('visibility', 'visible');
    const end = await iconDot.boundingBox();
    expect(end.x).toBeGreaterThan(start.x);
  });

  test('resting the mouse on the blob for 2 seconds brings the buttons out; a shorter hover does not', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    const hit = await dockAtLeftEdge(page);
    await page.mouse.move(hit.x + 5, hit.y + hit.height / 2, { steps: 4 });
    await page.waitForTimeout(1200);
    await expect(page.locator('.scripts-menu-button')).toBeHidden();
    await page.waitForTimeout(1200);
    await expect(page.locator('.scripts-menu-button')).toBeVisible();
    await expect(page.locator('.creatio-satelite-floating')).toHaveAttribute('data-edge-peek', 'left');
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/visible/);
    await expect(page.locator('.actions-menu-container')).toHaveClass(/visible/);
  });

  test('the buttons go back into the blob 10 seconds after the mouse left them', async ({ page }) => {
    test.setTimeout(40000);
    await load(page, '/shell/');
    await waitForMenu(page);

    const hit = await dockAtLeftEdge(page);
    await page.mouse.click(hit.x + 5, hit.y + hit.height / 2);
    await expect(page.locator('.scripts-menu-button')).toBeVisible();

    // working with the buttons: both menus are open and the mouse is on the buttons
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/visible/);
    await page.locator('.scripts-menu-button').hover();
    await page.waitForTimeout(11000);
    await expect(page.locator('.scripts-menu-button')).toBeVisible();

    await page.mouse.move(800, 600, { steps: 4 });
    await page.waitForTimeout(9000);
    await expect(page.locator('.scripts-menu-button')).toBeVisible();
    await expect(page.locator('.csl-edge-blob')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('.scripts-menu-button')).toBeHidden();
    await expect(page.locator('.creatio-satelite-floating')).toHaveAttribute('data-edge-docked', 'left');
    await expect(page.locator('.scripts-menu-container')).not.toHaveClass(/visible/);
    await expect(page.locator('.actions-menu-container')).not.toHaveClass(/visible/);
  });

  test('a click on the page sends the buttons out of the blob back into it with their menus', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    const hit = await dockAtLeftEdge(page);
    await page.mouse.click(hit.x + 5, hit.y + hit.height / 2);
    await expect(page.locator('.actions-menu-container')).toHaveClass(/visible/);
    await page.waitForTimeout(500);   // let the pop-in finish

    await page.mouse.click(800, 600);
    await expect(page.locator('.creatio-satelite-floating')).toHaveAttribute('data-edge-docked', 'left');
    await expect(page.locator('.csl-edge-blob')).toBeVisible();
    await expect(page.locator('.scripts-menu-button')).toBeHidden();
    await expect(page.locator('.scripts-menu-container')).not.toHaveClass(/visible/);
    await expect(page.locator('.actions-menu-container')).not.toHaveClass(/visible/);
  });

  test('a click on a menu item of the buttons out of the blob runs it and closes both menus', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    const hit = await dockAtLeftEdge(page);
    await page.mouse.click(hit.x + 5, hit.y + hit.height / 2);
    await expect(page.locator('.actions-menu-container')).toHaveClass(/visible/);
    // Unstyled test page: the items exist but are not laid out, so dispatch the click
    await page.locator('[data-item-marker="SysSettings"]').dispatchEvent('click');
    await expect(page.locator('.scripts-menu-container')).not.toHaveClass(/visible/);
    await expect(page.locator('.actions-menu-container')).not.toHaveClass(/visible/);
  });

  test('a short pull of the blob keeps it docked', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    const hit = await dockAtLeftEdge(page);
    const y = hit.y + hit.height / 2;
    await page.mouse.move(hit.x + 5, y);
    await page.mouse.down();
    await page.mouse.move(hit.x + 5 + 20, y, { steps: 5 });   // less than a button is high
    await page.mouse.up();
    await expect(page.locator('.csl-edge-blob')).toBeVisible();
    await expect(page.locator('.creatio-satelite-floating')).toHaveAttribute('data-edge-docked', 'left');
  });

  test('pulling the blob away from the edge tears it off into the buttons that keep following the mouse', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    await pushIntoLeftEdge(page, 40);
    await page.mouse.up();
    await expect(page.locator('.csl-edge-blob')).toBeVisible();
    await page.waitForTimeout(800);   // let the splat animation finish
    const hit = await page.locator('.csl-edge-hit').boundingBox();
    await page.mouse.move(hit.x + 5, hit.y + hit.height / 2);
    await page.mouse.down();
    await page.mouse.move(150, hit.y + hit.height / 2, { steps: 10 });
    await page.mouse.move(500, 300, { steps: 10 });
    await page.mouse.up();

    await expect(page.locator('.scripts-menu-button')).toBeVisible();
    await expect(page.locator('.csl-edge-blob')).toBeHidden();
    const box = await page.locator('.creatio-satelite').boundingBox();
    expect(box.x + box.width / 2).toBeGreaterThan(450);
    expect(box.x + box.width / 2).toBeLessThan(550);
  });

  test('the blob from the previous visit is restored right away', async ({ page }) => {
    await setupChromeMock(page);
    await page.addInitScript(() => {
      chrome.storage.local.set({ 'menuEdgeBlob_shell_http://localhost:3737': { edge: 'right', along: 0.5, timestamp: Date.now() } });
    });
    await page.goto(`${BASE}/shell/`);
    await injectContentScript(page);

    await expect(page.locator('.csl-edge-blob')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.scripts-menu-button')).toBeHidden();
    const blob = await page.locator('.csl-edge-blob').boundingBox();
    expect(Math.round(blob.x + blob.width)).toBe(1280);
  });
});

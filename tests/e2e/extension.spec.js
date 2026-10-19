import { readFileSync } from 'fs';
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

  test('one button is rendered, no separate actions button', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);
    await expect(page.locator('.scripts-menu-button')).toBeVisible();
    await expect(page.locator('.actions-button')).toHaveCount(0);
  });

  test('the menu opens when the button is clicked, with no separate actions menu', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    await page.locator('.scripts-menu-button').click();
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/visible/);
    await expect(page.locator('.actions-menu-container')).toHaveCount(0);
  });

  test('the menu closes when clicking outside', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    await page.locator('.scripts-menu-button').click();
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/visible/);

    await page.mouse.click(10, 400); // click far from menu
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/hidden/);
  });

  test('the actions open in a right-hand column of the same panel, top-aligned with the navigation', async ({ page }) => {
    await load(page, '/shell/');
    await page.addStyleTag({ url: '/styles/shell.css' });
    await page.addStyleTag({ url: '/menu-item.css' });
    await waitForMenu(page);
    await page.locator('.scripts-menu-button').click();
    const btn = await page.locator('.scripts-menu-button').boundingBox();
    const menu = page.locator('.scripts-menu-container');
    const panel = await menu.boundingBox();
    expect(panel.y).toBeGreaterThan(btn.y + btn.height - 1);
    const box = async marker => menu.locator(`[data-item-marker="${marker}"]`).boundingBox();
    const [features, settings, news, restart, flush] = [await box('Features'), await box('Settings'), await box('NewsArchive'), await box('RestartApp'), await box('FlushRedisDB')];
    expect(restart.x).toBeGreaterThanOrEqual(features.x + features.width);   // a column of its own
    expect(Math.abs(restart.y - features.y)).toBeLessThanOrEqual(1);          // starting at the same row
    expect(flush.y).toBeGreaterThan(restart.y);
    // Settings and the news book are icons in the bottom-right corner of the panel, the book rightmost,
    // below the short actions column: they add no row of their own
    expect(Math.abs(features.y - (panel.y + 7))).toBeLessThanOrEqual(2);
    expect(settings.y).toBeGreaterThanOrEqual(flush.y + flush.height);
    expect(Math.abs(news.y - settings.y)).toBeLessThanOrEqual(1);
    expect(news.x).toBeGreaterThanOrEqual(settings.x + settings.width);
    expect(panel.x + panel.width - (news.x + news.width)).toBeLessThanOrEqual(8);
    expect(panel.y + panel.height - (news.y + news.height)).toBeLessThanOrEqual(8);
    await expect(menu.locator('[data-item-marker="Settings"]')).toHaveAttribute('title', 'Settings');
    expect(restart.x + restart.width).toBeLessThanOrEqual(panel.x + panel.width);
    // both columns are as wide as the wider of their longest captions plus 20 px
    const gapAfterCaptions = sel => menu.locator(sel).evaluate(c => {
      const right = Math.max(...[...c.querySelectorAll('.caption')].map(x => {
        const r = document.createRange();
        r.selectNodeContents(x);
        return r.getBoundingClientRect().right;
      }));
      return c.getBoundingClientRect().right - right;
    });
    const [navGap, actGap] = [await gapAfterCaptions('.csl-nav-column'), await gapAfterCaptions('.csl-actions-section')];
    expect(Math.min(navGap, actGap)).toBeGreaterThanOrEqual(18);
    expect(Math.min(navGap, actGap)).toBeLessThanOrEqual(24);
    // and the divider stands in the middle of the panel: the halves look the same width
    const actBox = await menu.locator('.csl-actions-section').boundingBox();
    expect(Math.abs((actBox.x - panel.x) - (panel.x + panel.width - actBox.x))).toBeLessThanOrEqual(1);
    await expect(menu.locator('[data-item-marker="Application_Managment"] .caption')).toHaveText('App Hub');
  });

  test('with "icons at the top" in Options the icons are a header row in the top-right corner', async ({ page }) => {
    await setupChromeMock(page, { syncData: { menuIconsAtTop: true } });
    await page.goto(`${BASE}/shell/`);
    await injectContentScript(page);
    await page.addStyleTag({ url: '/styles/shell.css' });
    await page.addStyleTag({ url: '/menu-item.css' });
    await waitForMenu(page);
    await page.locator('.scripts-menu-button').click();
    const menu = page.locator('.scripts-menu-container');
    await expect(menu).toHaveClass(/csl-menu--icons-top/);
    const panel = await menu.boundingBox();
    const box = async marker => menu.locator(`[data-item-marker="${marker}"]`).boundingBox();
    const [features, settings, news] = [await box('Features'), await box('Settings'), await box('NewsArchive')];
    expect(settings.y + settings.height).toBeLessThanOrEqual(features.y);
    expect(news.y - panel.y).toBeLessThanOrEqual(8);
    expect(panel.x + panel.width - (news.x + news.width)).toBeLessThanOrEqual(8);
  });

  test('menu opens and item clicks are reported as anonymous usage events', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);
    await page.locator('.scripts-menu-button').click();
    // Unstyled test page: the items exist but are not laid out, so dispatch the clicks
    await page.locator('[data-item-marker="SysSettings"]').dispatchEvent('click');
    await page.locator('.scripts-menu-button').click();
    await page.locator('.scripts-menu-container [data-item-marker="RestartApp"]').dispatchEvent('click');
    const events = await page.evaluate(() => window.__sentMessages.filter(m => m.action === 'trackEvent').map(m => [m.name, m.params]));
    expect(events).toEqual([
      ['menu_open', { menu: 'navigation' }],
      ['menu_click', { menu: 'navigation', item: 'SysSettings' }],
      ['menu_open', { menu: 'navigation' }],
      ['menu_click', { menu: 'actions', item: 'RestartApp' }],
    ]);
  });

  test('menu items and buttons show duotone SVG icons that follow the hover colour', async ({ page }) => {
    await load(page, '/shell/');
    await page.addStyleTag({ url: '/styles/shell.css' });
    await page.addStyleTag({ url: '/menu-item.css' });
    await waitForMenu(page);
    await page.locator('.scripts-menu-button').click();
    await expect(page.locator('.scripts-menu-container mat-icon svg')).toHaveCount(10);
    await expect(page.locator('.scripts-menu-container .csl-menu-icon-btn svg')).toHaveCount(2);
    await expect(page.locator('.scripts-menu-button svg')).toHaveCount(1);

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

  test('clicking the button again closes the menu (toggle)', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    await page.locator('.scripts-menu-button').click();
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/visible/);

    await page.locator('.scripts-menu-button').click();
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/hidden/);
  });

  test('the menu contains the RestartApp and FlushRedisDB actions', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    await page.locator('.scripts-menu-button').click();
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/visible/);

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
  });

  test('holding the cursor a few pixels from the bottom edge docks the buttons grabbed at their lower edge', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);
    const vh = await page.evaluate(() => document.documentElement.clientHeight);
    const box = await page.locator('.creatio-satelite').boundingBox();
    // grabbed at the lowest pixel of the buttons: the cursor stops before they cross the edge
    const x = box.x + 20, y = box.y + box.height - 1;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 200, vh - 3, { steps: 12 });
    await page.waitForTimeout(900);
    await expect(page.locator('.creatio-satelite-floating')).toHaveAttribute('data-edge-docked', 'bottom');
    await page.mouse.up();
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

  test('buttons out of the blob dragged along the edge take the blob with them', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);
    const hit = await dockAtLeftEdge(page);
    await page.mouse.click(hit.x + 5, hit.y + hit.height / 2);
    await page.waitForTimeout(600);
    const b = await page.locator('.creatio-satelite').boundingBox();
    await page.mouse.move(b.x + 10, b.y + 10);
    await page.mouse.down();
    await page.mouse.move(b.x + 20, b.y + 160, { steps: 8 });   // down along the edge, a little away from it
    await page.mouse.up();
    await page.waitForTimeout(600);
    const moved = await page.locator('.creatio-satelite').boundingBox();
    expect(moved.x).toBe(8);   // back at the edge
    expect(moved.y).toBeGreaterThan(b.y + 100);   // but further down
    await page.mouse.click(900, 600);   // the buttons go back into the blob at the new spot
    await page.waitForTimeout(600);
    const blob = await page.locator('.csl-edge-blob').boundingBox();
    expect(Math.abs(blob.y + blob.height / 2 - (moved.y + moved.height / 2))).toBeLessThan(30);
  });

  test('a blob on the right edge stays above a fixed panel of the page', async ({ page }) => {
    await setupChromeMock(page);
    await page.addInitScript(() => {
      chrome.storage.local.set({ 'menuEdgeBlob_shell_http://localhost:3737': { edge: 'right', along: 0.5, timestamp: Date.now() } });
    });
    await page.goto(`${BASE}/shell/`);
    await page.evaluate(() => {
      const panel = document.createElement('div');
      panel.style.cssText = 'position: fixed; right: 0; top: 0; width: 50px; height: 100vh; background: #1e2836; z-index: 5000;';
      document.body.appendChild(panel);
    });
    await injectContentScript(page);
    await expect(page.locator('.csl-edge-blob')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(600);
    const hit = await page.locator('.csl-edge-hit').boundingBox();
    const top = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.className, { x: hit.x + hit.width / 2, y: hit.y + hit.height / 2 });
    expect(top).toBe('csl-edge-hit');
  });

  test('buttons out of the blob sit in a dark pool; a short drag puts them back, a long one frees them for good', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);
    const hit = await dockAtLeftEdge(page);
    await page.mouse.click(hit.x + 5, hit.y + hit.height / 2);
    const pool = page.locator('.csl-edge-pool');
    await expect(pool).toBeVisible();
    await page.waitForTimeout(500);
    const p = await pool.locator('path').boundingBox();
    const b = await page.locator('.creatio-satelite').boundingBox();
    expect(p.x).toBeLessThanOrEqual(0);   // starts at the screen edge
    expect(p.x + p.width).toBeGreaterThanOrEqual(b.x + b.width);
    expect(p.y).toBeLessThan(b.y);
    expect(p.y + p.height).toBeGreaterThan(b.y + b.height);
    // the buttons lie on the pool, not under it
    expect(await page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('.creatio-satelite'), { x: b.x + b.width / 2, y: b.y + b.height / 2 })).toBe(true);

    // dragged less than a button is high: back into the pool, still docked
    const x = b.x + 10, y = b.y + 10;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 20, y, { steps: 4 });
    await page.mouse.up();
    await expect(page.locator('.creatio-satelite-floating')).toHaveAttribute('data-edge-peek', 'left');
    await expect.poll(async () => (await page.locator('.creatio-satelite').boundingBox()).x).toBe(8);

    // dragged further: the pool tears, the buttons stay where they were let go
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 200, y + 40, { steps: 10 });
    await page.mouse.up();
    await expect(page.locator('.creatio-satelite-floating')).not.toHaveAttribute('data-edge-peek', /./);
    await expect(pool).toBeHidden();
    const free = await page.locator('.creatio-satelite').boundingBox();
    expect(free.x).toBeGreaterThan(150);
    // no blob comes back, not even on the next visit
    const key = 'menuEdgeBlob_shell_http://localhost:3737';
    expect(await page.evaluate(k => new Promise(r => chrome.storage.local.get([k], res => r(res[k] ?? null))), key)).toBeNull();
    await page.mouse.move(600, 600);
    await page.waitForTimeout(500);
    await expect(page.locator('.csl-edge-blob')).toBeHidden();
  });

  test('a click on the blob brings the buttons out next to the edge with the menu open, still docked', async ({ page }) => {
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
  });

  test('the unpin button next to the buttons out of the blob frees them for good', async ({ page }) => {
    await load(page, '/shell/');
    await page.addStyleTag({ content: readFileSync('menu-item.css', 'utf8') });
    await waitForMenu(page);
    const unpin = page.locator('.csl-unpin-button');
    await expect(unpin).toBeHidden();

    const hit = await dockAtLeftEdge(page);
    await page.mouse.click(hit.x + 5, hit.y + hit.height / 2);
    await expect(unpin).toBeVisible();
    await expect(unpin).toHaveAttribute('aria-label', /Unpin/);
    await page.waitForTimeout(600);
    const before = await page.locator('.scripts-menu-button').boundingBox();
    // it sits right of the button
    expect((await unpin.boundingBox()).x).toBeGreaterThanOrEqual(before.x + before.width - 1);

    await unpin.click();
    await expect(unpin).toBeHidden();
    await expect(page.locator('.creatio-satelite-floating')).not.toHaveAttribute('data-edge-peek', /./);
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/hidden/);
    const after = await page.locator('.scripts-menu-button').boundingBox();
    expect(after.x).toBe(before.x);
    expect(after.y).toBe(before.y);
    const key = 'menuEdgeBlob_shell_http://localhost:3737';
    expect(await page.evaluate(k => new Promise(r => chrome.storage.local.get([k], res => r(res[k] ?? null))), key)).toBeNull();
    // the buttons stay out: no countdown, no blob
    await page.mouse.move(600, 600);
    await page.mouse.click(600, 600);
    await page.waitForTimeout(500);
    await expect(page.locator('.scripts-menu-button')).toBeVisible();
    await expect(page.locator('.csl-edge-blob')).toBeHidden();
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
  });

  test('the buttons go back into the blob 10 seconds after the mouse left them', async ({ page }) => {
    test.setTimeout(40000);
    await load(page, '/shell/');
    await waitForMenu(page);

    const hit = await dockAtLeftEdge(page);
    await page.mouse.click(hit.x + 5, hit.y + hit.height / 2);
    await expect(page.locator('.scripts-menu-button')).toBeVisible();

    // working with the buttons: the menu is open and the mouse is on the buttons
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
  });

  test('a click on the page sends the buttons out of the blob back into it with their menus', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    const hit = await dockAtLeftEdge(page);
    await page.mouse.click(hit.x + 5, hit.y + hit.height / 2);
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/visible/);
    await page.waitForTimeout(500);   // let the pop-in finish

    await page.mouse.click(800, 600);
    await expect(page.locator('.creatio-satelite-floating')).toHaveAttribute('data-edge-docked', 'left');
    await expect(page.locator('.csl-edge-blob')).toBeVisible();
    await expect(page.locator('.scripts-menu-button')).toBeHidden();
    await expect(page.locator('.scripts-menu-container')).not.toHaveClass(/visible/);
  });

  test('a click on a menu item of the buttons out of the blob runs it and closes the menu', async ({ page }) => {
    await load(page, '/shell/');
    await waitForMenu(page);

    const hit = await dockAtLeftEdge(page);
    await page.mouse.click(hit.x + 5, hit.y + hit.height / 2);
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/visible/);
    // Unstyled test page: the items exist but are not laid out, so dispatch the click
    await page.locator('[data-item-marker="SysSettings"]').dispatchEvent('click');
    await expect(page.locator('.scripts-menu-container')).not.toHaveClass(/visible/);
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

  test('at the right end of the top edge the menu ends in line with the unpin button', async ({ page }) => {
    await setupChromeMock(page);
    await page.addInitScript(() => {
      chrome.storage.local.set({ 'menuEdgeBlob_shell_http://localhost:3737': { edge: 'top', along: 0.99, timestamp: Date.now() } });
    });
    await page.goto(`${BASE}/shell/`);
    await injectContentScript(page);
    await page.addStyleTag({ content: readFileSync('menu-item.css', 'utf8') });
    await expect(page.locator('.csl-edge-blob')).toBeVisible();
    await page.waitForTimeout(600);   // the dome has risen
    const hit = await page.locator('.csl-edge-hit').boundingBox();
    await page.mouse.click(hit.x + hit.width / 2, hit.y + 5);
    await expect(page.locator('.scripts-menu-container')).toHaveClass(/visible/);
    await page.waitForTimeout(600);   // the buttons are out of the blob
    const buttons = await page.locator('.creatio-satelite').boundingBox();
    const menu = await page.locator('.scripts-menu-container').boundingBox();
    expect(buttons.x + buttons.width).toBeGreaterThan(1280 - 20);   // the buttons stand at the right end
    expect(Math.abs((menu.x + menu.width) - (buttons.x + buttons.width))).toBeLessThanOrEqual(1);
  });

  test('the blob from the previous visit keeps its skirt in place and only raises the dome', async ({ page }) => {
    await setupChromeMock(page);
    await page.addInitScript(() => {
      chrome.storage.local.set({ 'menuEdgeBlob_shell_http://localhost:3737': { edge: 'right', along: 0.5, timestamp: Date.now() } });
    });
    await page.goto(`${BASE}/shell/`);
    await injectContentScript(page);

    // on the first frame it is shown: the blob box does not slide, and the dome is still low
    const first = await page.waitForFunction(() => {
      const blob = document.querySelector('.csl-edge-blob');
      if (!blob || blob.hidden) return null;
      const xs = d => Math.max(...d.match(/-?[\d.]+,[\d.]+/g).map(p => parseFloat(p)));
      return {
        slides: blob.getAnimations().length,
        drops: [...blob.querySelectorAll('.csl-edge-drop')].some(d => d.getAnimations().length),
        dome: xs(blob.querySelector('.csl-edge-bell path').getAttribute('d')),
      };
    }, null, { polling: 'raf', timeout: 5000 });
    const start = await first.jsonValue();
    expect(start.slides).toBe(0);
    expect(start.drops).toBe(false);
    await expect(page.locator('.csl-edge-blob')).toBeVisible();
    await expect(page.locator('.scripts-menu-button')).toBeHidden();
    await page.waitForTimeout(600);   // the rise is over
    const dome = await page.locator('.csl-edge-bell path').evaluate(p =>
      Math.max(...p.getAttribute('d').match(/-?[\d.]+,[\d.]+/g).map(v => parseFloat(v))));
    expect(dome).toBeGreaterThan(start.dome + 8);
    const blob = await page.locator('.csl-edge-blob').boundingBox();
    expect(Math.round(blob.x + blob.width)).toBe(1280);
  });
});

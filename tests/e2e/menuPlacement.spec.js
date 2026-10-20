import { readFileSync } from 'fs';
import { test, expect } from '@playwright/test';
import { setupChromeMock, injectContentScript, waitForMenu, waitForMenuSettled } from './helpers.js';

// Where the one menu panel opens when the buttons stand at the screen edges and near the corners,
// with the news column (a wide panel) and without it (a narrow one).
const BASE = 'http://localhost:3737';
const VW = 1280;
const VH = 720;
const day = n => new Date(Date.now() + n * 24 * 3600 * 1000).toISOString();

const NEWS = {
  schemaVersion: 1,
  channel: 'clio-satellite',
  items: ['a', 'b'].map((id, i) => ({
    id,
    type: 'release',
    title: `Deploy packages faster ${id}`,
    body: 'pushw now uploads only the packages that changed.',
    cta: { label: 'Read release notes', url: 'https://github.com/Advance-Technologies-Foundation/clio' },
    publishedAt: day(-1 - i),
    expiresAt: day(20),
  })),
};

async function loadShell(page, { news, blob = null }) {
  await page.setViewportSize({ width: VW, height: VH });
  await setupChromeMock(page, {
    syncData: news ? { newsEnabled: true, newsOnboardedAt: 1 } : { newsEnabled: false },
    newsFeed: news ? NEWS : null,
  });
  if (blob) {
    await page.addInitScript(state => {
      chrome.storage.local.set({ 'menuEdgeBlob_shell_http://localhost:3737': { ...state, timestamp: Date.now() } });
    }, blob);
  }
  await page.goto(`${BASE}/shell/`);
  for (const css of ['styles/shell.css', 'menu-item.css', 'styles/news.css']) {
    await page.addStyleTag({ content: readFileSync(css, 'utf8') });
  }
  await injectContentScript(page);
}

async function openFromBlob(page, edge) {
  await expect(page.locator('.csl-edge-blob')).toBeVisible();
  await page.waitForTimeout(600);   // the dome has risen
  const hit = await page.locator('.csl-edge-hit').boundingBox();
  const inset = 5;
  const x = edge === 'left' ? hit.x + inset : edge === 'right' ? hit.x + hit.width - inset : hit.x + hit.width / 2;
  const y = edge === 'top' ? hit.y + inset : edge === 'bottom' ? hit.y + hit.height - inset : hit.y + hit.height / 2;
  await page.mouse.click(x, y);
  await expect(page.locator('.scripts-menu-container')).toHaveClass(/visible/);
  // the menu opens next to the blob, the buttons stay in it
  await expect(page.locator('.scripts-menu-button')).toBeHidden();
  await page.waitForTimeout(300);   // the menu is placed
}

const BLOB = '.csl-edge-hit';

const overlaps = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

// `anchor` is what the panel was opened from: the buttons, or the docked blob (the buttons stay in it)
async function expectPanelPlaced(page, { news, anchor = '.creatio-satelite' }) {
  await waitForMenuSettled(page);
  const panel = await page.locator('.scripts-menu-container').boundingBox();
  const buttons = await page.locator(anchor).boundingBox();
  // the whole panel is on screen
  expect(panel.x).toBeGreaterThanOrEqual(0);
  expect(panel.y).toBeGreaterThanOrEqual(0);
  expect(panel.x + panel.width).toBeLessThanOrEqual(VW + 0.5);
  expect(panel.y + panel.height).toBeLessThanOrEqual(VH + 0.5);
  // and covers none of the buttons (or the blob)
  expect(overlaps(panel, buttons)).toBe(false);

  // the icons stay in the bottom-right corner of the panel and cover no action
  const book = await page.locator('.csl-menu-icon-btn[data-item-marker="NewsArchive"]').boundingBox();
  const settings = await page.locator('.csl-menu-icon-btn[data-item-marker="Settings"]').boundingBox();
  expect(panel.x + panel.width - (book.x + book.width)).toBeLessThanOrEqual(8);
  expect(panel.y + panel.height - (book.y + book.height)).toBeLessThanOrEqual(8);
  for (const action of await page.locator('.csl-actions-section [data-item-marker]').all()) {
    const a = await action.boundingBox();
    expect(overlaps(a, settings) || overlaps(a, book)).toBe(false);
  }

  const column = page.locator('.csl-news-column');
  if (!news) {
    await expect(column).toBeHidden();
    return panel;
  }
  await expect(column).toBeVisible();
  const col = await column.boundingBox();
  const features = await page.locator('.scripts-menu-container [data-item-marker="Features"]').boundingBox();
  expect(col.x + col.width).toBeLessThanOrEqual(features.x);
  // the cards and the list end inside the window; when it is short, the list scrolls
  const list = await column.locator('.csl-news-list').boundingBox();
  expect(list.y + list.height).toBeLessThanOrEqual(VH);
  return panel;
}

const ALONG = [['near the start corner', 0.02], ['in the middle', 0.5], ['near the end corner', 0.98]];

for (const news of [true, false]) {
  const label = news ? 'with the news column' : 'without news';
  test.describe(`Menu placement ${label}`, () => {
    for (const edge of ['top', 'bottom', 'left', 'right']) {
      for (const [where, along] of ALONG) {
        test(`buttons docked at the ${edge} edge ${where}`, async ({ page }) => {
          await loadShell(page, { news, blob: { edge, along } });
          await openFromBlob(page, edge);
          await expectPanelPlaced(page, { news, anchor: BLOB });
        });
      }
    }

    // Free buttons dragged close to each corner, but not into the edge (no blob)
    for (const [corner, fx, fy] of [['top-left', 0, 0], ['top-right', 1, 0], ['bottom-left', 0, 1], ['bottom-right', 1, 1]]) {
      test(`free buttons near the ${corner} corner`, async ({ page }) => {
        await loadShell(page, { news });
        await waitForMenu(page);
        const box = await page.locator('.creatio-satelite').boundingBox();
        const grabX = box.x + 60, grabY = box.y + box.height / 2;
        const gap = 16;
        const targetX = fx ? VW - gap - box.width : gap;
        const targetY = fy ? VH - gap - box.height : gap;
        await page.mouse.move(grabX, grabY);
        await page.mouse.down();
        await page.mouse.move(grabX + (targetX - box.x), grabY + (targetY - box.y), { steps: 12 });
        await page.mouse.up();
        await expect(page.locator('.creatio-satelite-floating')).not.toHaveAttribute('data-edge-docked', /.+/);
        await page.locator('.scripts-menu-button').click();
        await expect(page.locator('.scripts-menu-container')).toHaveClass(/visible/);
        await page.waitForTimeout(300);
        const panel = await expectPanelPlaced(page, { news });
        const buttons = await page.locator('.creatio-satelite').boundingBox();
        // the panel opens below the buttons at the top corners and above them at the bottom corners
        // and stays next to them: fitting the news list to the window must not leave a gap
        if (fy) {
          expect(panel.y + panel.height).toBeLessThanOrEqual(buttons.y);
          expect(buttons.y - (panel.y + panel.height)).toBeLessThanOrEqual(12);
        } else {
          expect(panel.y).toBeGreaterThanOrEqual(buttons.y + buttons.height);
          expect(panel.y - (buttons.y + buttons.height)).toBeLessThanOrEqual(12);
        }
      });
    }
  });
}

test('marking the news read at the right edge places the narrower panel again, still on screen', async ({ page }) => {
  await loadShell(page, { news: true, blob: { edge: 'right', along: 0.5 } });
  await openFromBlob(page, 'right');
  const wide = await expectPanelPlaced(page, { news: true, anchor: BLOB });
  await page.locator('.csl-news-column').getByRole('button', { name: 'Mark as read' }).click();
  await expect(page.locator('.csl-news-column')).toBeHidden();
  const narrow = await expectPanelPlaced(page, { news: false, anchor: BLOB });
  expect(narrow.width).toBeLessThan(wide.width);
});

test('in a short window the news list is cut to fit and the panel stays next to the buttons at the bottom', async ({ page }) => {
  const H = 480;
  await setupChromeMock(page, { syncData: { newsEnabled: true, newsOnboardedAt: 1 }, newsFeed: NEWS });
  await page.setViewportSize({ width: VW, height: H });
  await page.goto(`${BASE}/shell/`);
  for (const css of ['styles/shell.css', 'menu-item.css', 'styles/news.css']) {
    await page.addStyleTag({ content: readFileSync(css, 'utf8') });
  }
  await injectContentScript(page);
  await waitForMenu(page);
  const box = await page.locator('.creatio-satelite').boundingBox();
  const grabX = box.x + 60, grabY = box.y + box.height / 2;
  await page.mouse.move(grabX, grabY);
  await page.mouse.down();
  await page.mouse.move(grabX + (300 - box.x), grabY + (H - 16 - box.height - box.y), { steps: 12 });
  await page.mouse.up();
  await page.locator('.scripts-menu-button').click();
  await page.waitForTimeout(300);
  const panel = await page.locator('.scripts-menu-container').boundingBox();
  const buttons = await page.locator('.creatio-satelite').boundingBox();
  expect(panel.y).toBeGreaterThanOrEqual(0);
  expect(panel.y + panel.height).toBeLessThanOrEqual(H);
  expect(overlaps(panel, buttons)).toBe(false);
  // above the buttons, or beside them when there is no room above: never far from them
  const gapAbove = buttons.y - (panel.y + panel.height);
  const beside = panel.x >= buttons.x + buttons.width || panel.x + panel.width <= buttons.x;
  if (!beside) expect(gapAbove).toBeLessThanOrEqual(12);
  else expect(panel.y + panel.height).toBeGreaterThanOrEqual(buttons.y);
});

// Renders docs/store/slides.html to the PNG sizes the Chrome Web Store expects.
// Usage: node docs/store/render.mjs   (screens/ holds raw screenshots of the extension)
import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const shots = [
  ['s1', 'screenshot-1-login.png'], ['s2', 'screenshot-2-admin-menu.png'], ['s3', 'screenshot-3-quick-actions.png'],
  ['s4', 'screenshot-4-profiles-environments.png'], ['s5', 'screenshot-5-developer-news.png'],
  ['small', 'promo-small-440x280.png'], ['marquee', 'promo-marquee-1400x560.png'],
];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1 });
await page.goto('file://' + path.join(dir, 'slides.html'));
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);
for (const [id, file] of shots) {
  await page.locator('#' + id).screenshot({ path: path.join(dir, 'out', file) });
  console.log('wrote', file);
}
await browser.close();

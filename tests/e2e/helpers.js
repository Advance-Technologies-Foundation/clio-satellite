import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const CONTENT_JS = readFileSync(
  path.join(__dirname, '../../content.js'),
  'utf8'
);

// Sets up window.chrome mock before page scripts run.
// syncData pre-populates chrome.storage.sync (e.g. { userProfiles: [...] }).
// newsFeed, when given, is what the background "getNews" handler returns.
export async function setupChromeMock(page, { syncData = {}, newsFeed = null } = {}) {
  await page.addInitScript(({ initialSync, feed }) => {
    const local = {};
    const sync = Object.assign({}, initialSync);
    window.chrome = {
      storage: {
        local: {
          get: (keys, cb) => {
            const r = {};
            (Array.isArray(keys) ? keys : Object.keys(keys)).forEach(k => {
              if (k in local) r[k] = local[k];
            });
            cb(r);
          },
          set: (d, cb) => { Object.assign(local, d); if (cb) cb(); },
          remove: (keys, cb) => {
            (Array.isArray(keys) ? keys : [keys]).forEach(k => delete local[k]);
            if (cb) cb();
          },
        },
        sync: {
          get: (defaults, cb) => {
            const r = { ...defaults };
            Object.keys(defaults).forEach(k => { if (k in sync) r[k] = sync[k]; });
            cb(r);
          },
          set: (d, cb) => { Object.assign(sync, d); if (cb) cb(); },
        },
      },
      runtime: {
        sendMessage: (message, callback) => {
          (window.__sentMessages = window.__sentMessages || []).push(message);
          if (!callback) return;
          if (message.action === 'getNews') {
            // Like the background worker: a successful download is written to the feed cache
            if (feed && sync.newsEnabled === true) local.newsFeedCache = { raw: JSON.stringify(feed), fetchedAt: Date.now(), refreshHours: 6 };
            callback(feed ? { ok: true, raw: JSON.stringify(feed) } : { ok: false });
          } else {
            callback({ ok: false });
          }
        },
        getURL: (p) => `${location.origin}/${p}`,
        getManifest: () => ({ version: '2.6' }),
        lastError: undefined,
      },
    };
  }, { initialSync: syncData, feed: newsFeed });
}

export async function injectContentScript(page) {
  await page.addScriptTag({ content: CONTENT_JS });
}

// Waits for the menu container and its floating panel to be fully visible
export async function waitForMenu(page) {
  await page.waitForSelector('.creatio-satelite-extension-container', { timeout: 5000 });
  await page.waitForFunction(() => {
    const fc = document.querySelector('.creatio-satelite-floating');
    return fc && fc.style.opacity === '1';
  }, { timeout: 3000 });
}

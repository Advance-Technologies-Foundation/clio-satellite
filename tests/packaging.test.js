import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');

function readFile(rel) {
  return readFileSync(resolve(ROOT, rel), 'utf8');
}

describe('Extension packaging', () => {
  it('all HTML pages referenced in the extension exist on disk', () => {
    const manifest = JSON.parse(readFile('manifest.json'));
    const background = readFile('background.js');

    const referenced = new Set();

    // options_page in manifest
    if (manifest.options_page) referenced.add(manifest.options_page);

    // chrome.runtime.getURL('...') calls in background.js
    for (const [, file] of background.matchAll(/getURL\(['"]([^'"]+\.html)['"]\)/g)) {
      referenced.add(file);
    }

    for (const file of referenced) {
      expect(existsSync(resolve(ROOT, file)), `${file} is referenced but does not exist`).toBe(true);
    }
  });

  it('all referenced HTML pages are explicitly included in the release ZIP', () => {
    const manifest = JSON.parse(readFile('manifest.json'));
    const background = readFile('background.js');
    const workflow = readFile('.github/workflows/release.yml');

    // The workflow excludes *.html globally, then re-adds specific files via "zip -uj"
    const zipUjLine = workflow.match(/zip -uj[^\n]+/)?.[0] ?? '';

    const referenced = new Set();
    if (manifest.options_page) referenced.add(manifest.options_page);
    for (const [, file] of background.matchAll(/getURL\(['"]([^'"]+\.html)['"]\)/g)) {
      referenced.add(file);
    }

    for (const file of referenced) {
      expect(zipUjLine, `${file} is excluded by *.html but not re-added in the release workflow`).toContain(file);
    }
  });

  it('every raster icon referenced in code exists and is web-accessible', () => {
    const manifest = JSON.parse(readFile('manifest.json'));
    const resources = manifest.web_accessible_resources.flatMap(r => r.resources);
    expect(resources).toContain('icons/ui/*');

    const sources = ['src/menuConfig.js', 'src/menuBuilder.js', 'login/login.js'].map(readFile).join('\n');
    const files = new Set([...sources.matchAll(/['"]([a-z-]+\.png)['"]/g)].map(m => m[1]));
    expect(files.size).toBeGreaterThanOrEqual(18);
    for (const file of files) {
      expect(existsSync(resolve(ROOT, 'icons/ui', file)), `icons/ui/${file} is referenced but missing`).toBe(true);
    }
  });
});

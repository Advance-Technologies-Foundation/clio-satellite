import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/extension.spec.js', '**/options.spec.js'],
  timeout: 15000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: 'node tests/e2e/server.js',
    port: 3737,
    reuseExistingServer: !process.env.CI,
  },
});

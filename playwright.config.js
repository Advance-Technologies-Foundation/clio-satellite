import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/extension.spec.js', '**/options.spec.js', '**/environments.spec.js', '**/loginPanel.spec.js', '**/news.spec.js'],
  timeout: 15000,
  // CI runners are slower and shared; one retry separates flaky timing from real failures
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
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

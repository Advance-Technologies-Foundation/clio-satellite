import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/login.spec.js',
  timeout: 60000,
  workers: 1, // sequential — one real browser, one real site
  use: {
    headless: false, // always visible so you can watch the flow
    slowMo: 400,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});

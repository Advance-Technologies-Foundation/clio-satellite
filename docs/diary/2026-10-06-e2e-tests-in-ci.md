## 2026-10-06 — Run the mock E2E tests in CI

**What changed:** `.github/workflows/ci.yml` now installs Playwright Chromium and runs `npm run test:e2e` after the unit tests; on failure it uploads `playwright-report/` and `test-results/` as an artifact for 7 days. `playwright.config.js` retries once and writes an HTML report when `CI` is set. `.gitignore` ignores both Playwright output folders. The test sections in all agent instruction files say the mock E2E tests run in CI.

**Why:** The 81 Playwright tests on the mock pages (`tests/e2e/pages`) existed since April but CI ran only `npm test`, so UI regressions in Shell, the login panel and the options/environments pages were caught only if someone ran the suite by hand.

**Decision:** Only the mock suite runs in CI. The real-site login tests need a reachable Creatio instance and credentials, which GitHub-hosted runners do not have. One retry on CI keeps a slow shared runner from failing the build on timing alone; a test that fails twice still fails the job.

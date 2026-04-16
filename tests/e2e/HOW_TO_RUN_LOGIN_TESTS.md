# Login Tests — How to Run

These tests run against a real Creatio site with the actual extension loaded in Chrome.

## Prerequisites

1. **Extension must be built** before running:
   ```bash
   npm run build
   ```

2. **Playwright Chromium** must be installed (one-time):
   ```bash
   npx playwright install chromium
   ```

## Running the tests

### Basic run (uses default site and credentials)

```bash
BASE_URL=https://dev2.krylov.cloud npm run test:login
```

### Custom credentials

```bash
BASE_URL=https://dev2.krylov.cloud TEST_USER=Supervisor TEST_PASS=Supervisor npm run test:login
```

### Run a single test by name

```bash
BASE_URL=https://dev2.krylov.cloud npm run test:login -- --grep "satellite menu"
```

### Run only smoke tests (no login)

```bash
BASE_URL=https://dev2.krylov.cloud npm run test:login -- --grep "Smoke"
```

## What each test checks

| Test | What it verifies |
|---|---|
| **Smoke — login form** | The Creatio login page loads and shows username/password fields |
| **Extension UI — selector injected** | Extension adds profile dropdown + buttons to the login form |
| **Extension UI — empty storage** | Without saved profiles, dropdown shows "Setup user in options" |
| **Extension UI — saved profile** | After injecting a profile into storage, it appears in the dropdown |
| **Login flow — redirect** | "Login with profile" fills credentials and redirects to `/Shell/` |
| **Login flow — satellite menu** | After login, the satellite menu (Clio buttons) is visible in the shell |

## What you will see

A Chrome browser window opens automatically. Each test:
1. Opens a fresh browser profile (no cookies, no stored sessions)
2. Navigates to the login page
3. Performs the test actions (with 400ms slow-motion so you can follow)
4. Closes when done

Failed tests save a screenshot and video to `test-results/`.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `BASE_URL` | `https://dev2.krylov.cloud` | Root URL of the Creatio instance |
| `TEST_USER` | `Supervisor` | Username for login tests |
| `TEST_PASS` | `Supervisor` | Password for login tests |

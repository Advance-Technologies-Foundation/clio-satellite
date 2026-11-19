# Pin CI and release runners to ubuntu-24.04

**What changed** — `.github/workflows/ci.yml` and `.github/workflows/release.yml`: `runs-on` is
`ubuntu-24.04` instead of `ubuntu-latest` (all three jobs).

**Why** — `ubuntu-latest` moved to Ubuntu 26.04, and `npx playwright install --with-deps chromium`
fails there with "Playwright does not support chromium on ubuntu26.04-x64". Every PR check and the
release workflow failed before running any test.

**Decision** — pinning the runner is the smallest change and keeps CI on an image the current
Playwright supports. Moving to 26.04 needs a Playwright upgrade that supports it; do that as its own
change and drop the pin then.

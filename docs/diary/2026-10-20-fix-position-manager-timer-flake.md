# Fix flaky positionManager unit test timer leak

**What changed** — `tests/positionManager.test.js` only. The test "does not move the buttons while
the search width is changing" now runs on fake timers and checks that two retries were scheduled.
A file-level `afterEach` calls `vi.clearAllTimers()` and `vi.useRealTimers()`.

**Why** — CI run for PR #34 failed with "ReferenceError: document is not defined" from
`positionFloatingContainerRelativeToSearch`. That test sees two new search rects with real timers,
so the function scheduled two real `setTimeout` retries (`STABLE_CHECK_MS`, 120 ms). When the file
finished in under 120 ms after it, the retries fired after jsdom was torn down. Tests that switched
to fake timers locally also left them on if an assertion failed before `vi.useRealTimers()`.

**Decision** — fixed in the tests, not in `src`: in the extension the retry must run, and a
lingering timer is harmless in a real page. The shared `afterEach` keeps future tests from leaking
the same way. Verified with 20 consecutive runs of the file without errors.

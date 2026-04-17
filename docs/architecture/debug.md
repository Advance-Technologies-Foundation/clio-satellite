## debug.js

**Purpose:** Shared utilities for logging and safe Chrome API access. Imported by every other module.

**Public API:**
- `DEBUG: boolean` — set to `true` locally to enable verbose logs; always `false` in production builds
- `debugLog(message: string): void` — logs to console only when `DEBUG` is true
- `getLastError(): chrome.runtime.LastError | null` — safely reads `chrome.runtime.lastError`; returns `null` if the extension context has been invalidated (accessing `chrome.runtime` throws in that state)

**Key decisions:**
- `getLastError` exists because Chrome storage callbacks can fire after the extension reloads, making `chrome.runtime` inaccessible. A centralised wrapper keeps every callback clean.

**Dependencies:** none

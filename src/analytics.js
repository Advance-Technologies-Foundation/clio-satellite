// Content-script side of the anonymous usage statistics: forwards an event to the background
// worker, which applies the allow-list, the Options switch and sends it (analytics/analytics.js).
export function track(name, params = {}) {
  try {
    // Same liveness check as newsStore: runtime.id is gone once the extension is reloaded
    if (!(chrome?.runtime?.id ?? chrome?.storage)) return;
    chrome.runtime.sendMessage({ action: 'trackEvent', name, params }, () => {
      try { void chrome.runtime.lastError; } catch { /* ignore */ }
    });
  } catch {
    // extension context invalidated — nothing to do
  }
}

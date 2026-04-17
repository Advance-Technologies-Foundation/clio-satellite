export const DEBUG = false;

export function debugLog(message) {
  if (DEBUG) console.log('[Clio Satellite]:', message);
}

// Safe wrapper: accessing chrome.runtime.lastError throws when extension context is invalidated
export function getLastError() {
  try {
    return chrome.runtime.lastError || null;
  } catch (e) {
    return null;
  }
}

export const DEBUG = false;

export function debugLog(message) {
  if (DEBUG) console.log('[Clio Satellite]:', message);
}

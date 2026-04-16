import { debugLog } from './debug.js';
import { getCreatioPageType } from './pageDetection.js';
import { checkCreatioPageAndCreateMenu, monitorButtons, setupObserver, initDebugHelper } from './observer.js';

// Abort early on login pages before any initialization
const initialType = getCreatioPageType();
if (initialType !== 'login') {
  // Initial check after page settles
  setTimeout(() => checkCreatioPageAndCreateMenu(), 1000);

  // Check on DOM ready and full load
  document.addEventListener('DOMContentLoaded', () => {
    debugLog('DOMContentLoaded');
    checkCreatioPageAndCreateMenu();
  });

  window.addEventListener('load', () => {
    debugLog('Window load');
    checkCreatioPageAndCreateMenu();
  });

  // Periodic check for dynamically loaded Creatio content
  let checkCount = 0;
  const checkInterval = setInterval(() => {
    checkCount++;
    const done = checkCreatioPageAndCreateMenu();
    if (done || checkCount >= 20) clearInterval(checkInterval);
  }, 1000);

  // MutationObserver for SPA navigation
  setupObserver();

  // Restore buttons if removed by host app
  setInterval(monitorButtons, 2000);

  // Dev helper available in browser console
  initDebugHelper();
}

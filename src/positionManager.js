import { debugLog } from './debug.js';

export function positionFloatingContainerRelativeToSearch(
  floatingContainer = document.querySelector('.creatio-satelite-floating')
) {
  if (!floatingContainer) {
    debugLog('Cannot position floating container - not found');
    return false;
  }

  if (floatingContainer.hasAttribute('data-user-positioned')) {
    debugLog('Container was manually positioned, skipping auto-positioning');
    return true;
  }

  let searchElement =
    document.querySelector('crt-global-search') ||
    document.querySelector('[data-item-marker="GlobalSearch"]') ||
    document.querySelector('.global-search') ||
    document.querySelector('input[placeholder*="Search"], input[placeholder*="search"]');

  const actionButton = document.querySelector('button[mat-button].action-button');
  const targetElement = searchElement || actionButton;

  if (!targetElement) {
    const containerRect = floatingContainer.getBoundingClientRect();
    const centerX = (window.innerWidth - containerRect.width) / 2;
    floatingContainer.style.left = centerX + 'px';
    floatingContainer.style.top = '16px';
    floatingContainer.style.right = 'auto';
    floatingContainer.setAttribute('data-fallback-position', 'true');
    debugLog(`Fallback positioning: center horizontally (${centerX}px)`);
    return true;
  }

  floatingContainer.removeAttribute('data-fallback-position');

  const targetRect = targetElement.getBoundingClientRect();
  const containerRect = floatingContainer.getBoundingClientRect();

  if (targetRect.width < 20 || targetRect.height < 10) {
    debugLog(`Target element too small: ${targetRect.width}x${targetRect.height}`);
    return false;
  }

  const computed = window.getComputedStyle(targetElement);
  if (computed.display === 'none' || computed.visibility === 'hidden' || computed.opacity === '0') {
    debugLog('Target element not visible');
    return false;
  }

  if (targetRect.top < 0 || targetRect.left < 0 ||
      targetRect.bottom > window.innerHeight || targetRect.right > window.innerWidth) {
    debugLog('Target element outside viewport');
    return false;
  }

  const leftPosition = targetRect.right + 20;
  const topPosition = targetRect.top + (targetRect.height - containerRect.height) / 2 - 20;
  const finalLeft = Math.min(window.innerWidth - containerRect.width - 10, leftPosition);
  const finalTop = Math.max(10, Math.min(window.innerHeight - containerRect.height - 10, topPosition));

  floatingContainer.style.left = finalLeft + 'px';
  floatingContainer.style.top = finalTop + 'px';
  floatingContainer.style.right = 'auto';

  debugLog(`Positioned container: left=${finalLeft}, top=${finalTop}`);
  return true;
}

export function saveMenuPosition(x, y, pageType) {
  const key = `menuPosition_${pageType}_${window.location.origin}`;
  chrome.storage.local.set({ [key]: { x, y, timestamp: Date.now() } }, () => {
    if (chrome.runtime.lastError) {
      console.error('[Clio Satellite] Failed to save position:', chrome.runtime.lastError.message);
      return;
    }
    debugLog(`Position saved for ${pageType}: x=${x}, y=${y}`);
  });
}

export function loadMenuPosition(pageType, callback) {
  const key = `menuPosition_${pageType}_${window.location.origin}`;
  chrome.storage.local.get([key], (result) => {
    if (chrome.runtime.lastError) {
      console.error('[Clio Satellite] Failed to load position:', chrome.runtime.lastError.message);
      callback(null, null);
      return;
    }
    const position = result[key];
    if (position) {
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - position.timestamp < thirtyDays) {
        debugLog(`Position loaded for ${pageType}: x=${position.x}, y=${position.y}`);
        callback(position.x, position.y);
        return;
      }
      chrome.storage.local.remove([key], () => {
        if (chrome.runtime.lastError) {
          console.error('[Clio Satellite] Failed to remove stale position:', chrome.runtime.lastError.message);
        }
      });
    }
    callback(null, null);
  });
}

export function applySavedPosition(floatingContainer, x, y) {
  const containerRect = floatingContainer.getBoundingClientRect();
  const maxX = window.innerWidth - containerRect.width - 10;
  const maxY = window.innerHeight - containerRect.height - 10;
  const finalX = Math.max(10, Math.min(maxX, x));
  const finalY = Math.max(10, Math.min(maxY, y));

  floatingContainer.style.left = finalX + 'px';
  floatingContainer.style.top = finalY + 'px';
  floatingContainer.style.right = 'auto';
  floatingContainer.setAttribute('data-user-positioned', 'true');

  debugLog(`Applied saved position: x=${finalX}, y=${finalY}`);
  return true;
}

import { debugLog, getLastError } from './debug.js';

const STABLE_CHECK_MS = 120;
const ANCHOR_GAP = 20;
// Siblings further away than this belong to another toolbar group, not to the search's group
const GROUP_GAP_MAX = 48;
const lastTargetRect = new WeakMap();

// Right edge of the toolbar group the search belongs to. Creatio puts its own controls right
// after the search (e.g. the chat operator status button), so the buttons must go after them.
export function anchorRightEdge(target, floatingContainer) {
  const rect = target.getBoundingClientRect();
  let right = rect.right;
  for (let sib = target.nextElementSibling; sib; sib = sib.nextElementSibling) {
    // Our own container can be a sibling when the search sits directly in <body>
    if (sib === floatingContainer || sib.contains(floatingContainer)) break;
    const b = sib.getBoundingClientRect();
    if (!b.width || !b.height) continue;
    if (b.bottom <= rect.top || b.top >= rect.bottom) continue;   // not in the same row
    if (b.left - right > GROUP_GAP_MAX) break;
    right = Math.max(right, b.right);
  }
  return right;
}

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
    // Keep the position restored from the previous visit until the anchor appears,
    // so the buttons do not jump to the centre and back while Shell loads.
    if (floatingContainer.hasAttribute('data-auto-restored')) {
      debugLog('Anchor not ready, keeping restored position');
      return true;
    }
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

  // The search field animates its width when it appears; positioning against an
  // intermediate size makes the buttons jump. Move only once the rect is stable.
  // Only the search has Creatio controls glued to it; the action-button fallback keeps its old anchor
  const anchorRight = searchElement ? anchorRightEdge(targetElement, floatingContainer) : targetRect.right;
  const rectKey = `${Math.round(targetRect.left)},${Math.round(anchorRight)},${Math.round(targetRect.top)}`;
  const now = Date.now();
  const seen = lastTargetRect.get(floatingContainer);
  if (!seen || seen.key !== rectKey) {
    lastTargetRect.set(floatingContainer, { key: rectKey, since: now });
    setTimeout(() => positionFloatingContainerRelativeToSearch(floatingContainer), STABLE_CHECK_MS);
    debugLog('Target element still moving, retrying');
    return false;
  }
  if (now - seen.since < STABLE_CHECK_MS) {
    debugLog('Target element not stable long enough yet');
    return false;
  }

  const leftPosition = anchorRight + ANCHOR_GAP;
  const topPosition = targetRect.top + (targetRect.height - containerRect.height) / 2 - 20;
  const finalLeft = Math.min(window.innerWidth - containerRect.width - 10, leftPosition);
  const finalTop = Math.max(10, Math.min(window.innerHeight - containerRect.height - 10, topPosition));

  floatingContainer.style.left = finalLeft + 'px';
  floatingContainer.style.top = finalTop + 'px';
  floatingContainer.style.right = 'auto';
  floatingContainer.removeAttribute('data-auto-restored');
  saveAutoPosition(floatingContainer.getAttribute('data-page-type'), finalLeft, finalTop);

  debugLog(`Positioned container: left=${finalLeft}, top=${finalTop}`);
  return true;
}

// Last position computed next to the search field, per page type and origin.
// Restored on the next load before the search field exists, so the buttons
// appear right where they will end up instead of jumping there later.
const autoPositionKey = pageType => `menuAutoPosition_${pageType}_${window.location.origin}`;
let lastSavedAuto = null;

export function saveAutoPosition(pageType, x, y) {
  if (!pageType) return;
  const key = autoPositionKey(pageType);
  const vw = window.innerWidth;
  if (lastSavedAuto && lastSavedAuto.key === key && lastSavedAuto.x === x && lastSavedAuto.y === y && lastSavedAuto.vw === vw) return;
  lastSavedAuto = { key, x, y, vw };
  chrome.storage.local.set({ [key]: { x, y, vw, timestamp: Date.now() } }, () => {
    const err = getLastError();
    if (err) console.error('[Clio Satellite] Failed to save auto position:', err.message);
  });
}

export function loadAutoPosition(pageType, callback) {
  const key = autoPositionKey(pageType);
  chrome.storage.local.get([key], (result) => {
    const err = getLastError();
    const pos = err ? null : result[key];
    // Toolbar layout depends on the window width; a position saved for another width is wrong
    if (!pos || pos.vw !== window.innerWidth) {
      callback(null);
      return;
    }
    callback(pos);
  });
}

export function applyAutoPosition(floatingContainer, pos) {
  const containerRect = floatingContainer.getBoundingClientRect();
  const x = Math.max(10, Math.min(window.innerWidth - containerRect.width - 10, pos.x));
  const y = Math.max(10, Math.min(window.innerHeight - containerRect.height - 10, pos.y));
  floatingContainer.style.left = x + 'px';
  floatingContainer.style.top = y + 'px';
  floatingContainer.style.right = 'auto';
  floatingContainer.setAttribute('data-auto-restored', 'true');
  debugLog(`Restored auto position: x=${x}, y=${y}`);
}

export function resetAutoPositionCache() {
  lastSavedAuto = null;
}

export function saveMenuPosition(x, y, pageType) {
  const key = `menuPosition_${pageType}_${window.location.origin}`;
  chrome.storage.local.set({ [key]: { x, y, timestamp: Date.now() } }, () => {
    const err = getLastError();
    if (err) {
      console.error('[Clio Satellite] Failed to save position:', err.message);
      return;
    }
    debugLog(`Position saved for ${pageType}: x=${x}, y=${y}`);
  });
}

export function loadMenuPosition(pageType, callback) {
  const key = `menuPosition_${pageType}_${window.location.origin}`;
  chrome.storage.local.get([key], (result) => {
    const err = getLastError();
    if (err) {
      console.error('[Clio Satellite] Failed to load position:', err.message);
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
        const err = getLastError();
        if (err) {
          console.error('[Clio Satellite] Failed to remove stale position:', err.message);
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

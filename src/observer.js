import { debugLog } from './debug.js';
import { state, resetState } from './state.js';
import { getCreatioPageType } from './pageDetection.js';
import { createScriptsMenu } from './menuBuilder.js';
import { positionFloatingContainerRelativeToSearch } from './positionManager.js';

export function checkCreatioPageAndCreateMenu() {
  debugLog('Checking for Creatio page');
  const pageType = getCreatioPageType();

  if (pageType === 'login') {
    debugLog('Login page detected - menu creation blocked');
    return false;
  }

  if (pageType && !state.menuCreated && (pageType === 'shell' || pageType === 'configuration')) {
    debugLog(`${pageType} page detected, creating menu`);
    return createScriptsMenu();
  }

  return false;
}

export function monitorButtons() {
  const pageType = getCreatioPageType();
  if (pageType !== 'shell' && pageType !== 'configuration') return;

  // Don't tear down a half-built menu — wait for construction to finish
  if (state.menuCreating) return;

  const ec = document.querySelector('.creatio-satelite-extension-container');
  const navBtn = ec ? ec.querySelector('.scripts-menu-button') : null;
  const actBtn = ec ? ec.querySelector('.actions-button') : null;
  const floatingContainer = ec ? ec.querySelector('.creatio-satelite-floating') : null;

  if (!ec || !navBtn || !actBtn || !floatingContainer) {
    debugLog('Extension elements missing, attempting restore...');
    document.querySelectorAll('.creatio-satelite-extension-container').forEach(el => el.remove());
    resetState();
    createScriptsMenu();
    return;
  }

  if (pageType === 'shell' && floatingContainer) {
    const searchElement = document.querySelector('crt-global-search');
    if (!searchElement) {
      positionFloatingContainerRelativeToSearch(floatingContainer);
      return;
    }
    const searchRect = searchElement.getBoundingClientRect();
    if (searchRect.width < 50 || searchRect.height < 20) {
      positionFloatingContainerRelativeToSearch(floatingContainer);
      return;
    }
    const containerRect = floatingContainer.getBoundingClientRect();
    const expectedLeft = searchRect.right + 20;
    if (Math.abs(containerRect.left - expectedLeft) > 50) {
      positionFloatingContainerRelativeToSearch(floatingContainer);
    }
  }
}

export function setupObserver() {
  const observer = new MutationObserver(mutations => {
    let shouldCheck = false;
    let hasLeftContainer = false;
    let hasSearchElement = false;

    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        if (mutation.addedNodes.length > 2) shouldCheck = true;

        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.classList?.contains('left-container') || node.querySelector?.('.left-container')) {
            hasLeftContainer = true;
            shouldCheck = true;
          }
          if (node.tagName === 'CRT-GLOBAL-SEARCH' || node.querySelector?.('crt-global-search')) {
            hasSearchElement = true;
            shouldCheck = true;
          }
        }
      }
    }

    const pageType = getCreatioPageType();
    if (pageType === 'login' || !pageType) return;

    if (shouldCheck && !state.menuCreated) {
      checkCreatioPageAndCreateMenu();
    } else if (hasSearchElement && pageType === 'shell') {
      const fc = document.querySelector('.creatio-satelite-floating');
      setTimeout(() => positionFloatingContainerRelativeToSearch(fc), 50);
      setTimeout(() => positionFloatingContainerRelativeToSearch(fc), 200);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  return observer;
}

export function initDebugHelper() {
  window.creatioSatelliteDebug = function () {
    const pageType = getCreatioPageType();
    console.log('=== Creatio Satellite Debug Info ===');
    console.log('Page Type:', pageType);
    console.log('Menu Created:', state.menuCreated);
    console.log('Current URL:', window.location.href);
    return { pageType, menuCreated: state.menuCreated, url: window.location.href };
  };
}

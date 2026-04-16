import { debugLog } from './debug.js';
import {
  positionFloatingContainerRelativeToSearch,
  saveMenuPosition,
  loadMenuPosition,
  applySavedPosition,
} from './positionManager.js';

let resizeAbortController = null;

export function setupFloatingContainer(pageType, buttonWrapper, extensionContainer) {
  resizeAbortController?.abort();
  resizeAbortController = new AbortController();
  const isShell = pageType === 'shell';

  const floatingContainer = document.createElement('div');
  floatingContainer.className = 'creatio-satelite-floating';
  floatingContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: row;
    gap: 8px;
    cursor: move;
    user-select: none;
    width: auto;
    height: auto;
    background: transparent;
    padding: 0;
    min-width: auto;
    max-width: none;
    box-sizing: border-box;
    pointer-events: auto;
    opacity: 0;
    transition: opacity ${isShell ? '3s' : '0.3s'} ease;
  `;

  let isDragging = false;
  let startX, startY, initialX, initialY;

  floatingContainer.addEventListener('mousedown', (e) => {
    if (e.target === floatingContainer || e.target.closest('.creatio-satelite')) {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = floatingContainer.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      floatingContainer.style.cursor = 'grabbing';
      e.preventDefault();

      const onMouseMove = (e) => {
        const newX = Math.max(0, Math.min(window.innerWidth - floatingContainer.offsetWidth, initialX + e.clientX - startX));
        const newY = Math.max(0, Math.min(window.innerHeight - floatingContainer.offsetHeight, initialY + e.clientY - startY));
        floatingContainer.style.left = newX + 'px';
        floatingContainer.style.top = newY + 'px';
        floatingContainer.style.right = 'auto';
      };

      const onMouseUp = () => {
        isDragging = false;
        floatingContainer.style.cursor = 'move';
        floatingContainer.setAttribute('data-user-positioned', 'true');
        const rect = floatingContainer.getBoundingClientRect();
        saveMenuPosition(rect.left, rect.top, pageType);
        debugLog(`${isShell ? 'Shell' : 'Configuration'} container manually positioned`);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
  });

  floatingContainer.appendChild(buttonWrapper);
  extensionContainer.appendChild(floatingContainer);

  buttonWrapper.classList.add(isShell ? 'creatio-satelite-shell' : 'creatio-satelite-configuration');
  buttonWrapper.style.flexDirection = 'row';

  floatingContainer.addEventListener('dblclick', (e) => {
    if (e.target === floatingContainer || e.target.closest('.creatio-satelite')) {
      floatingContainer.removeAttribute('data-user-positioned');
      floatingContainer.removeAttribute('data-fallback-position');
      const key = `menuPosition_${pageType}_${window.location.origin}`;
      chrome.storage.local.remove([key], () => {
        if (chrome.runtime.lastError) {
          console.error('[Clio Satellite] Failed to clear position:', chrome.runtime.lastError.message);
          return;
        }
        debugLog(`${isShell ? 'Shell' : 'Configuration'} container: position cleared`);
      });
      setTimeout(() => positionFloatingContainerRelativeToSearch(floatingContainer), 10);
      e.preventDefault();
    }
  });

  loadMenuPosition(pageType, (savedX, savedY) => {
    if (savedX !== null && savedY !== null) {
      if (applySavedPosition(floatingContainer, savedX, savedY)) {
        setTimeout(() => { floatingContainer.style.opacity = '1'; }, 50);
        debugLog(`${isShell ? 'Shell' : 'Configuration'} container positioned from saved coordinates`);
        return;
      }
    }

    let positionAttempted = false;
    const attemptPositioning = () => {
      if (positionAttempted) return;
      positionAttempted = true;
      positionFloatingContainerRelativeToSearch(floatingContainer);
      setTimeout(() => { floatingContainer.style.opacity = '1'; }, 50);
    };

    setTimeout(attemptPositioning, isShell ? 100 : 200);

    if (isShell) {
      setTimeout(() => { if (!positionAttempted) floatingContainer.style.opacity = '1'; }, 1000);
      [300, 800, 1500, 2500].forEach(ms =>
        setTimeout(() => positionFloatingContainerRelativeToSearch(floatingContainer), ms)
      );
    }
  });

  window.addEventListener('resize', () => {
    if (!isDragging && !floatingContainer.hasAttribute('data-user-positioned')) {
      positionFloatingContainerRelativeToSearch(floatingContainer);
    }
  }, { signal: resizeAbortController.signal });

  let positionCheckCount = 0;
  const maxPositionChecks = isShell ? 40 : 20;
  const positionCheckInterval = setInterval(() => {
    if (floatingContainer.hasAttribute('data-user-positioned')) {
      clearInterval(positionCheckInterval);
      return;
    }
    positionCheckCount++;
    const positioned = positionFloatingContainerRelativeToSearch(floatingContainer);
    if (positioned || positionCheckCount >= maxPositionChecks) {
      clearInterval(positionCheckInterval);
    }
  }, isShell ? 100 : 150);

  if (isShell) {
    const observer = new MutationObserver(() => {
      if (floatingContainer.hasAttribute('data-user-positioned')) {
        observer.disconnect();
        return;
      }
      const searchElement = document.querySelector('crt-global-search');
      if (searchElement && !floatingContainer.hasAttribute('data-positioned')) {
        if (positionFloatingContainerRelativeToSearch(floatingContainer)) {
          floatingContainer.setAttribute('data-positioned', 'true');
          observer.disconnect();
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 10000);
  }

  debugLog(`${isShell ? 'Shell' : 'Configuration'} floating container created`);
  return floatingContainer;
}

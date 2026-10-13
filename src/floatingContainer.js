import { debugLog } from './debug.js';
import {
  positionFloatingContainerRelativeToSearch,
  saveMenuPosition,
  loadMenuPosition,
  applySavedPosition,
  loadAutoPosition,
  applyAutoPosition,
} from './positionManager.js';
import { createEdgeBlob, loadBlobState, buttonsPositionFor } from './edgeBlob.js';
import { hideMenuContainer } from './menuVisibility.js';

// The mouse has to move this far before a press on the buttons counts as a drag, not a click
export const DRAG_THRESHOLD = 4;

let resizeAbortController = null;

export function setupFloatingContainer(pageType, buttonWrapper, extensionContainer) {
  resizeAbortController?.abort();
  resizeAbortController = new AbortController();
  const isShell = pageType === 'shell';

  const floatingContainer = document.createElement('div');
  floatingContainer.className = 'creatio-satelite-floating';
  floatingContainer.setAttribute('data-page-type', pageType);
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
    transition: opacity 0.3s ease;
  `;

  let isDragging = false;
  let endDrag = null;

  // The click that ends a drag lands on a button and would open its menu: swallow it.
  // Capture on the container runs before the buttons' own click handlers.
  let suppressClick = false;
  floatingContainer.addEventListener('click', (e) => {
    if (!suppressClick) return;
    suppressClick = false;
    e.stopPropagation();
    e.preventDefault();
  }, true);

  // The buttons are absolutely positioned inside the container, so the container box can be
  // smaller than what the user sees. Edges and clamping use the union of both boxes.
  const visualBox = () => {
    const c = floatingContainer.getBoundingClientRect();
    const b = buttonWrapper.getBoundingClientRect();
    if (!b.width && !b.height) {
      return { left: c.left, top: c.top, width: floatingContainer.offsetWidth || c.width, height: floatingContainer.offsetHeight || c.height, offX: 0, offY: 0 };
    }
    const left = Math.min(c.left, b.left), top = Math.min(c.top, b.top);
    const right = Math.max(c.right, b.right), bottom = Math.max(c.bottom, b.bottom);
    return { left, top, width: right - left, height: bottom - top, offX: left - c.left, offY: top - c.top };
  };

  const closeMenus = () => {
    document.querySelectorAll('.scripts-menu-container, .actions-menu-container').forEach(hideMenuContainer);
  };

  // `moved: true` starts a drag that is already under way (the buttons torn off a blob)
  const beginDrag = (clientX, clientY, { moved = false } = {}) => {
    const startX = clientX, startY = clientY;
    // a running pop-in scales the container: measured mid-animation, the buttons would jump
    floatingContainer.getAnimations?.().forEach(a => a.cancel());
    const rect = floatingContainer.getBoundingClientRect();
    const initialX = rect.left, initialY = rect.top;
    const box = visualBox();
    isDragging = moved;
    floatingContainer.style.cursor = 'grabbing';

    const onMouseMove = (e) => {
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (!isDragging) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        isDragging = true;
        closeMenus();
      }
      const rawX = initialX + dx, rawY = initialY + dy;
      // keep the visible buttons, not just the container box, inside the viewport
      const newX = Math.max(-box.offX, Math.min(window.innerWidth - box.width - box.offX, rawX));
      const newY = Math.max(-box.offY, Math.min(window.innerHeight - box.height - box.offY, rawY));
      floatingContainer.style.left = newX + 'px';
      floatingContainer.style.top = newY + 'px';
      floatingContainer.style.right = 'auto';
      // pushed far enough past an edge, the buttons turn into a blob (edgeBlob calls onBlob)
      edgeBlob.press(floatingContainer, { left: rawX + box.offX, top: rawY + box.offY, width: box.width, height: box.height }, e.clientX, e.clientY);
    };

    const stop = () => {
      floatingContainer.style.cursor = 'move';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      endDrag = null;
    };

    const onMouseUp = () => {
      const wasDragging = isDragging;
      isDragging = false;
      stop();
      edgeBlob.release();
      if (!wasDragging) return;   // a plain click on a button: leave its menu to the button
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);   // no click follows when the mouse was released elsewhere
      floatingContainer.setAttribute('data-user-positioned', 'true');
      // the drag has set left/top; the box can still be scaled by the pop-in after a tear-off
      saveMenuPosition(parseFloat(floatingContainer.style.left), parseFloat(floatingContainer.style.top), pageType);
      debugLog(`${isShell ? 'Shell' : 'Configuration'} container manually positioned`);
    };

    // The buttons became a blob mid-drag: the blob now follows the mouse
    endDrag = () => {
      isDragging = false;
      stop();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  floatingContainer.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (e.target === floatingContainer || e.target.closest('.creatio-satelite')) {
      beginDrag(e.clientX, e.clientY);
      e.preventDefault();
    }
  });

  const showButtonsAt = (x, y) => {
    floatingContainer.removeAttribute('data-edge-docked');
    floatingContainer.style.left = x + 'px';
    floatingContainer.style.top = y + 'px';
    floatingContainer.style.right = 'auto';
    floatingContainer.style.opacity = '1';
    floatingContainer.setAttribute('data-user-positioned', 'true');
  };

  const popIn = (origin, from) => {
    if (typeof floatingContainer.animate !== 'function') return;
    floatingContainer.style.transformOrigin = origin;
    floatingContainer.animate(
      [{ transform: from, opacity: 0.4, borderRadius: '40px' }, { transform: 'scale(1)', opacity: 1, borderRadius: '8px' }],
      { duration: 380, easing: 'cubic-bezier(.34,1.56,.64,1)' }
    );
  };

  const edgeBlob = createEdgeBlob({
    root: extensionContainer,
    pageType,
    signal: resizeAbortController.signal,
    onBlob: () => {
      endDrag?.();
      closeMenus();
      // the blob holds the place: automatic positioning next to the search must not bring the buttons back
      floatingContainer.setAttribute('data-user-positioned', 'true');
    },
    onRestore: (edge, along) => {
      floatingContainer.removeAttribute('data-edge-docked');
      const box = visualBox();
      const pos = buttonsPositionFor(edge, along, box.width, box.height, window.innerWidth, window.innerHeight);
      const x = pos.x - box.offX, y = pos.y - box.offY;
      showButtonsAt(x, y);
      saveMenuPosition(x, y, pageType);
      const vertical = edge === 'left' || edge === 'right';
      popIn({ left: 'left center', right: 'right center', top: 'center top', bottom: 'center bottom' }[edge], vertical ? 'scale(.1,.5)' : 'scale(.5,.1)');
    },
    onTearOff: (clientX, clientY) => {
      floatingContainer.removeAttribute('data-edge-docked');
      const box = visualBox();
      const x = Math.max(0, Math.min(window.innerWidth - box.width, clientX - box.width / 2)) - box.offX;
      const y = Math.max(0, Math.min(window.innerHeight - box.height, clientY - box.height / 2)) - box.offY;
      showButtonsAt(x, y);
      beginDrag(clientX, clientY, { moved: true });
      popIn('center', 'scale(.3)');
    },
  });

  // The buttons were left as a blob on the previous visit
  loadBlobState(pageType, (saved) => {
    if (!saved) return;
    floatingContainer.setAttribute('data-user-positioned', 'true');
    floatingContainer.setAttribute('data-edge-docked', saved.edge);
    floatingContainer.style.opacity = '1';
    edgeBlob.dock(saved.edge, saved.along);
    debugLog(`Restored the blob on the ${saved.edge} edge`);
  });

  floatingContainer.appendChild(buttonWrapper);
  extensionContainer.appendChild(floatingContainer);

  buttonWrapper.classList.add(isShell ? 'creatio-satelite-shell' : 'creatio-satelite-configuration');
  buttonWrapper.style.flexDirection = 'row';

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

    // Show the buttons at once where they stood last time; the search-based
    // positioning below then confirms or corrects the spot.
    loadAutoPosition(pageType, (pos) => {
      if (!pos || floatingContainer.hasAttribute('data-user-positioned')) return;
      applyAutoPosition(floatingContainer, pos);
      floatingContainer.style.opacity = '1';
    });

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

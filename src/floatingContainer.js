import { debugLog } from './debug.js';
import {
  positionFloatingContainerRelativeToSearch,
  saveMenuPosition,
  loadMenuPosition,
  applySavedPosition,
  loadAutoPosition,
  applyAutoPosition,
} from './positionManager.js';
import { createEdgeBlob, loadBlobState, buttonsPositionFor, viewportWidth, viewportHeight, TEAR_DISTANCE } from './edgeBlob.js';
import { hideMenuContainer } from './menuVisibility.js';

// The mouse has to move this far before a press on the buttons counts as a drag, not a click
export const DRAG_THRESHOLD = 4;

let resizeAbortController = null;

// SF Symbols "pin.slash" drawn in the stroke style of the other icons; the slash is cut out of the pin
// by a stroke in the button colour (--csl-unpin-bg), like the SF Symbols slash
const UNPIN_ICON = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.75 1.75h6.5M6 1.75v4.5L3.75 9.25h8.5L10 6.25v-4.5" fill="var(--csl-icon-accent, #ff5722)"/><path d="M8 9.25v5"/><path d="M2.25 1.75l11.5 12.5" stroke="var(--csl-unpin-bg, #1f2329)" stroke-width="3.5"/><path d="M2.25 1.75l11.5 12.5"/></svg>';
export const UNPIN_LABEL = 'Unpin from the edge — keep the button here';

// Where the tooltip stands: beside the buttons, right of them when it fits, otherwise left.
// Not below or above them: that is where their menus open.
export function unpinTooltipPosition(buttons, tip, vw, vh, gap = 8) {
  const right = buttons.left + buttons.width + gap;
  const left = right + tip.width <= vw - gap ? right : Math.max(gap, buttons.left - gap - tip.width);
  const top = Math.max(gap, Math.min(vh - tip.height - gap, buttons.top + (buttons.height - tip.height) / 2));
  return { left, top };
}

// Shown next to the buttons only while they are out of the docked blob
function createUnpinButton() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'csl-unpin-button';
  btn.setAttribute('aria-label', UNPIN_LABEL);
  btn.innerHTML = UNPIN_ICON;
  btn.style.display = 'none';
  return btn;
}

// onPeekShown()          - the buttons came out of the docked blob and finished popping in
// onBlobClick(edge, box) - the docked blob was clicked; the buttons stay in it (without it a click brings them out)
export function setupFloatingContainer(pageType, buttonWrapper, extensionContainer, { onPeekShown, onBlobClick } = {}) {
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
  // above the blob's pool (9996) and Creatio's fixed panels, under the blob (9998) and the menus (9999);
  // inline !important beats the `z-index: 1000 !important` of the page stylesheets
  floatingContainer.style.setProperty('z-index', '9997', 'important');

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

  // The buttons themselves: the pool of the blob is drawn around them, not around the container,
  // which the page stylesheets pad and which may lie elsewhere (the buttons are absolutely positioned)
  const buttonsBox = () => {
    const r = buttonWrapper.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  };

  // moves the container so that the buttons stand at (left, top)
  const moveButtonsTo = (left, top) => {
    const b = buttonsBox();
    const c = floatingContainer.getBoundingClientRect();
    showButtonsAt(c.left + left - b.left, c.top + top - b.top);
  };

  const unpinButton = createUnpinButton();
  // The tooltip lives in the extension root, above the menus (the buttons are under them)
  const unpinTip = document.createElement('div');
  unpinTip.className = 'csl-unpin-tooltip';
  unpinTip.setAttribute('role', 'tooltip');
  unpinTip.id = 'csl-unpin-tooltip';
  unpinTip.textContent = UNPIN_LABEL;
  unpinTip.hidden = true;
  unpinButton.setAttribute('aria-describedby', unpinTip.id);
  let tipTimer = null;
  const hideTip = () => {
    clearTimeout(tipTimer);
    tipTimer = null;
    unpinTip.hidden = true;
  };
  const showTip = () => {
    unpinTip.hidden = false;
    const at = unpinTooltipPosition(buttonWrapper.getBoundingClientRect(), unpinTip.getBoundingClientRect(), viewportWidth(), viewportHeight());
    unpinTip.style.left = at.left + 'px';
    unpinTip.style.top = at.top + 'px';
  };
  const tipSoon = () => {
    clearTimeout(tipTimer);
    tipTimer = setTimeout(showTip, 300);
  };
  unpinButton.addEventListener('mouseenter', tipSoon);
  unpinButton.addEventListener('focus', tipSoon);
  unpinButton.addEventListener('mouseleave', hideTip);
  unpinButton.addEventListener('blur', hideTip);
  unpinButton.addEventListener('mousedown', hideTip);
  resizeAbortController.signal.addEventListener('abort', () => { hideTip(); unpinTip.remove(); });

  const showUnpin = (on) => {
    unpinButton.style.display = on ? '' : 'none';
    if (!on) hideTip();
  };
  unpinButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const edge = floatingContainer.getAttribute('data-edge-peek');
    const before = buttonWrapper.getBoundingClientRect();
    if (!edgeBlob.unpin()) return;
    // the buttons stay where they came out of the blob: that is their saved position now.
    // Without the unpin button they are narrower; on the right edge they keep their distance to it.
    floatingContainer.style.cursor = 'move';
    const shrunk = before.width - buttonWrapper.getBoundingClientRect().width;
    if (edge === 'right' && shrunk > 0) {
      floatingContainer.style.left = (parseFloat(floatingContainer.style.left) + shrunk) + 'px';
    }
    closeMenus();
    saveMenuPosition(parseFloat(floatingContainer.style.left), parseFloat(floatingContainer.style.top), pageType);
    debugLog('Buttons unpinned from the blob');
  });

  const closeMenus = () => {
    document.querySelectorAll('.scripts-menu-container').forEach(hideMenuContainer);
  };

  // `moved: true` starts a drag that is already under way (the buttons torn off a blob).
  // The buttons out of a docked blob (a peek) stay in their pool until dragged further than a button is high.
  let peekDrag = false;
  const beginDrag = (clientX, clientY, { moved = false } = {}) => {
    peekDrag = edgeBlob.peeking;
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
      if (peekDrag) {
        // the pool stretches after the buttons; torn, it lets them go (edgeBlob calls onUndock)
        const b = buttonsBox();
        edgeBlob.dragButtons(b.width ? b : { left: newX + box.offX, top: newY + box.offY, width: box.width, height: box.height });
        return;
      }
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
      if (peekDrag) {   // not dragged out of the pool: the buttons go back, nothing is saved
        peekDrag = false;
        edgeBlob.releaseButtons();
        return;
      }
      floatingContainer.setAttribute('data-user-positioned', 'true');
      // the drag has set left/top; the box can still be scaled by the pop-in after a tear-off
      saveMenuPosition(parseFloat(floatingContainer.style.left), parseFloat(floatingContainer.style.top), pageType);
      debugLog(`${isShell ? 'Shell' : 'Configuration'} container manually positioned`);
    };

    // The buttons became a blob mid-drag: the blob now follows the mouse. The buttons squash
    // under the cursor for a moment, so a quick release would still click one and open its menu.
    endDrag = () => {
      isDragging = false;
      stop();
      suppressClick = true;
      document.addEventListener('mouseup', () => setTimeout(() => { suppressClick = false; }, 0), { once: true });
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  floatingContainer.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    // on their way back into the blob the buttons are no longer theirs to drag
    if (edgeBlob.closing) return;
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
    if (typeof floatingContainer.animate !== 'function') return null;
    floatingContainer.style.transformOrigin = origin;
    return floatingContainer.animate(
      [{ transform: from, opacity: 0.4, borderRadius: '40px' }, { transform: 'scale(1)', opacity: 1, borderRadius: '8px' }],
      { duration: 380, easing: 'cubic-bezier(.34,1.56,.64,1)' }
    );
  };

  // The blob tears off once pulled further than a button is high. A hidden button measures 0,
  // so the last visible height is kept.
  let buttonHeight = 0;
  const tearDistance = () => {
    const h = buttonWrapper.querySelector('button')?.getBoundingClientRect().height;
    if (h) buttonHeight = h;
    return buttonHeight || TEAR_DISTANCE;
  };

  const edgeBlob = createEdgeBlob({
    root: extensionContainer,
    container: floatingContainer,
    buttons: () => buttonWrapper,
    pageType,
    signal: resizeAbortController.signal,
    tearDistance,
    onClick: onBlobClick,
    // the menu opened from the blob stays where the blob was: closed once the blob moves
    onPullStart: closeMenus,
    onBlob: () => {
      tearDistance();
      endDrag?.();
      closeMenus();
      // the blob holds the place: automatic positioning next to the search must not bring the buttons back
      floatingContainer.setAttribute('data-user-positioned', 'true');
    },
    onPeek: (edge, along) => {
      floatingContainer.removeAttribute('data-edge-docked');
      floatingContainer.setAttribute('data-edge-peek', edge);
      showUnpin(true);   // before the buttons are measured: the pool is drawn around it too
      // the buttons themselves, not the padded container, stand 8 px from the edge, centred on the blob;
      // not saved as the drag position: the buttons belong to the blob until it is pulled off
      let peekBox;
      const b = buttonsBox();
      if (b.width) {
        const at = buttonsPositionFor(edge, along, b.width, b.height, viewportWidth(), viewportHeight());
        moveButtonsTo(at.x, at.y);
        peekBox = buttonsBox();
      } else {   // the wrapper has no box (jsdom): place the container by its own box
        const box = visualBox();
        const pos = buttonsPositionFor(edge, along, box.width, box.height, viewportWidth(), viewportHeight());
        showButtonsAt(pos.x - box.offX, pos.y - box.offY);
        peekBox = { left: pos.x, top: pos.y, width: box.width, height: box.height };
      }
      tearDistance();
      // the buttons are uncovered from the spot of the blob as the pool grows under them
      const shown = () => { if (floatingContainer.hasAttribute('data-edge-peek')) onPeekShown?.(); };
      const reveal = edgeBlob.uncoverButtons();
      if (reveal) reveal.onfinish = shown;
      else shown();
      return peekBox;
    },
    onPeekEnd: () => {
      closeMenus();
      hideTip();
      floatingContainer.removeAttribute('data-edge-peek');
    },
    onUndock: () => {
      peekDrag = false;
      showUnpin(false);
      floatingContainer.removeAttribute('data-edge-peek');
      floatingContainer.style.cursor = 'grabbing';
    },
    onSnapBack: (box) => {
      // a snap-back still running would be measured as part of the position
      floatingContainer.getAnimations?.().forEach(a => a.cancel());
      const from = buttonWrapper.getBoundingClientRect().width ? buttonsBox() : visualBox();
      const dx = from.left - box.left, dy = from.top - box.top;
      const c = floatingContainer.getBoundingClientRect();
      showButtonsAt(c.left - dx, c.top - dy);
      floatingContainer.animate?.([{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }], { duration: 420, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    },
    onTearOff: (clientX, clientY) => {
      floatingContainer.removeAttribute('data-edge-docked');
      showUnpin(false);
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

  buttonWrapper.appendChild(unpinButton);
  floatingContainer.appendChild(buttonWrapper);
  extensionContainer.appendChild(floatingContainer);
  extensionContainer.appendChild(unpinTip);

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

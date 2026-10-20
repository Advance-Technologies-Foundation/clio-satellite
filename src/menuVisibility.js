import { debugLog } from './debug.js';

export function hideMenuContainer(menuContainer) {
  if (menuContainer) {
    menuContainer.classList.remove('visible');
    menuContainer.classList.add('hidden');
  }
}

export function showMenuContainer(menuContainer) {
  if (menuContainer) {
    menuContainer.classList.remove('hidden');
    menuContainer.classList.add('visible');
  }
}

export function adjustMenuPosition(relatedContainer, container) {
  container.style.top = '';
  container.style.left = '';
  container.style.right = '';
  container.style.bottom = '';
  container.style.transform = 'none';
  container.style.position = 'fixed';
  container.style.zIndex = '9999';

  const floating = relatedContainer.closest('.creatio-satelite-floating');
  if (floating) {
    const btnRect = relatedContainer.getBoundingClientRect();
    const extensionContainer = document.querySelector('.creatio-satelite-extension-container');
    if (extensionContainer && container.parentNode !== extensionContainer) {
      extensionContainer.appendChild(container);
    }

    container.style.position = 'fixed';
    container.style.zIndex = '9999';
    container.style.visibility = 'hidden';
    // Measured at the left edge of the screen: placed under a button near the right edge, a fixed menu
    // would be squeezed to the room left of the screen edge and report a narrower box than it really has
    container.style.top = '0px';
    container.style.left = '0px';
    container.style.minWidth = btnRect.width + 'px';

    container.offsetHeight; // force reflow

    const menuRect = container.getBoundingClientRect();
    // The box of all the buttons (the menu button and the unpin button next to it) is their wrapper;
    // the floating container itself has no size
    const buttons = relatedContainer.closest('.creatio-satelite')?.getBoundingClientRect() || btnRect;
    let newLeft = btnRect.left;
    let newTop = btnRect.bottom + 8;

    if (btnRect.left + menuRect.width > window.innerWidth) {
      // right edges in line with the last button, so no gap is left between the menu and the screen edge
      newLeft = Math.max(0, buttons.right - menuRect.width);
    }
    if (btnRect.bottom + 8 + menuRect.height > window.innerHeight) {
      newTop = btnRect.top - menuRect.height - 8;
    }
    // Room neither below nor above the button (a short window, or buttons halfway down a side edge):
    // open beside the buttons, so the menu stays on screen and covers none of them
    if (newTop < 0) {
      newTop = Math.max(8, Math.min(btnRect.top, window.innerHeight - menuRect.height - 8));
      newLeft = buttons.right + 8;
      if (newLeft + menuRect.width > window.innerWidth) newLeft = Math.max(0, buttons.left - menuRect.width - 8);
    }

    container.style.top = newTop + 'px';
    container.style.left = newLeft + 'px';
    container.style.visibility = 'visible';
    return;
  }

  const rect = relatedContainer.getBoundingClientRect();
  container.style.top = `${rect.bottom + 8}px`;
  container.style.left = `${rect.left}px`;
}

// Where the menu opened from the docked blob stands: beside the blob, away from its edge, centred on it
// along the edge and kept on screen. `blob` is the box of the blob, `menu` the size of the menu.
export function menuPositionAtEdge(edge, blob, menu, vw, vh, gap = 8) {
  const clamp = (v, max) => Math.max(gap, Math.min(max, v));
  const alongX = clamp(blob.left + blob.width / 2 - menu.width / 2, vw - menu.width - gap);
  const alongY = clamp(blob.top + blob.height / 2 - menu.height / 2, vh - menu.height - gap);
  switch (edge) {
    case 'left': return { left: blob.left + blob.width + gap, top: alongY };
    case 'right': return { left: Math.max(0, blob.left - menu.width - gap), top: alongY };
    case 'top': return { left: alongX, top: blob.top + blob.height + gap };
    default: return { left: alongX, top: Math.max(0, blob.top - menu.height - gap) };
  }
}

export function adjustMenuPositionAtEdge(edge, blob, container) {
  const extensionContainer = document.querySelector('.creatio-satelite-extension-container');
  if (extensionContainer && container.parentNode !== extensionContainer) extensionContainer.appendChild(container);
  container.style.right = '';
  container.style.bottom = '';
  container.style.transform = 'none';
  container.style.position = 'fixed';
  container.style.zIndex = '9999';
  container.style.visibility = 'hidden';
  // measured at the left edge of the screen, where nothing squeezes it (see adjustMenuPosition)
  container.style.top = '0px';
  container.style.left = '0px';
  container.offsetHeight; // force reflow
  const menuRect = container.getBoundingClientRect();
  const vw = document.documentElement.clientWidth || window.innerWidth;
  const vh = document.documentElement.clientHeight || window.innerHeight;
  const pos = menuPositionAtEdge(edge, blob, menuRect, vw, vh);
  container.style.top = pos.top + 'px';
  container.style.left = pos.left + 'px';
  container.style.visibility = 'visible';
}

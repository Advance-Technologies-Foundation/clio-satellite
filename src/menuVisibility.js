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
    container.style.top = (btnRect.bottom + 8) + 'px';
    container.style.left = btnRect.left + 'px';
    container.style.minWidth = btnRect.width + 'px';

    container.offsetHeight; // force reflow

    const menuRect = container.getBoundingClientRect();
    let newLeft = btnRect.left;
    let newTop = btnRect.bottom + 8;

    if (menuRect.right > window.innerWidth) {
      newLeft = Math.max(0, btnRect.right - menuRect.width);
    }
    if (menuRect.bottom > window.innerHeight) {
      newTop = btnRect.top - menuRect.height - 8;
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

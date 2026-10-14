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

// Left offsets for two menus open at once: the second starts right of the first, and both move
// left together when the pair would leave the screen on the right. `first` and `second` are the
// boxes ({ left, width }) the menus got from adjustMenuPosition.
export function sideBySideLefts(first, second, vw, gap = 8) {
  let a = first.left;
  let b = Math.max(second.left, first.left + first.width + gap);
  const over = b + second.width - (vw - gap);
  if (over > 0) {
    a -= over;
    b -= over;
  }
  if (a < gap) {   // a pair wider than the screen keeps the first menu fully visible
    b += gap - a;
    a = gap;
  }
  return { first: a, second: b };
}

// Opens two menus next to each other under (or above) their buttons without overlapping
export function placeMenusSideBySide(firstButton, firstMenu, secondButton, secondMenu) {
  adjustMenuPosition(firstButton, firstMenu);
  adjustMenuPosition(secondButton, secondMenu);
  const { first, second } = sideBySideLefts(
    firstMenu.getBoundingClientRect(), secondMenu.getBoundingClientRect(), window.innerWidth
  );
  firstMenu.style.left = first + 'px';
  secondMenu.style.left = second + 'px';
}

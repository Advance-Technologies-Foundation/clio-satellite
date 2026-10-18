import { debugLog, getLastError } from './debug.js';
import { state } from './state.js';
import { getCreatioPageType } from './pageDetection.js';
import { SCRIPT_FILES, SCRIPT_LABELS, MENU_ICONS, ACTION_DETAILS } from './menuConfig.js';
import { hideMenuContainer, showMenuContainer, adjustMenuPosition } from './menuVisibility.js';
import { setupFloatingContainer } from './floatingContainer.js';
import { attachShellNews } from './news/shellIndicator.js';
import { track } from './analytics.js';

// Guard against "Extension context invalidated" errors that occur when the
// extension is reloaded while a content script is still alive on the page.
function safeSendMessage(message) {
  try {
    if (!chrome.runtime?.id) return;
    chrome.runtime.sendMessage(message);
  } catch (_) {
    // context invalidated — nothing to do
  }
}

function createMatButton(color, extraClass, title) {
  const btn = document.createElement('button');
  btn.setAttribute('mat-flat-button', '');
  btn.setAttribute('color', color);
  btn.className = `mat-focus-indicator ${extraClass} mat-flat-button mat-button-base mat-${color}`;
  if (title) btn.title = title;
  btn.setAttribute('aria-haspopup', 'menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.style.setProperty('padding-right', '8px', 'important');

  const wrapper = document.createElement('span');
  wrapper.className = 'mat-button-wrapper';
  btn.appendChild(wrapper);

  const ripple = document.createElement('span');
  ripple.setAttribute('matripple', '');
  ripple.className = 'mat-ripple mat-button-ripple';
  btn.appendChild(ripple);

  const overlay = document.createElement('span');
  overlay.className = 'mat-button-focus-overlay';
  btn.appendChild(overlay);

  return { btn, wrapper };
}

function createArrowWrapper() {
  const wrapper = document.createElement('div');
  wrapper.className = 'mat-select-arrow-wrapper';
  wrapper.style.cssText = 'margin-left: 4px; padding-right: 2px;';
  const arrow = document.createElement('div');
  arrow.className = 'mat-select-arrow';
  wrapper.appendChild(arrow);
  return wrapper;
}

function createMenuItem(scriptName) {
  const iconData = MENU_ICONS[scriptName] || { svg: '', name: '' };

  const menuItem = document.createElement('div');
  menuItem.className = 'crt-menu-item-container mat-menu-item';
  menuItem.setAttribute('mat-menu-item', '');
  menuItem.setAttribute('aria-disabled', 'false');
  menuItem.setAttribute('role', 'menuitem');
  menuItem.setAttribute('tabindex', '0');

  const button = document.createElement('button');
  button.setAttribute('mat-flat-button', '');
  button.className = 'crt-menu-item mat-flat-button';
  button.setAttribute('data-item-marker', scriptName);
  button.setAttribute('aria-haspopup', 'false');
  button.setAttribute('aria-expanded', 'false');

  const matIcon = document.createElement('mat-icon');
  matIcon.setAttribute('role', 'img');
  matIcon.className = 'mat-icon notranslate mat-icon-no-color ng-star-inserted';
  matIcon.setAttribute('aria-hidden', 'true');
  matIcon.setAttribute('data-mat-icon-type', 'svg');
  if (iconData.name) matIcon.setAttribute('data-mat-icon-name', iconData.name);
  matIcon.innerHTML = iconData.svg;

  const caption = document.createElement('span');
  caption.className = 'caption';
  caption.setAttribute('crttextoverflowtitle', '');
  caption.textContent = ' ' + (SCRIPT_LABELS[scriptName] || scriptName.replace(/_/g, ' '));

  button.appendChild(matIcon);
  button.appendChild(caption);
  menuItem.appendChild(button);

  return menuItem;
}

function createDivider(marker) {
  const dividerContainer = document.createElement('div');
  dividerContainer.className = 'ng-star-inserted';
  dividerContainer.setAttribute('crt-menu-view-element-item', marker);
  dividerContainer.style.cssText = 'display: block; margin: 4px 0; opacity: 1; visibility: visible;';

  const crtDivider = document.createElement('crt-menu-divider');
  crtDivider.className = 'ng-star-inserted';
  crtDivider.style.cssText = 'display: block; margin: 0;';

  const matDivider = document.createElement('mat-divider');
  matDivider.setAttribute('role', 'separator');
  matDivider.className = 'mat-divider mat-divider-horizontal';
  matDivider.setAttribute('aria-orientation', 'horizontal');
  matDivider.style.cssText = 'display: block !important; height: 1px !important; background-color: rgba(255, 255, 255, 0.1) !important; border: none !important; margin: 0 8px !important;';

  crtDivider.appendChild(matDivider);
  dividerContainer.appendChild(crtDivider);
  return dividerContainer;
}

// One panel with two columns that always open together: the navigation items and Settings on the left,
// the actions that change the site (RestartApp, FlushRedisDB, autologin) on the right. Safe and unsafe
// items stay apart, and as one panel they can not drift apart the way two separate menus did.
// The actions column is filled by buildActionsSection every time the menu opens.
function buildNavMenu() {
  const menuContainer = document.createElement('div');
  menuContainer.classList.add('scripts-menu-container');
  hideMenuContainer(menuContainer);

  const columns = document.createElement('div');
  columns.className = 'csl-menu-columns';
  const navColumn = document.createElement('div');
  navColumn.className = 'csl-menu-column csl-nav-column';
  navColumn.setAttribute('role', 'group');
  navColumn.setAttribute('aria-label', 'Navigation');
  const actionsSection = document.createElement('div');
  actionsSection.className = 'csl-menu-column csl-actions-section';
  actionsSection.setAttribute('role', 'group');
  actionsSection.setAttribute('aria-label', 'Actions');
  columns.append(navColumn, actionsSection);
  menuContainer.appendChild(columns);

  SCRIPT_FILES.forEach(scriptFile => {
    const scriptName = scriptFile.replace('.js', '');

    if (scriptName === 'Settings') {
      navColumn.appendChild(createDivider('settings-divider'));
    }

    const menuItem = createMenuItem(scriptName);
    menuItem.addEventListener('click', () => {
      track('menu_click', { menu: 'navigation', item: scriptName });
      if (scriptName === 'Settings') {
        safeSendMessage({ action: 'openOptionsPage' });
      } else {
        safeSendMessage({ action: 'executeScript', scriptPath: `navigation/${scriptFile}` });
      }
      hideMenuContainer(menuContainer);
    });

    navColumn.appendChild(menuItem);
  });

  return { menuContainer, actionsSection };
}

// RestartApp and FlushRedisDB are added at once, so the menu has its full height when it is placed.
// The autologin item depends on the saved profiles and comes later; `onChange` lets the caller place
// the menu again once it is there.
function buildActionsSection(actionsSection, onChange) {
  actionsSection.innerHTML = '';
  ['RestartApp', 'FlushRedisDB'].forEach(name => actionsSection.appendChild(createActionItem(name, null)));

  chrome.storage.sync.get({ lastLoginProfiles: {}, userProfiles: [] }, data => {
    const err = getLastError();
    if (err) {
      console.error('[Clio Satellite] Failed to load profiles:', err.message);
      return;
    }
    if (!actionsSection.isConnected) return;
    const origin = window.location.origin;
    const rawEntry = data.lastLoginProfiles[origin];
    const lastUser = typeof rawEntry === 'string' ? rawEntry : rawEntry?.username;
    if (!lastUser) return;
    const profile = data.userProfiles.find(p => p.username === lastUser);
    const autologinEnabled = profile ? profile.autologin : false;
    actionsSection.querySelector('[data-csl-autologin]')?.remove();
    const item = createActionItem(autologinEnabled ? 'DisableAutologin' : 'EnableAutologin', lastUser);
    item.setAttribute('data-csl-autologin', '');
    actionsSection.appendChild(item);
    onChange?.();
  });
}

function createActionItem(name, lastUser) {
  const detail = ACTION_DETAILS[name];

  const menuItem = document.createElement('div');
  menuItem.className = 'crt-menu-item-container mat-menu-item';
  menuItem.setAttribute('mat-menu-item', '');
  menuItem.setAttribute('aria-disabled', 'false');
  menuItem.setAttribute('role', 'menuitem');
  menuItem.setAttribute('tabindex', '0');

  const menuButtonEl = document.createElement('button');
  menuButtonEl.className = 'crt-menu-item mat-flat-button';
  menuButtonEl.setAttribute('mat-flat-button', '');
  menuButtonEl.setAttribute('data-item-marker', name);

  const iconWrap = document.createElement('mat-icon');
  iconWrap.setAttribute('role', 'img');
  iconWrap.className = 'mat-icon notranslate mat-icon-no-color';
  iconWrap.setAttribute('aria-hidden', 'true');
  iconWrap.setAttribute('data-mat-icon-type', 'svg');
  iconWrap.setAttribute('data-mat-icon-name', detail.name || 'help');
  iconWrap.innerHTML = detail.icon || '';

  const caption = document.createElement('span');
  caption.className = 'caption';
  caption.setAttribute('crttextoverflowtitle', '');
  caption.textContent = name
    .replace('Autologin', ' autologin')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .trim();

  menuButtonEl.appendChild(iconWrap);
  menuButtonEl.appendChild(caption);
  menuItem.appendChild(menuButtonEl);

  menuItem.addEventListener('click', () => {
    track('menu_click', { menu: 'actions', item: name });
    if (name === 'EnableAutologin') {
      chrome.storage.sync.get({ userProfiles: [], lastLoginProfiles: {} }, ds => {
        const err = getLastError();
        if (err) {
          console.error('[Clio Satellite] Failed to load profiles for autologin:', err.message);
          return;
        }
        const profiles = ds.userProfiles.map(p =>
          p.username === lastUser ? { ...p, autologin: true } : p
        );
        chrome.storage.sync.set({ userProfiles: profiles }, () => {
          const err = getLastError();
          if (err) {
            console.error('[Clio Satellite] Failed to save autologin setting:', err.message);
          }
        });
      });
    } else if (name === 'DisableAutologin') {
      safeSendMessage({ action: 'disableAutologin' });
    } else {
      safeSendMessage({ action: 'executeScript', scriptPath: 'actions/' + detail.file });
    }
  });

  return menuItem;
}

export function createScriptsMenu() {
  debugLog('Creating scripts menu');

  if (state.menuCreated || document.querySelector('.creatio-satelite-extension-container .scripts-menu-button')) {
    debugLog('Menu already exists, skipping');
    return false;
  }

  const pageType = getCreatioPageType();
  if (!pageType || pageType === 'login' || (pageType !== 'shell' && pageType !== 'configuration')) {
    debugLog(`Page type "${pageType}" not supported for menu creation`);
    return false;
  }

  // Claim both locks: menuCreated blocks re-entry from checkCreatioPageAndCreateMenu,
  // menuCreating blocks monitorButtons from tearing down a half-built menu.
  state.menuCreated = true;
  state.menuCreating = true;

  const extensionContainer = document.createElement('div');
  extensionContainer.className = 'creatio-satelite-extension-container';
  extensionContainer.style.cssText = `
    position: fixed !important;
    z-index: 999999 !important;
    pointer-events: none !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    overflow: visible !important;
  `;

  const buttonWrapper = document.createElement('div');
  buttonWrapper.className = 'creatio-satelite';
  buttonWrapper.style.cssText = 'pointer-events: auto !important; position: absolute !important;';

  const { btn: menuButton, wrapper: menuButtonWrapper } = createMatButton('primary', 'scripts-menu-button', 'Clio satellite');

  const navCaption = document.createElement('div');
  navCaption.className = 'compile-button-caption';

  const navIcon = document.createElement('span');
  navIcon.className = 'creatio-satelite-button-icon';
  navIcon.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle class="csl-icon-dot" cx="8" cy="8" r="2.6" fill="var(--csl-icon-accent, #ff5722)" stroke="none"/><path d="M13.6 6.2A6 6 0 1 1 9.8 2.3"/><circle cx="12.6" cy="3.4" r="1.6" fill="currentColor" stroke="none"/></svg>`;

  navCaption.appendChild(navIcon);
  navCaption.appendChild(document.createTextNode('Clio satellite'));
  menuButtonWrapper.appendChild(navCaption);
  menuButtonWrapper.appendChild(createArrowWrapper());

  buttonWrapper.appendChild(menuButton);

  const { menuContainer, actionsSection } = buildNavMenu();

  // The button and the docked blob open the same one menu with every item in it
  const placeMenu = () => adjustMenuPosition(menuButton, menuContainer);
  const openMenu = () => {
    buildActionsSection(actionsSection, () => {
      if (menuContainer.classList.contains('visible')) placeMenu();
    });
    showMenuContainer(menuContainer);
    track('menu_open', { menu: 'navigation' });
    placeMenu();
  };
  const hideMenu = () => hideMenuContainer(menuContainer);
  menuContainer.addEventListener('click', event => {
    if (event.target.closest('[role="menuitem"]')) hideMenu();
  });

  menuButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (menuContainer.classList.contains('visible')) {
      hideMenu();
      return;
    }
    openMenu();
  });

  state.clickAbortController?.abort();
  state.clickAbortController = new AbortController();
  document.addEventListener('click', (event) => {
    const ec = document.querySelector('.creatio-satelite-extension-container');
    if (!ec) return;
    // the click on the docked blob is what opens the menus; the pool around the buttons belongs to them
    if (event.target.closest?.('.csl-edge-blob, .csl-edge-pool')) return;
    const mb = ec.querySelector('.scripts-menu-button');
    const menu = ec.querySelector('.scripts-menu-container');
    if (!mb || mb.contains(event.target)) return;
    if (!menu || menu.contains(event.target)) return;
    hideMenuContainer(menu);
  }, { capture: true, signal: state.clickAbortController.signal });

  try {
    setupFloatingContainer(pageType, buttonWrapper, extensionContainer, { onPeekShown: openMenu });

    const rootMenuContainer = document.createElement('div');
    rootMenuContainer.classList.add('creatio-satelite-menu-container');
    rootMenuContainer.appendChild(menuContainer);
    extensionContainer.appendChild(rootMenuContainer);

    // Mount on <html>, not <body>: while Shell loads, Creatio sets `inert` on <body>,
    // which would make the already visible buttons ignore clicks and focus.
    document.documentElement.appendChild(extensionContainer);

    state.menuCreating = false;
    // News are optional: a failure there must never take the menu down
    try {
      Promise.resolve(attachShellNews({ menuButton, menuContainer, buttonWrapper, pageType }))
        .catch(error => console.error('[Clio Satellite] Developer news failed:', error));
    } catch (error) {
      console.error('[Clio Satellite] Developer news failed:', error);
    }
    debugLog('Scripts menu created successfully');
    return true;
  } catch (error) {
    console.error('[Clio Satellite] Error creating menu:', error);
    state.menuCreated = false;
    state.menuCreating = false;
    return false;
  }
}

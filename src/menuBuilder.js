import { debugLog } from './debug.js';
import { state } from './state.js';
import { getCreatioPageType } from './pageDetection.js';
import { SCRIPT_FILES, SCRIPT_DESCRIPTIONS, MENU_ICONS, ACTION_DETAILS } from './menuConfig.js';
import { hideMenuContainer, showMenuContainer, adjustMenuPosition } from './menuVisibility.js';
import { setupFloatingContainer } from './floatingContainer.js';

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
  caption.textContent = ' ' + scriptName.replace(/_/g, ' ');

  button.appendChild(matIcon);
  button.appendChild(caption);
  menuItem.appendChild(button);

  return menuItem;
}

function buildNavMenu() {
  const menuContainer = document.createElement('div');
  menuContainer.classList.add('scripts-menu-container');
  hideMenuContainer(menuContainer);

  SCRIPT_FILES.forEach(scriptFile => {
    const scriptName = scriptFile.replace('.js', '');

    if (scriptName === 'Settings') {
      const dividerContainer = document.createElement('div');
      dividerContainer.className = 'ng-star-inserted';
      dividerContainer.setAttribute('crt-menu-view-element-item', 'settings-divider');
      dividerContainer.style.cssText = 'display: block; margin: 8px 0; opacity: 1; visibility: visible;';

      const crtDivider = document.createElement('crt-menu-divider');
      crtDivider.className = 'ng-star-inserted';
      crtDivider.style.cssText = 'display: block; margin: 8px 0;';

      const matDivider = document.createElement('mat-divider');
      matDivider.setAttribute('role', 'separator');
      matDivider.className = 'mat-divider mat-divider-horizontal';
      matDivider.setAttribute('aria-orientation', 'horizontal');
      matDivider.style.cssText = 'display: block !important; height: 1px !important; background-color: #e0e0e0 !important; border: none !important; margin: 0 16px !important;';

      crtDivider.appendChild(matDivider);
      dividerContainer.appendChild(crtDivider);
      menuContainer.appendChild(dividerContainer);
    }

    const menuItem = createMenuItem(scriptName);
    menuItem.addEventListener('click', () => {
      if (scriptName === 'Settings') {
        chrome.runtime.sendMessage({ action: 'openOptionsPage' });
      } else {
        chrome.runtime.sendMessage({ action: 'executeScript', scriptPath: `navigation/${scriptFile}` });
      }
      hideMenuContainer(menuContainer);
    });

    menuContainer.appendChild(menuItem);
  });

  return menuContainer;
}

function buildActionsMenu(actionsMenuContainer) {
  actionsMenuContainer.innerHTML = '';

  chrome.storage.sync.get({ lastLoginProfiles: {}, userProfiles: [] }, data => {
    if (chrome.runtime.lastError) {
      console.error('[Clio Satellite] Failed to load profiles:', chrome.runtime.lastError.message);
      return;
    }
    if (!actionsMenuContainer.isConnected) return;
    const origin = window.location.origin;
    const lastUser = data.lastLoginProfiles[origin];
    const profile = data.userProfiles.find(p => p.username === lastUser);
    const autologinEnabled = profile ? profile.autologin : false;

    const actionsList = ['RestartApp', 'FlushRedisDB'];
    if (lastUser) actionsList.push(autologinEnabled ? 'DisableAutologin' : 'EnableAutologin');

    actionsList.forEach(name => {
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
        if (name === 'EnableAutologin') {
          chrome.storage.sync.get({ userProfiles: [], lastLoginProfiles: {} }, ds => {
            if (chrome.runtime.lastError) {
              console.error('[Clio Satellite] Failed to load profiles for autologin:', chrome.runtime.lastError.message);
              return;
            }
            const profiles = ds.userProfiles.map(p =>
              p.username === lastUser ? { ...p, autologin: true } : p
            );
            chrome.storage.sync.set({ userProfiles: profiles }, () => {
              if (chrome.runtime.lastError) {
                console.error('[Clio Satellite] Failed to save autologin setting:', chrome.runtime.lastError.message);
              }
            });
          });
        } else if (name === 'DisableAutologin') {
          chrome.runtime.sendMessage({ action: 'disableAutologin' });
        } else {
          chrome.runtime.sendMessage({ action: 'executeScript', scriptPath: 'actions/' + detail.file });
        }
        hideMenuContainer(actionsMenuContainer);
      });

      actionsMenuContainer.appendChild(menuItem);
    });
  });
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
  navIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
    <path d="M8.109 1.023c.133-.133.35-.133.482 0l6.276 6.276c.133.133.133.35 0 .482l-6.276 6.276c-.133.133-.35.133-.482 0L1.833 7.781c-.133-.133-.133-.35 0-.482L8.109 1.023z" fill="currentColor"/>
    <path d="M10.5 6.5L9 5l-1 1 1.5 1.5L10.5 6.5z" fill="white"/>
    <path d="M13.5 3.5L12 2l-1 1 1.5 1.5L13.5 3.5z" fill="white"/>
    <path d="M4.5 12.5L3 11l-1 1 1.5 1.5L4.5 12.5z" fill="white"/>
    <path d="M2 13l1-1 1 1-1 1-1-1z" fill="white"/>
  </svg>`;

  navCaption.appendChild(navIcon);
  navCaption.appendChild(document.createTextNode('Clio satellite'));
  menuButtonWrapper.appendChild(navCaption);
  menuButtonWrapper.appendChild(createArrowWrapper());

  const { btn: actionsButton, wrapper: actionsButtonWrapper } = createMatButton('accent', 'actions-button');

  const actionsCaption = document.createElement('div');
  actionsCaption.className = 'compile-button-caption';

  const actionsIcon = document.createElement('span');
  actionsIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.5 1L2 7h4l-1 8L11 9H7l1.5-8z" fill="currentColor"/>
  </svg>`;

  actionsCaption.appendChild(actionsIcon);
  actionsButtonWrapper.appendChild(actionsCaption);
  actionsButtonWrapper.appendChild(createArrowWrapper());

  buttonWrapper.appendChild(menuButton);
  buttonWrapper.appendChild(actionsButton);

  const menuContainer = buildNavMenu();

  const actionsMenuContainer = document.createElement('div');
  actionsMenuContainer.classList.add('actions-menu-container');
  hideMenuContainer(actionsMenuContainer);

  actionsButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (actionsMenuContainer.classList.contains('visible')) {
      hideMenuContainer(actionsMenuContainer);
      return;
    }
    hideMenuContainer(menuContainer);
    buildActionsMenu(actionsMenuContainer);
    showMenuContainer(actionsMenuContainer);
    adjustMenuPosition(actionsButton, actionsMenuContainer);
  });

  menuButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (menuContainer.classList.contains('visible')) {
      hideMenuContainer(menuContainer);
      return;
    }
    hideMenuContainer(actionsMenuContainer);
    showMenuContainer(menuContainer);
    adjustMenuPosition(menuButton, menuContainer);
  });

  state.clickAbortController?.abort();
  state.clickAbortController = new AbortController();
  document.addEventListener('click', (event) => {
    const ec = document.querySelector('.creatio-satelite-extension-container');
    if (!ec) return;
    const mb = ec.querySelector('.scripts-menu-button');
    const ab = ec.querySelector('.actions-button');
    const mc = ec.querySelector('.scripts-menu-container');
    const amc = ec.querySelector('.actions-menu-container');
    if (mb && mc && !mb.contains(event.target) && !mc.contains(event.target)) hideMenuContainer(mc);
    if (ab && amc && !ab.contains(event.target) && !amc.contains(event.target)) hideMenuContainer(amc);
  }, { capture: true, signal: state.clickAbortController.signal });

  try {
    setupFloatingContainer(pageType, buttonWrapper, extensionContainer);

    const rootMenuContainer = document.createElement('div');
    rootMenuContainer.classList.add('creatio-satelite-menu-container');
    rootMenuContainer.appendChild(menuContainer);
    rootMenuContainer.appendChild(actionsMenuContainer);
    extensionContainer.appendChild(rootMenuContainer);

    document.body.appendChild(extensionContainer);

    state.actionsMenuCreated = true;
    state.menuCreating = false;
    debugLog('Scripts menu created successfully');
    return true;
  } catch (error) {
    console.error('[Clio Satellite] Error creating menu:', error);
    state.menuCreated = false;
    state.actionsMenuCreated = false;
    state.menuCreating = false;
    return false;
  }
}

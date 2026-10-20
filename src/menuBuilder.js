import { debugLog, getLastError } from './debug.js';
import { state } from './state.js';
import { getCreatioPageType } from './pageDetection.js';
import { SCRIPT_FILES, SCRIPT_LABELS, MENU_ICONS, ACTION_DETAILS } from './menuConfig.js';
import { hideMenuContainer, showMenuContainer, adjustMenuPosition, adjustMenuPositionAtEdge } from './menuVisibility.js';
import { setupFloatingContainer } from './floatingContainer.js';
import { attachShellNews } from './news/shellIndicator.js';
import { ARCHIVE_URL } from './news/newsCards.js';
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

// Open book: the developer news page on GitHub Pages
const NEWS_ARCHIVE_ICON = '<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4.2C6.6 3 4.6 2.6 1.75 2.75v9.5C4.6 12.1 6.6 12.5 8 13.7c1.4-1.2 3.4-1.6 6.25-1.45v-9.5C11.4 2.6 9.4 3 8 4.2z"/><path d="M8 4.2v9.5" stroke="var(--csl-icon-accent, #ff5722)"/></svg>';

function createHeaderIcon(tag, marker, label, svg) {
  const node = document.createElement(tag);
  node.className = 'csl-menu-icon-btn';
  node.setAttribute('data-item-marker', marker);
  node.setAttribute('aria-label', label);
  node.title = label;
  if (tag === 'button') node.type = 'button';
  node.innerHTML = svg;
  return node;
}

// Settings (gear) and the news page (open book) as icons. By default they sit in the bottom-right corner of the
// panel, over the empty end of the short actions column, so they take no room; with "menuIconsAtTop" in Options
// they are a header row in the top-right corner instead.
export const ICONS_TOP_CLASS = 'csl-menu--icons-top';

function buildMenuHeader(menuContainer) {
  const header = document.createElement('div');
  header.className = 'csl-menu-header';

  const settings = createHeaderIcon('button', 'Settings', 'Settings', MENU_ICONS.Settings.svg);
  settings.addEventListener('click', () => {
    track('menu_click', { menu: 'navigation', item: 'Settings' });
    safeSendMessage({ action: 'openOptionsPage' });
    hideMenuContainer(menuContainer);
  });

  const news = createHeaderIcon('a', 'NewsArchive', 'Developer news', NEWS_ARCHIVE_ICON);
  news.href = ARCHIVE_URL;
  news.target = '_blank';
  news.rel = 'noopener noreferrer';
  news.addEventListener('click', () => {
    track('news_archive_open', { surface: 'shell' });
    hideMenuContainer(menuContainer);
  });

  header.append(settings, news);
  return header;
}

// One panel: the Settings and news icons, then a row of columns. The news column
// (added by shellIndicator, shown only while there are unread news) is on the left; the navigation
// items and the actions that change the site (RestartApp, FlushRedisDB, autologin) follow. Safe and
// unsafe items stay apart, and as one panel they can not drift apart the way two separate menus did.
// The actions column is filled by buildActionsSection every time the menu opens.
function buildNavMenu() {
  const menuContainer = document.createElement('div');
  menuContainer.classList.add('scripts-menu-container');
  hideMenuContainer(menuContainer);

  const body = document.createElement('div');
  body.className = 'csl-menu-body';
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
  body.appendChild(columns);
  menuContainer.append(buildMenuHeader(menuContainer), body);

  SCRIPT_FILES.forEach(scriptFile => {
    const scriptName = scriptFile.replace('.js', '');
    const menuItem = createMenuItem(scriptName);
    menuItem.addEventListener('click', () => {
      track('menu_click', { menu: 'navigation', item: scriptName });
      safeSendMessage({ action: 'executeScript', scriptPath: `navigation/${scriptFile}` });
      hideMenuContainer(menuContainer);
    });

    navColumn.appendChild(menuItem);
  });

  return { menuContainer, menuBody: body, actionsSection };
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

// Read on every open, so a change in Options applies without a page reload; the panel is placed again
// only when the icons moved, since the header row changes its height
function applyIconsPosition(menuContainer, onChange) {
  chrome.storage.sync.get({ menuIconsAtTop: false }, data => {
    if (getLastError()) return;
    const atTop = data.menuIconsAtTop === true;
    if (atTop === menuContainer.classList.contains(ICONS_TOP_CLASS)) return;
    menuContainer.classList.toggle(ICONS_TOP_CLASS, atTop);
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

  const { menuContainer, menuBody, actionsSection } = buildNavMenu();

  // The button and the docked blob open the same one menu with every item in it.
  // A click on the blob opens it next to the blob, the buttons stay hidden in it.
  let blobAnchor = null;   // { edge, box } of the blob the open menu came from
  const placeMenu = () => (blobAnchor
    ? adjustMenuPositionAtEdge(blobAnchor.edge, blobAnchor.box, menuContainer)
    : adjustMenuPosition(menuButton, menuContainer));
  const placeIfOpen = () => { if (menuContainer.classList.contains('visible')) placeMenu(); };
  const openMenu = (anchor = null) => {
    blobAnchor = anchor;
    buildActionsSection(actionsSection, placeIfOpen);
    applyIconsPosition(menuContainer, placeIfOpen);
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
    setupFloatingContainer(pageType, buttonWrapper, extensionContainer, {
      onPeekShown: () => openMenu(),
      onBlobClick: (edge, box) => {
        if (blobAnchor && menuContainer.classList.contains('visible')) hideMenu();
        else openMenu({ edge, box });
      },
    });

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
      Promise.resolve(attachShellNews({
        menuButton, menuContainer, menuBody, buttonWrapper, pageType,
        // the news column appears and disappears with unread news: place the open menu again
        onLayoutChange: () => { if (menuContainer.classList.contains('visible')) placeMenu(); },
      }))
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

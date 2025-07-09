// Global flag to track if menu is already created
let menuCreated = false;
let actionsMenuCreated = false; // New flag to track Actions menu creation

const debugExtension = false;

// Detect operating system for proper hotkey display
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const modifierKey = isMac ? 'Cmd' : 'Ctrl';

// HotKey functionality
let hotKeysEnabled = true;
const hotKeyState = {
  ctrl: false,
  shift: false,
  alt: false,
  keys: []
};

// Function to get hotkey string with proper modifier
function getHotkeyString(letter) {
  return `${modifierKey}+Shift+${letter.toUpperCase()}`;
}

// HotKey combinations for extension functions
const hotKeyCombinations = {
  // Navigation menu - Ctrl+Shift+V (naVigation)
  'ctrl+shift+v': () => toggleNavigationMenu(),
  // Actions menu - Ctrl+Shift+A (Actions) 
  'ctrl+shift+a': () => toggleActionsMenu(),
  
  // Quick Actions
  'ctrl+shift+r': () => executeQuickAction('RestartApp'), // Restart
  'ctrl+shift+f': () => executeQuickAction('FlushRedisDB'), // Flush
  'ctrl+shift+s': () => executeQuickAction('Settings'), // Settings
  
  // Navigation Scripts (using first letter of section name)
  'ctrl+shift+e': () => executeNavigationScript('Features'), // F(e)atures (avoiding conflict with Flush)
  'ctrl+shift+m': () => executeNavigationScript('Application_Managment'), // (M)anagement
  'ctrl+shift+l': () => executeNavigationScript('Lookups'), // Lookups
  'ctrl+shift+p': () => executeNavigationScript('Process_library'), // Process library
  'ctrl+shift+g': () => executeNavigationScript('Process_log'), // Process lo(g)
  'ctrl+shift+y': () => executeNavigationScript('SysSettings'), // S(y)sSettings (avoiding conflict with Settings)
  'ctrl+shift=u': () => executeNavigationScript('Users'), // Users
  'ctrl+shift+c': () => executeNavigationScript('Configuration'), // Configuration
  'ctrl+shift+t': () => executeNavigationScript('TIDE') // TIDE
};

function executeQuickAction(actionName) {
  if (!isShellPage()) return;
  
  if (actionName === 'Settings') {
    chrome.runtime.sendMessage({action: 'openOptionsPage'});
    showHotKeyFeedback('Settings opened');
    return;
  }
  
  const actionFiles = {
    'RestartApp': 'actions/RestartApp.js',
    'FlushRedisDB': 'actions/FlushRedisDB.js'
  };
  
  if (actionFiles[actionName]) {
    chrome.runtime.sendMessage({
      action: 'executeScript',
      scriptPath: actionFiles[actionName]
    });
    
    // Show visual feedback
    showHotKeyFeedback(`${actionName.replace(/([A-Z])/g, ' $1').trim()} executed`);
  }
}

function executeNavigationScript(scriptName) {
  if (!isShellPage()) return;
  
  chrome.runtime.sendMessage({
    action: 'executeScript',
    scriptPath: `navigation/${scriptName}.js`
  });
  
  // Show visual feedback
  const displayName = scriptName.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
  showHotKeyFeedback(`${displayName} opened`);
}

function toggleNavigationMenu() {
  if (!isShellPage()) return;
  
  const menuContainer = document.querySelector('.scripts-menu-container');
  const actionsContainer = document.querySelector('.actions-menu-container');
  const menuButton = document.querySelector('.scripts-menu-button');
  
  if (menuContainer && menuButton) {
    hideMenuContainer(actionsContainer);
    if (menuContainer.classList.contains('visible')) {
      hideMenuContainer(menuContainer);
    } else {
      showMenuContainer(menuContainer);
      // Use same positioning as click handler
      adjustMenuPosition(menuButton, menuContainer);
    }
  }
}

function toggleActionsMenu() {
  if (!isShellPage()) return;
  
  const menuContainer = document.querySelector('.scripts-menu-container');
  const actionsContainer = document.querySelector('.actions-menu-container');
  const actionsButton = document.querySelector('.actions-button');
  
  if (actionsContainer && actionsButton) {
    hideMenuContainer(menuContainer);
    if (actionsContainer.classList.contains('visible')) {
      hideMenuContainer(actionsContainer);
    } else {
      // Refresh actions menu before showing
      if (window.refreshActionsMenu) {
        window.refreshActionsMenu();
      }
      showMenuContainer(actionsContainer);
      // Use same positioning as click handler
      adjustMenuPosition(actionsButton, actionsContainer);
    }
  }
}

function showHotKeyFeedback(message) {
  // Remove existing feedback
  const existingFeedback = document.querySelector('.hotkey-feedback');
  if (existingFeedback) {
    existingFeedback.remove();
  }
  
  // Create feedback element
  const feedback = document.createElement('div');
  feedback.className = 'hotkey-feedback';
  feedback.textContent = message;
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    background: #4CAF50;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-family: 'Montserrat', sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  
  document.body.appendChild(feedback);
  
  // Animate in
  setTimeout(() => {
    feedback.style.opacity = '1';
  }, 10);
  
  // Animate out and remove
  setTimeout(() => {
    feedback.style.opacity = '0';
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 300);
  }, 2000);
}

function handleKeyDown(event) {
  if (!hotKeysEnabled || !isShellPage()) return;
  
  // Track modifier keys
  hotKeyState.ctrl = event.ctrlKey || event.metaKey; // Support both Ctrl and Cmd
  hotKeyState.shift = event.shiftKey;
  hotKeyState.alt = event.altKey;
  
  // Build combination string
  let combo = '';
  if (hotKeyState.ctrl) combo += 'ctrl+';
  if (hotKeyState.shift) combo += 'shift+';
  if (hotKeyState.alt) combo += 'alt+';
  combo += event.key.toLowerCase();
  
  // Check if combination matches any hotkey
  if (hotKeyCombinations[combo]) {
    event.preventDefault();
    event.stopPropagation();
    hotKeyCombinations[combo]();
  }
}

function handleKeyUp(event) {
  // Reset modifier key states
  if (!event.ctrlKey && !event.metaKey) hotKeyState.ctrl = false;
  if (!event.shiftKey) hotKeyState.shift = false;
  if (!event.altKey) hotKeyState.alt = false;
}

// Add keyboard event listeners
document.addEventListener('keydown', handleKeyDown, true);
document.addEventListener('keyup', handleKeyUp, true);

function debugLog(message) {
  if (debugExtension) {
    console.log('[Clio Satellite]:', message);
  }
}

function hideMenuContainer(menuContainer) {
  menuContainer.classList.remove('visible');
  menuContainer.classList.add('hidden');
}

function showMenuContainer(menuContainer) {
  menuContainer.classList.remove('hidden');
  menuContainer.classList.add('visible');
}

// Function to check if current page is a Creatio page (Shell or Configuration)
function getCreatioPageType() {
  const currentHost = window.location.hostname;
  const currentPath = window.location.pathname.toLowerCase();
  const currentUrl = window.location.href.toLowerCase();

  const excludedDomains = [
    'gitlab.com',
    'github.com',
    'bitbucket.org',
    'google.com',
    'mail.google.com',
    'youtube.com',
    'atlassian.net',
    'upsource.creatio.com',
    'work.creatio.com',
    'community.creatio.com'
  ];

  for (const domain of excludedDomains) {
    if (currentHost.includes(domain)) {
      debugLog(`Domain ${currentHost} is in the exclusion list. Skipping activation.`);
      return null;
    }
  }

  // AGGRESSIVE LOGIN PAGE DETECTION - Block navigation/actions buttons on login pages
  const loginIndicators = [
    // URL patterns
    currentPath.includes('/login'),
    currentPath.includes('/auth'),
    currentPath.includes('/signin'),
    currentPath.includes('/authentication'),
    currentUrl.includes('login'),
    currentUrl.includes('auth'),
    currentUrl.includes('signin'),
    
    // DOM element indicators
    document.querySelector('#loginEdit-el'),
    document.querySelector('#passwordEdit-el'),
    document.querySelector('.login-button-login'),
    document.querySelector('input[name*="username"]'),
    document.querySelector('input[name*="password"]'),
    document.querySelector('input[name*="login"]'),
    document.querySelector('form[action*="login"]'),
    document.querySelector('[class*="login"]'),
    document.querySelector('[id*="login"]'),
    document.querySelector('[class*="auth"]'),
    document.querySelector('[id*="auth"]'),
    
    // Text content indicators
    document.body && document.body.textContent.toLowerCase().includes('sign in'),
    document.body && document.body.textContent.toLowerCase().includes('log in'),
    document.body && document.body.textContent.toLowerCase().includes('authentication'),
    
    // Title indicators
    document.title.toLowerCase().includes('login'),
    document.title.toLowerCase().includes('auth'),
    document.title.toLowerCase().includes('sign in'),
    
    // Meta tag indicators
    document.querySelector('meta[name*="login"]'),
    document.querySelector('meta[content*="login"]'),
    document.querySelector('meta[content*="auth"]')
  ];

  const loginDetected = loginIndicators.some(indicator => indicator);
  
  if (loginDetected) {
    debugLog('LOGIN PAGE DETECTED - Navigation/Actions buttons will be blocked');
    return 'login'; // Return special type for login pages
  }

  // Check for Configuration page first
  const configurationIndicator = document.querySelector('ts-workspace-section');
  if (configurationIndicator) {
    debugLog('Configuration page detected');
    return 'configuration';
  }

  // Check for Shell page indicators
  const shellIndicators = [
    document.getElementById('ShellContainerWithBackground'),
    document.querySelector('mainshell'),
    document.querySelector('crt-schema-outlet'),
    document.querySelector('[data-item-marker="AppToolbarGlobalSearch"]'),
    document.querySelector('crt-app-toolbar'),
    document.querySelector('.creatio-logo'),
    document.querySelector('[id*="Terrasoft"]'),
    document.querySelector('[class*="Terrasoft"]'),
    document.querySelector('script[src*="creatio"]'),
    document.querySelector('script[src*="terrasoft"]'),
    document.querySelector('link[href*="creatio"]'),
    document.querySelector('link[href*="terrasoft"]')
  ];

  const MIN_INDICATORS = 2;
  const foundIndicators = shellIndicators.filter(indicator => indicator);

  if (foundIndicators.length >= MIN_INDICATORS) {
    debugLog(`Shell page detected with ${foundIndicators.length} indicators`);
    return 'shell';
  }

  debugLog(`Not enough Creatio indicators found (${foundIndicators.length}/${MIN_INDICATORS}). Page not recognized.`);
  return null;
}

// Legacy function for backward compatibility - now with login page blocking
function isShellPage() {
  const pageType = getCreatioPageType();
  // Only allow Shell and Configuration pages, block login pages
  return pageType === 'shell' || pageType === 'configuration';
}

function adjustMenuPosition(relatedContainer, container) {
  // Сбросить все смещения
  container.style.top = '';
  container.style.left = '';
  container.style.right = '';
  container.style.bottom = '';
  container.style.transform = 'none';
  container.style.position = 'fixed';
  container.style.zIndex = '1000';

  // Если кнопка внутри floatingContainer (конфигурация), позиционируем относительно него
  const floating = relatedContainer.closest('.creatio-satelite-floating');
  if (floating) {
    // Получаем позицию кнопки внутри floatingContainer
    const btnRect = relatedContainer.getBoundingClientRect();
    const floatRect = floating.getBoundingClientRect();
    // Смещение кнопки относительно контейнера
    const offsetLeft = btnRect.left - floatRect.left;
    const offsetTop = btnRect.top - floatRect.top;
    container.style.position = 'absolute';
    container.style.top = (offsetTop + relatedContainer.offsetHeight + 2) + 'px';
    container.style.left = offsetLeft + 'px';
    floating.appendChild(container); // меню должно быть внутри floatingContainer
    return;
  }

  // Обычное позиционирование (Shell)
  const rect = relatedContainer.getBoundingClientRect();
  container.style.top = `${rect.bottom + 2}px`;
  container.style.left = `${rect.left}px`;
}

// Enhanced tooltip function for Actions button
function createEnhancedTooltip(text, targetElement) {
  const tooltip = document.createElement('div');
  tooltip.className = 'enhanced-tooltip';
  tooltip.innerHTML = text;
  
  tooltip.style.cssText = `
    position: absolute;
    background: #333;
    color: white;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-family: "Roboto", sans-serif;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    pointer-events: none;
    max-width: 280px;
    white-space: normal;
    text-align: center;
    line-height: 1.4;
    border: 1px solid #555;
  `;
  
  document.body.appendChild(tooltip);
  
  // Position tooltip
  const rect = targetElement.getBoundingClientRect();
  tooltip.style.left = (rect.left + rect.width / 2) + 'px';
  tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
  tooltip.style.transform = 'translateX(-50%)';
  
  // Add arrow
  const arrow = document.createElement('div');
  arrow.style.cssText = `
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: #333;
  `;
  tooltip.appendChild(arrow);
  
  // Animate in
  setTimeout(() => tooltip.style.opacity = '1', 10);
  
  return tooltip;
}

// Функция для создания меню скриптов напрямую из content script
function createScriptsMenu() {
  debugLog('Creating scripts menu - start');

  // Prevent duplicate menu creation
  if (menuCreated || document.querySelector('.scripts-menu-button')) {
    debugLog('Menu already exists, skipping creation');
    return false;
  }

  const pageType = getCreatioPageType();
  if (!pageType) {
    debugLog('Page type not recognized, skipping menu creation');
    return false;
  }

  debugLog(`Creating menu for page type: ${pageType}`);

  let targetContainer = null;
  let topPosition = '20px';

  if (pageType === 'configuration') {
    // For Configuration page, find the left-container
    targetContainer = document.querySelector('.left-container');
    if (!targetContainer) {
      debugLog('Configuration page detected but .left-container not found, retrying later...');
      return false;
    }
    debugLog('Configuration page: targeting .left-container');
  } else if (pageType === 'shell') {
    // For Shell page, use existing logic
    const searchElement = document.querySelector('[id*="AppToolbarGlobalSearch"]') ||
                         document.querySelector('[class*="AppToolbarGlobalSearch"]') ||
                         document.querySelector('.global-search');

    if (searchElement) {
      const searchRect = searchElement.getBoundingClientRect();
      topPosition = searchRect.top + 'px';
      debugLog(`Shell page: Found search element, position: ${topPosition}`);
    }
  }

  // Create button wrapper with CSS class
  const buttonWrapper = document.createElement('div');
  buttonWrapper.className = 'creatio-satelite';

  // Create menu button with exact structure as Configuration buttons
  const menuButton = document.createElement('button');
  menuButton.setAttribute('mat-flat-button', '');
  menuButton.setAttribute('color', 'primary');
  menuButton.className = 'mat-focus-indicator scripts-menu-button mat-flat-button mat-button-base mat-primary';
  menuButton.title = `Navigation - ${getHotkeyString('V')}`;
  menuButton.setAttribute('aria-haspopup', 'menu');
  menuButton.setAttribute('aria-expanded', 'false');
  
  // Create button wrapper span
  const menuButtonWrapper = document.createElement('span');
  menuButtonWrapper.className = 'mat-button-wrapper';
  
  // Create button caption div
  const menuButtonCaption = document.createElement('div');
  menuButtonCaption.className = 'compile-button-caption';
  menuButtonCaption.innerHTML = 'Na<u>v</u>igation';
  
  // Create arrow wrapper (dropdown indicator)
  const menuArrowWrapper = document.createElement('div');
  menuArrowWrapper.className = 'mat-select-arrow-wrapper';
  const menuArrow = document.createElement('div');
  menuArrow.className = 'mat-select-arrow';
  menuArrowWrapper.appendChild(menuArrow);
  
  // Assemble menu button
  menuButtonWrapper.appendChild(menuButtonCaption);
  menuButtonWrapper.appendChild(menuArrowWrapper);
  menuButton.appendChild(menuButtonWrapper);
  
  // Add ripple effect
  const menuRipple = document.createElement('span');
  menuRipple.setAttribute('matripple', '');
  menuRipple.className = 'mat-ripple mat-button-ripple';
  menuButton.appendChild(menuRipple);
  
  // Add focus overlay
  const menuFocusOverlay = document.createElement('span');
  menuFocusOverlay.className = 'mat-button-focus-overlay';
  menuButton.appendChild(menuFocusOverlay);

  // Create actions button with exact structure as Configuration buttons
  const actionsButton = document.createElement('button');
  actionsButton.setAttribute('mat-flat-button', '');
  actionsButton.setAttribute('color', 'accent');
  actionsButton.className = 'mat-focus-indicator actions-button mat-flat-button mat-button-base mat-accent';
  actionsButton.title = `Actions - ${getHotkeyString('A')}`;
  actionsButton.setAttribute('aria-haspopup', 'menu');
  actionsButton.setAttribute('aria-expanded', 'false');
  
  // Create button wrapper span
  const actionsButtonWrapper = document.createElement('span');
  actionsButtonWrapper.className = 'mat-button-wrapper';
  
  // Create button caption div
  const actionsButtonCaption = document.createElement('div');
  actionsButtonCaption.className = 'compile-button-caption';
  actionsButtonCaption.innerHTML = '<u>A</u>ctions';
  
  // Create arrow wrapper (dropdown indicator)
  const actionsArrowWrapper = document.createElement('div');
  actionsArrowWrapper.className = 'mat-select-arrow-wrapper';
  const actionsArrow = document.createElement('div');
  actionsArrow.className = 'mat-select-arrow';
  actionsArrowWrapper.appendChild(actionsArrow);
  
  // Assemble actions button
  actionsButtonWrapper.appendChild(actionsButtonCaption);
  actionsButtonWrapper.appendChild(actionsArrowWrapper);
  actionsButton.appendChild(actionsButtonWrapper);
  
  // Add ripple effect
  const actionsRipple = document.createElement('span');
  actionsRipple.setAttribute('matripple', '');
  actionsRipple.className = 'mat-ripple mat-button-ripple';
  actionsButton.appendChild(actionsRipple);
  
  // Add focus overlay
  const actionsFocusOverlay = document.createElement('span');
  actionsFocusOverlay.className = 'mat-button-focus-overlay';
  actionsButton.appendChild(actionsFocusOverlay);

  // Add enhanced tooltip to Actions button
  // Удалён тултип с кнопки Actions по требованию

  buttonWrapper.appendChild(menuButton);
  buttonWrapper.appendChild(actionsButton);

  // Create menu container with CSS class
  const menuContainer = document.createElement('div');
  menuContainer.classList.add('scripts-menu-container');
  hideMenuContainer(menuContainer); // Initially hidden
  // Position will be set by adjustMenuPosition function

  const scriptDescriptions = {
    'Features': `Open system features management page (${getHotkeyString('E')})`,
    'Application_Managment': `Application managment - App Hub (${getHotkeyString('M')})`,
    'Lookups': `Open system lookups (${getHotkeyString('L')})`,
    'Process_library': `Open process library (${getHotkeyString('P')})`,
    'Process_log': `View process log (${getHotkeyString('G')})`,
    'SysSettings': `System settings and parameters (${getHotkeyString('Y')})`,
    'Users': `Manage system users (${getHotkeyString('U')})`,
    'Configuration': `Open configuration (${getHotkeyString('C')})`,
    'TIDE': `Open Team Integrated Development Environment (${getHotkeyString('T')})`
  };

  const scriptFiles = [
    'Features.js',
    'Application_Managment.js',
    'Lookups.js',
    'Process_library.js',
    'Process_log.js',
    'SysSettings.js',
    'Users.js',
    'Configuration.js',
    'TIDE.js'
  ];

  scriptFiles.forEach(scriptFile => {
    const scriptName = scriptFile.replace('.js', '');
    const menuIcons = {
      'Features': {
        svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.6477 3.7921C10.0849 3.98314 9.4883 4.26947 8.94174 4.69091C8.89082 4.73017 8.85784 4.78936 8.85784 4.85366V14.2763C8.85784 14.3201 8.90952 14.3396 8.93467 14.3038C9.31132 13.7685 10.03 13.3802 10.9124 13.1213C11.774 12.8685 12.6597 12.7776 13.1956 12.7466C13.6472 12.7204 14 12.3491 14 11.8998V4.25019C14 3.79737 13.6424 3.42414 13.187 3.40169L13.1839 3.40154L13.1785 3.40131L13.1631 3.40071C13.1509 3.40028 13.1346 3.39979 13.1146 3.39938C13.0747 3.39856 13.0196 3.39803 12.9514 3.39884C12.815 3.40044 12.6247 3.40734 12.3953 3.428C11.9394 3.46907 11.3143 3.56581 10.6477 3.7921Z" fill="currentColor"></path><path d="M7.06679 14.3046C7.09196 14.3403 7.14355 14.3208 7.14355 14.2771V4.85559C7.14355 4.79051 7.11013 4.73061 7.05859 4.69087C6.51205 4.26945 5.91539 3.98312 5.35259 3.7921C4.6859 3.5658 4.06074 3.46906 3.60478 3.428C3.37541 3.40734 3.18503 3.40044 3.04866 3.39884C2.98038 3.39803 2.92533 3.39856 2.88537 3.39938C2.86539 3.39979 2.84915 3.40028 2.83688 3.40071L2.82148 3.40131L2.81607 3.40154L2.81394 3.40164L2.8122 3.40173C2.35727 3.42415 2 3.79701 2 4.24937V11.8999C2 12.3484 2.35168 12.7194 2.80252 12.7464C3.3393 12.7786 4.22567 12.8705 5.08792 13.1237C5.97123 13.383 6.69031 13.7709 7.06679 14.3046Z" fill="currentColor"></path></svg>`,
        name: 'online-help'
      },
      'Application_Managment': {
        svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2H14V15H2V2ZM3.333 3.333V13.333H12.667V3.333H3.333Z" fill="currentColor"/></svg>`,
        name: 'application_management'
      },
      'Lookups': {
        svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="4" stroke="currentColor" stroke-width="2"/><path d="M11 11l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
        name: 'lookups'
      },
      'Process_library': {
        svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="12" height="12" rx="2" fill="currentColor"/></svg>`,
        name: 'process_library'
      },
      'Process_log': {
        svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="10" height="10" rx="2" fill="currentColor"/><path d="M5 6h6M5 8h6M5 10h4" stroke="#fff" stroke-width="1.2"/></svg>`,
        name: 'process_log'
      },
      'SysSettings': {
        svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2"/><path d="M8 4v4l3 2" stroke="currentColor" stroke-width="2"/></svg>`,
        name: 'sys_settings'
      },
      'Users': {
        svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="6" r="3" stroke="currentColor" stroke-width="2"/><path d="M2 14c0-2.21 2.686-4 6-4s6 1.79 6 4" stroke="currentColor" stroke-width="2"/></svg>`,
        name: 'users'
      },
      'Configuration': {
        svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="10" height="10" rx="2" fill="currentColor"/></svg>`,
        name: 'configuration'
      },
      'TIDE': {
        svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="12" height="12" rx="2" fill="currentColor"/><path d="M5 5h6v6H5V5Z" fill="#fff"/></svg>`,
        name: 'tide'
      }
    };
    const iconData = menuIcons[scriptName] || {svg: '', name: ''};

    // Создаём контейнер пункта меню как в Actions
    const menuItem = document.createElement('div');
    menuItem.className = 'crt-menu-item-container mat-menu-item';
    menuItem.setAttribute('mat-menu-item', '');
    menuItem.setAttribute('aria-disabled', 'false');
    menuItem.setAttribute('role', 'menuitem');
    menuItem.setAttribute('tabindex', '0');

    // Кнопка
    const button = document.createElement('button');
    button.setAttribute('mat-flat-button', '');
    button.className = 'crt-menu-item mat-flat-button';
    button.setAttribute('data-item-marker', scriptName);
    button.setAttribute('aria-haspopup', 'false');
    button.setAttribute('aria-expanded', 'false');

    // mat-icon с SVG
    const matIcon = document.createElement('mat-icon');
    matIcon.setAttribute('role', 'img');
    matIcon.className = 'mat-icon notranslate mat-icon-no-color ng-star-inserted';
    matIcon.setAttribute('aria-hidden', 'true');
    matIcon.setAttribute('data-mat-icon-type', 'svg');
    if (iconData.name) matIcon.setAttribute('data-mat-icon-name', iconData.name);
    matIcon.innerHTML = iconData.svg;

    // caption
    const caption = document.createElement('span');
    caption.className = 'caption ng-star-inserted';
    caption.setAttribute('crttextoverflowtitle', '');
    caption.textContent = ' ' + scriptName.replace('_', ' ');

    // Сборка
    button.appendChild(matIcon);
    button.appendChild(caption);
    menuItem.appendChild(button);

    // Клик
    menuItem.addEventListener('click', () => {
      chrome.runtime.sendMessage({
        action: 'executeScript',
        scriptPath: `navigation/${scriptFile}`
      }, response => {
        debugLog('Navigation script sent to background for injection');
      });
      hideMenuContainer(menuContainer);
    });

    menuContainer.appendChild(menuItem);
  });

  // Create actions menu container with CSS class
  const actionsMenuContainer = document.createElement('div');
  actionsMenuContainer.classList.add('actions-menu-container');
  hideMenuContainer(actionsMenuContainer); // Initially hidden
  // Position will be set by adjustMenuPosition function

  // Function to refresh actions menu dynamically
  function refreshActionsMenu() {
    // Clear existing items
    actionsMenuContainer.innerHTML = '';
    chrome.storage.sync.get({ lastLoginProfiles: {}, userProfiles: [] }, data => {
      const origin = window.location.origin;
      const lastUser = data.lastLoginProfiles[origin];
      const profile = data.userProfiles.find(p => p.username === lastUser);
      const autologinEnabled = profile ? profile.autologin : false;
      const actionDetails = {
        'RestartApp': { file: 'RestartApp.js', icon: `<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M8 2v6l4 2\" stroke=\"currentColor\" stroke-width=\"2\"/><circle cx=\"8\" cy=\"8\" r=\"7\" stroke=\"currentColor\" stroke-width=\"2\"/></svg>`, name: 'refresh', desc: 'Reload the Creatio application', hotkey: getHotkeyString('R') },
        'FlushRedisDB': { file: 'FlushRedisDB.js', icon: `<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"3\" y=\"3\" width=\"10\" height=\"10\" rx=\"2\" fill=\"currentColor\"/><path d=\"M5 6h6M5 8h6M5 10h4" stroke="#fff" stroke-width="1.2" /></svg>`, name: 'delete', desc: 'Clear Redis database', hotkey: getHotkeyString('F') },
        'EnableAutologin': { file: null, icon: `<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"8\" cy=\"8\" r=\"7\" stroke=\"currentColor\" stroke-width=\"2\"/><path d=\"M5 8l2 2 4-4\" stroke=\"#fff\" stroke-width=\"2\"/></svg>`, name: 'check', desc: 'Enable autologin for this site' },
        'DisableAutologin': { file: null, icon: `<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"8\" cy=\"8\" r=\"7\" stroke=\"currentColor\" stroke-width=\"2\"/><path d=\"M5 5l6 6M11 5l-6 6\" stroke=\"#fff\" stroke-width=\"2\"/></svg>`, name: 'block', desc: 'Disable autologin for this site' },
        'Settings': { file: null, icon: `<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"8\" cy=\"8\" r=\"7\" stroke=\"currentColor\" stroke-width=\"2\"/><path d=\"M8 4v4l3 2\" stroke=\"currentColor\" stroke-width=\"2"/></svg>`, name: 'settings', desc: 'Open plugin settings', hotkey: getHotkeyString('S') }
      };
      const actionsList = ['RestartApp', 'FlushRedisDB'];
      if (lastUser) actionsList.push(autologinEnabled ? 'DisableAutologin' : 'EnableAutologin');
      actionsList.push('Settings');
      actionsList.forEach(scriptName => {
        const detail = actionDetails[scriptName];
        // Create menu item container
        const menuItem = document.createElement('div');
        menuItem.className = 'crt-menu-item-container mat-menu-item';
        menuItem.setAttribute('mat-menu-item', '');
        menuItem.setAttribute('aria-disabled', 'false');
        menuItem.setAttribute('role', 'menuitem');
        menuItem.setAttribute('tabindex', '0');
        // Create button as in Creatio
        const menuButtonEl = document.createElement('button');
        menuButtonEl.className = 'crt-menu-item mat-flat-button';
        menuButtonEl.setAttribute('mat-flat-button', '');
        menuButtonEl.setAttribute('data-item-marker', scriptName);
        // Create mat-icon (svg inline)
        const iconWrap = document.createElement('mat-icon');
        iconWrap.setAttribute('role', 'img');
        iconWrap.className = 'mat-icon notranslate mat-icon-no-color';
        iconWrap.setAttribute('aria-hidden', 'true');
        iconWrap.setAttribute('data-mat-icon-type', 'svg');
        iconWrap.setAttribute('data-mat-icon-name', detail.name || 'help');
        iconWrap.innerHTML = detail.icon || '';
        // Create caption
        const caption = document.createElement('span');
        caption.className = 'caption';
        caption.setAttribute('crttextoverflowtitle', '');
        caption.textContent = ' ' + scriptName.replace('Autologin',' autologin').replace(/([A-Z])/g,' $1').trim();
        // Assemble button
        menuButtonEl.appendChild(iconWrap);
        menuButtonEl.appendChild(caption);
        menuItem.appendChild(menuButtonEl);
        menuItem.addEventListener('click', () => {
          if (scriptName==='Settings') {
            chrome.runtime.sendMessage({action:'openOptionsPage'});
          } else if (scriptName==='EnableAutologin') {
            chrome.storage.sync.get({userProfiles:[],lastLoginProfiles:{}}, ds=>{
              const profs=ds.userProfiles.map(p=>p.username===lastUser?{...p,autologin:true}:p);
              chrome.storage.sync.set({userProfiles:profs});
            });
          } else if (scriptName==='DisableAutologin') {
            chrome.runtime.sendMessage({action:'disableAutologin'});
          } else {
            chrome.runtime.sendMessage({action:'executeScript',scriptPath:'actions/'+detail.file});
          }
          hideMenuContainer(actionsMenuContainer);
        });
        actionsMenuContainer.appendChild(menuItem);
      });
    });
  }

  // Make refreshActionsMenu available globally for hotkey functions
  window.refreshActionsMenu = refreshActionsMenu;

  actionsButton.addEventListener('click', (target) => {
    hideMenuContainer(menuContainer);
    refreshActionsMenu();
    showMenuContainer(actionsMenuContainer);
    // Корректное позиционирование для всех страниц
    adjustMenuPosition(actionsButton, actionsMenuContainer);
  });

  menuButton.addEventListener('click', (target) => {
    showMenuContainer(menuContainer);
    hideMenuContainer(actionsMenuContainer);
    // Корректное позиционирование для всех страниц
    adjustMenuPosition(menuButton, menuContainer);
  });

  document.addEventListener('click', (event) => {
    if (!menuButton.contains(event.target) && !menuContainer.contains(event.target)) {
      hideMenuContainer(menuContainer);
    }
    if (!actionsButton.contains(event.target) && !actionsMenuContainer.contains(event.target)) {
      hideMenuContainer(actionsMenuContainer);
    }
  });

  try {
    if (pageType === 'configuration') {
      // For Configuration page, create a floating container for buttons
      if (targetContainer) {
        // Получаем отступы для позиционирования
        const filters = document.querySelector('.workspace-items-filters');
        const leftContainer = document.querySelector('.left-container');
        let leftOffset = 20;
        let topOffset = 20;
        if (filters) {
          const filtersRect = filters.getBoundingClientRect();
          leftOffset = filtersRect.left;
        }
        if (leftContainer) {
          const leftRect = leftContainer.getBoundingClientRect();
          topOffset = leftRect.top;
        }
        // Create a floating button container that doesn't affect layout
        const floatingContainer = document.createElement('div');
        floatingContainer.className = 'creatio-satelite-floating';
        floatingContainer.style.cssText = `
          position: fixed;
          top: ${topOffset}px;
          left: ${leftOffset}px;
          z-index: 1000;
          display: flex;
          flex-direction: row;
          gap: 8px;
          cursor: move;
          user-select: none;
          width: auto;
          height: auto;
        `;
        
        // Add drag functionality
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        // Add drag functionality
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
          }
        });
        
        document.addEventListener('mousemove', (e) => {
          if (isDragging) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            const newX = Math.max(0, Math.min(window.innerWidth - floatingContainer.offsetWidth, initialX + deltaX));
            const newY = Math.max(0, Math.min(window.innerHeight - floatingContainer.offsetHeight, initialY + deltaY));
            
            floatingContainer.style.left = newX + 'px';
            floatingContainer.style.top = newY + 'px';
            floatingContainer.style.right = 'auto';
          }
        });
        
        document.addEventListener('mouseup', () => {
          if (isDragging) {
            isDragging = false;
            floatingContainer.style.cursor = 'move';
          }
        });
        
        floatingContainer.appendChild(buttonWrapper);
        document.body.appendChild(floatingContainer);
        
        // Add special class for configuration page styling
        buttonWrapper.classList.add('creatio-satelite-configuration');
        // Удаляем возможный конфликтующий стиль flex-direction
        buttonWrapper.style.flexDirection = 'row';
        debugLog('Buttons placed in draggable floating container for Configuration page');
      }
    } else if (pageType === 'shell') {
      // For Shell page, use existing logic
      const searchElement = document.querySelector('[data-item-marker="AppToolbarGlobalSearch"]');

      if (searchElement && searchElement.parentElement) {
        searchElement.insertAdjacentElement('afterend', buttonWrapper);
        
        // Apply creatio-satelite-button-next-to-search class
        buttonWrapper.classList.add('creatio-satelite-button-next-to-search');
        
        debugLog('Button placed next to search element on initial creation');
      } else {
        const appToolbar = document.querySelector('crt-app-toolbar');

        if (appToolbar) {
          appToolbar.appendChild(buttonWrapper);
          debugLog('Button inserted into crt-app-toolbar');

          // Create center container with CSS class
          const centerContainer = document.createElement('div');
          centerContainer.className = 'center-container';

          buttonWrapper.remove();
          centerContainer.appendChild(buttonWrapper);
          appToolbar.appendChild(centerContainer);
          
          // Apply button-in-toolbar class
          buttonWrapper.className += ' button-in-toolbar';
        } else {
          document.body.appendChild(buttonWrapper);
          debugLog('crt-app-toolbar not found, button added to body');
        }
      }
    }

    const rootMenuContainer = document.createElement('div');
    rootMenuContainer.classList.add('creatio-satelite-menu-container');
    rootMenuContainer.appendChild(menuContainer);
    rootMenuContainer.appendChild(actionsMenuContainer);
    document.body.appendChild(rootMenuContainer);
    debugLog('Scripts menu created successfully');
    menuCreated = true;
    actionsMenuCreated = true;
    return true;
  } catch (error) {
    console.error('Error appending menu elements:', error);
    menuCreated = false;
    actionsMenuCreated = false;
    return false;
  }
}

// Function to place button next to search element if it exists
function placeButtonNextToSearch() {
  const buttonWrapper = document.querySelector('.creatio-satelite');
  const searchElement = document.querySelector('[data-item-marker="AppToolbarGlobalSearch"]');

  if (!buttonWrapper || !searchElement || !searchElement.parentElement) {
    return false;
  }

  // If button is already next to search, don't do anything
  if (buttonWrapper.nextElementSibling === searchElement ||
      buttonWrapper.previousElementSibling === searchElement) {
    return true;
  }

  try {
    // Place button next to search element
    searchElement.insertAdjacentElement('afterend', buttonWrapper);
    
    // Apply creatio-satelite-button-next-to-search class
    buttonWrapper.classList.add('creatio-satelite-button-next-to-search');
    
    debugLog('Button placed next to search element dynamically');
    return true;
  } catch (error) {
    console.error('Error placing button next to search:', error);
    return false;
  }
}

// Функция, которая ищет элемент поиска и обновляет позицию кнопки скриптов
function updateMenuPosition() {
  const buttonWrapper = document.querySelector('.creatio-satelite');
  const menuContainer = document.querySelector('.creatio-satelite-menu-container .scripts-menu-container');
  const actionsMenuContainer = document.querySelector('.creatio-satelite-menu-container .actions-menu-container');

  if (!buttonWrapper || !menuContainer) return;

  const isInToolbar = !!buttonWrapper.closest('crt-app-toolbar');

  if (isInToolbar) {
    const buttonRect = buttonWrapper.getBoundingClientRect();
    menuContainer.style.top = (buttonRect.bottom + 5) + 'px';
    
    if (actionsMenuContainer) {
      actionsMenuContainer.style.top = (buttonRect.bottom + 5) + 'px';
    }
    return;
  }

  const searchElement = document.querySelector('[data-item-marker="AppToolbarGlobalSearch"]') ||
                       document.querySelector('[class*="AppToolbarGlobalSearch"]') ||
                       document.querySelector('.global-search');

  if (searchElement) {
    const searchRect = searchElement.getBoundingClientRect();
    menuContainer.style.top = (searchRect.top + 40) + 'px';

    if (actionsMenuContainer) {
      actionsMenuContainer.style.top = (searchRect.top + 40) + 'px';
    }

    debugLog(`Updated menu position to match search element: ${searchRect.top}px`);
  }
}

// Функция для перемещения кнопки в toolbar, если он появился
function moveButtonToToolbar() {
  const menuButton = document.querySelector('.scripts-menu-button');
  const menuContainer = document.querySelector('.creatio-satelite-menu-container .scripts-menu-container');
  const actionsMenuContainer = document.querySelector('.creatio-satelite-menu-container .actions-menu-container');
  const buttonWrapper = document.querySelector('div:has(.scripts-menu-button)');

  if (!menuButton || !buttonWrapper) return false;

  const isInToolbar = !!menuButton.closest('crt-app-toolbar');
  if (isInToolbar) return true;

  const appToolbar = document.querySelector('crt-app-toolbar');
  if (!appToolbar) return false;

  // Create center container with CSS class
  const centerContainer = document.createElement('div');
  centerContainer.className = 'center-container';

  buttonWrapper.remove();
  centerContainer.appendChild(buttonWrapper);
  appToolbar.appendChild(centerContainer);
  
  // Apply button-in-toolbar class
  buttonWrapper.className += 'button-in-toolbar';

  if (menuContainer) {
    const buttonRect = menuButton.getBoundingClientRect();
    menuContainer.style.top = (buttonRect.bottom + 5) + 'px';
  }

  if (actionsMenuContainer) {
    const buttonRect = menuButton.getBoundingClientRect();
    actionsMenuContainer.style.top = (buttonRect.bottom + 5) + 'px';
  }

  debugLog('Button moved to crt-app-toolbar and centered');
  return true;
}

// Наблюдаем за изменениями в DOM и обновляем позицию меню
const positionObserver = new MutationObserver(() => {
  if (placeButtonNextToSearch()) {
    return;
  }

  updateMenuPosition();
  moveButtonToToolbar();
});

// Function to check page and create menu if needed
function checkCreatioPageAndCreateMenu() {
  debugLog("Checking for Creatio page");
  const pageType = getCreatioPageType();
  
  // Block menu creation on login pages
  if (pageType === 'login') {
    debugLog('Login page detected - Navigation/Actions menu creation blocked');
    return false;
  }
  
  if (pageType && !menuCreated) {
    debugLog(`${pageType} page detected, creating scripts menu`);
    const success = createScriptsMenu();
    if (success) {
      debugLog(`Menu created successfully for ${pageType} page`);
      return true;
    } else {
      debugLog(`Failed to create menu for ${pageType} page`);
      return false;
    }
  } else if (pageType) {
    debugLog(`${pageType} page detected but menu already created`);
  } else {
    debugLog('No Creatio page detected');
  }
  return false;
}

// Legacy function for backward compatibility
function checkShellAndCreateMenu() {
  checkCreatioPageAndCreateMenu();
}

// Initial check with slight delay to let page load
setTimeout(checkCreatioPageAndCreateMenu, 1000);

// Check again when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  debugLog('DOMContentLoaded fired, checking for Creatio page');
  checkCreatioPageAndCreateMenu();
});

// Check again when window is fully loaded
window.addEventListener('load', () => {
  debugLog('Window load event fired, checking for Creatio page');
  checkCreatioPageAndCreateMenu();

  setTimeout(updateMenuPosition, 2000);
});

// Наблюдаем за изменениями в DOM и обновляем позицию меню
setTimeout(() => {
  positionObserver.observe(document.body, { childList: true, subtree: true });
}, 3000);

// Periodic check in case the page loads Creatio content dynamically
let checkCount = 0;
const maxChecks = 20;
const checkInterval = setInterval(() => {
  checkCount++;
  debugLog(`Check interval ${checkCount}/${maxChecks} fired`);

  const success = checkCreatioPageAndCreateMenu();
  if (success || checkCount >= maxChecks) {
    debugLog('Clearing check interval');
    clearInterval(checkInterval);
  }
}, 1000);

// Also observe DOM changes to detect Creatio page loading
const observer = new MutationObserver(mutations => {
  let shouldCheck = false;
  let hasLeftContainer = false;

  for (const mutation of mutations) {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      // Check for significant changes
      if (mutation.addedNodes.length > 2) {
        shouldCheck = true;
      }
      
      // Check specifically for .left-container on Configuration pages
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) { // Element node
          if (node.classList && node.classList.contains('left-container')) {
            hasLeftContainer = true;
            shouldCheck = true;
            debugLog('Left container detected in DOM changes');
          }
          // Also check child elements
          if (node.querySelector && node.querySelector('.left-container')) {
            hasLeftContainer = true;
            shouldCheck = true;
            debugLog('Left container found in added node children');
          }
        }
      }
    }
  }

  if (shouldCheck && !menuCreated) {
    debugLog('Significant DOM changes detected, checking for Creatio page');
    if (hasLeftContainer) {
      debugLog('Left container available, priority check for Configuration page');
    }
    checkCreatioPageAndCreateMenu();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

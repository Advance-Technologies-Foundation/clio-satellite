// Global flag to track if menu is already created
let menuCreated = false;
let actionsMenuCreated = false; // New flag to track Actions menu creation

const debugExtension = true;

function executeQuickAction(actionName) {
  const pageType = getCreatioPageType();
  if (pageType !== 'shell' && pageType !== 'configuration') {
    debugLog(`Quick action blocked: page type is ${pageType}`);
    return;
  }

  if (actionName === 'Settings') {
    chrome.runtime.sendMessage({action: 'openOptionsPage'});
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
  }
}

function executeNavigationScript(scriptName) {
  const pageType = getCreatioPageType();
  if (pageType !== 'shell' && pageType !== 'configuration') {
    debugLog(`Navigation script blocked: page type is ${pageType}`);
    return;
  }

  chrome.runtime.sendMessage({
    action: 'executeScript',
    scriptPath: `navigation/${scriptName}.js`
  });
}

function toggleNavigationMenu() {
  const pageType = getCreatioPageType();
  if (pageType !== 'shell' && pageType !== 'configuration') {
    debugLog(`Navigation menu toggle blocked: page type is ${pageType}`);
    return;
  }

  const menuContainer = document.querySelector('.scripts-menu-container');
  const actionsContainer = document.querySelector('.actions-menu-container');
  const menuButton = document.querySelector('.scripts-menu-button');

  if (menuContainer && menuButton) {
    hideMenuContainer(actionsContainer);
    if (menuContainer.classList.contains('visible')) {
      hideMenuContainer(menuContainer);
    } else {
      showMenuContainer(menuContainer);
      adjustMenuPosition(menuButton, menuContainer);
    }
  }
}

function toggleActionsMenu() {
  const pageType = getCreatioPageType();
  if (pageType !== 'shell' && pageType !== 'configuration') {
    debugLog(`Actions menu toggle blocked: page type is ${pageType}`);
    return;
  }

  const menuContainer = document.querySelector('.scripts-menu-container');
  const actionsContainer = document.querySelector('.actions-menu-container');
  const actionsButton = document.querySelector('.actions-button');

  if (actionsContainer && actionsButton) {
    hideMenuContainer(menuContainer);
    if (actionsContainer.classList.contains('visible')) {
      hideMenuContainer(actionsContainer);
    } else {
      if (window.refreshActionsMenu) {
        window.refreshActionsMenu();
      }
      showMenuContainer(actionsContainer);
      adjustMenuPosition(actionsButton, actionsContainer);
    }
  }
}

function debugLog(message) {
  if (debugExtension) {
    console.log('[Clio Satellite]:', message);
  }
}

function hideMenuContainer(menuContainer) {
  if (menuContainer) {
    menuContainer.classList.remove('visible');
    menuContainer.classList.add('hidden');
  }
}

function showMenuContainer(menuContainer) {
  if (menuContainer) {
    menuContainer.classList.remove('hidden');
    menuContainer.classList.add('visible');
  }
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

  // Enhanced Shell page detection with URL patterns
  const shellUrlPatterns = [
    '/shell/',
    '/clientapp/',
    '#section',
    '#shell',
    'workspaceexplorer',
    'listpage',
    'cardpage',
    'dashboardmodule'
  ];

  const urlMatchesShell = shellUrlPatterns.some(pattern =>
    currentUrl.includes(pattern.toLowerCase())
  );

  // Check for Shell page indicators (DOM elements)
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
    document.querySelector('link[href*="terrasoft"]'),
    // Additional Shell-specific selectors
    document.querySelector('crt-root'),
    document.querySelector('[class*="shell"]'),
    document.querySelector('[id*="shell"]'),
    document.querySelector('crt-page'),
    document.querySelector('crt-reusable-schema')
  ];

  const foundIndicators = shellIndicators.filter(indicator => indicator);

  // Relaxed detection: URL pattern OR sufficient DOM indicators
  const MIN_INDICATORS = urlMatchesShell ? 1 : 2; // Lower threshold if URL matches

  // Detailed debugging for Shell page detection
  debugLog(`Shell page detection: found ${foundIndicators.length}/${MIN_INDICATORS} indicators, URL matches: ${urlMatchesShell}`);
  if (debugExtension) {
    const indicatorNames = [
      'ShellContainerWithBackground',
      'mainshell',
      'crt-schema-outlet',
      'AppToolbarGlobalSearch',
      'crt-app-toolbar',
      'creatio-logo',
      'Terrasoft ID',
      'Terrasoft class',
      'creatio script',
      'terrasoft script',
      'creatio link',
      'terrasoft link',
      'crt-root',
      'shell class',
      'shell ID',
      'crt-page',
      'crt-reusable-schema'
    ];
    shellIndicators.forEach((indicator, index) => {
      if (indicator) {
        debugLog(`✓ Found: ${indicatorNames[index]}`);
      }
    });

    if (urlMatchesShell) {
      debugLog(`✓ URL pattern matches Shell page`);
    }
  }

  if (foundIndicators.length >= MIN_INDICATORS || urlMatchesShell) {
    debugLog(`Shell page detected with ${foundIndicators.length} indicators and URL match: ${urlMatchesShell}`);
    return 'shell';
  }

  debugLog(`Not enough Creatio indicators found (${foundIndicators.length}/${MIN_INDICATORS}). URL match: ${urlMatchesShell}. Page not recognized.`);
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
  container.style.zIndex = '9999';

  // Если кнопка внутри floatingContainer (конфигурация), позиционируем относительно экрана
  const floating = relatedContainer.closest('.creatio-satelite-floating');
  if (floating) {
    // Получаем позицию кнопки относительно экрана
    const btnRect = relatedContainer.getBoundingClientRect();

    // Меню добавляем в body, а не в floating контейнер (сначала для получения размеров)
    if (container.parentNode !== document.body) {
      document.body.appendChild(container);
    }

    // Позиционируем меню с начальными значениями
    container.style.position = 'fixed';
    container.style.zIndex = '9999';
    container.style.visibility = 'hidden'; // скрываем для расчета размеров
    container.style.top = (btnRect.bottom + 4) + 'px';
    container.style.left = btnRect.left + 'px';
    container.style.minWidth = btnRect.width + 'px'; // Минимальная ширина меню = ширине кнопки

    // Принудительно запускаем reflow для получения актуальных размеров
    container.offsetHeight;

    // Получаем размеры меню после применения стилей
    const menuRect = container.getBoundingClientRect();

    // Корректируем позицию если меню выходит за границы экрана
    let newLeft = btnRect.left;
    let newTop = btnRect.bottom + 4;

    if (menuRect.right > window.innerWidth) {
      newLeft = btnRect.right - menuRect.width;
      // Убеждаемся, что не выходим за левую границу
      if (newLeft < 0) {
        newLeft = 0;
      }
    }

    if (menuRect.bottom > window.innerHeight) {
      newTop = btnRect.top - menuRect.height - 4;
    }

    // Применяем финальные координаты
    container.style.top = newTop + 'px';
    container.style.left = newLeft + 'px';
    container.style.visibility = 'visible'; // показываем меню

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

  // Block menu creation on login pages or unrecognized pages
  if (!pageType || pageType === 'login') {
    debugLog(`Page type is ${pageType || 'unrecognized'}, skipping menu creation`);
    return false;
  }

  // Only allow menu creation on shell and configuration pages
  if (pageType !== 'shell' && pageType !== 'configuration') {
    debugLog(`Page type ${pageType} not supported for menu creation`);
    return false;
  }

  debugLog(`Creating menu for page type: ${pageType}`);

  let targetContainer = null;

  if (pageType === 'configuration') {
    // For Configuration page, find the left-container
    targetContainer = document.querySelector('.left-container');
    if (!targetContainer) {
      debugLog('Configuration page detected but .left-container not found, retrying later...');
      return false;
    }
    debugLog('Configuration page: targeting .left-container');
  }

  // Create button wrapper with CSS class
  const buttonWrapper = document.createElement('div');
  buttonWrapper.className = 'creatio-satelite';

  // Create menu button with exact structure as Configuration buttons
  const menuButton = document.createElement('button');
  menuButton.setAttribute('mat-flat-button', '');
  menuButton.setAttribute('color', 'primary');
  menuButton.className = 'mat-focus-indicator scripts-menu-button mat-flat-button mat-button-base mat-primary';
  menuButton.title = 'Clio satellite';
  menuButton.setAttribute('aria-haspopup', 'menu');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.style.setProperty('padding-right', '8px', 'important'); // Add padding-right: 8px !important style

  // Create button wrapper span
  const menuButtonWrapper = document.createElement('span');
  menuButtonWrapper.className = 'mat-button-wrapper';

  // Create button caption div with icon
  const menuButtonCaption = document.createElement('div');
  menuButtonCaption.className = 'compile-button-caption';

  // Create rocket icon (VS Code style)
  const navIcon = document.createElement('span');
  navIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
    <path d="M8.109 1.023c.133-.133.35-.133.482 0l6.276 6.276c.133.133.133.35 0 .482l-6.276 6.276c-.133.133-.35.133-.482 0L1.833 7.781c-.133-.133-.133-.35 0-.482L8.109 1.023z" fill="currentColor"/>
    <path d="M10.5 6.5L9 5l-1 1 1.5 1.5L10.5 6.5z" fill="white"/>
    <path d="M13.5 3.5L12 2l-1 1 1.5 1.5L13.5 3.5z" fill="white"/>
    <path d="M4.5 12.5L3 11l-1 1 1.5 1.5L4.5 12.5z" fill="white"/>
    <path d="M2 13l1-1 1 1-1 1-1-1z" fill="white"/>
  </svg>`;

  menuButtonCaption.appendChild(navIcon);
  menuButtonCaption.appendChild(document.createTextNode('Clio satellite'));
  // Create arrow wrapper (dropdown indicator)
  const menuArrowWrapper = document.createElement('div');
  menuArrowWrapper.className = 'mat-select-arrow-wrapper';
  menuArrowWrapper.style.cssText = 'margin-left: 4px; padding-right: 2px;'; // Уменьшен отступ справа в два раза
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
  actionsButton.setAttribute('aria-haspopup', 'menu');
  actionsButton.setAttribute('aria-expanded', 'false');
  actionsButton.style.setProperty('padding-right', '8px', 'important'); // Add padding-right: 8px !important style

  // Create button wrapper span
  const actionsButtonWrapper = document.createElement('span');
  actionsButtonWrapper.className = 'mat-button-wrapper';

  // Create button caption div
  const actionsButtonCaption = document.createElement('div');
  actionsButtonCaption.className = 'compile-button-caption';

  // Create actions icon (lightning bolt - system actions)
  const actionsIcon = document.createElement('span');
  actionsIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.5 1L2 7h4l-1 8L11 9H7l1.5-8z" fill="currentColor"/>
  </svg>`;

  actionsButtonCaption.appendChild(actionsIcon);
  // Create arrow wrapper (dropdown indicator)
  const actionsArrowWrapper = document.createElement('div');
  actionsArrowWrapper.className = 'mat-select-arrow-wrapper';
  actionsArrowWrapper.style.cssText = 'margin-left: 4px; padding-right: 2px;'; // Уменьшен отступ справа в два раза
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
    'Features': 'Open system features management page',
    'Application_Managment': 'Application managment - App Hub',
    'Lookups': 'Open system lookups',
    'Process_library': 'Open process library',
    'Process_log': 'View process log',
    'SysSettings': 'System settings and parameters',
    'Users': 'Manage system users',
    'Configuration': 'Open system configuration',
    'TIDE': 'Open TIDE tools',
    'Settings': 'Open plugin settings'
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
    'TIDE.js',
    'Settings'
  ];

  scriptFiles.forEach(scriptFile => {
    const scriptName = scriptFile.replace('.js', '');
    // Handle Settings as a special case since it doesn't have a .js file
    const isSettingsItem = scriptName === 'Settings';
    const menuIcons = {
      'Features': {
        svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.6477 3.7921C10.0849 3.98314 9.4883 4.26947 8.94174 4.69091C8.89082 4.73017 8.85784 4.78936 8.85784 4.85366V14.2763C8.85784 14.3201 8.90952 14.3396 8.93467 14.3038C9.31132 13.7685 10.03 13.3802 10.9124 13.1213C11.774 12.8685 12.6597 12.7776 13.1956 12.7466C13.6472 12.7204 14 12.3491 14 11.8998V4.25019C14 3.79737 13.6424 3.42414 13.187 3.40169L13.1839 3.40154L13.1785 3.40131L13.1631 3.40071C13.1509 3.40028 13.1346 3.39979 13.1146 3.39938C13.0747 3.39856 13.0196 3.39803 12.9514 3.39884C12.815 3.40044 12.6247 3.40734 12.3953 3.428C11.9394 3.46907 11.3143 3.56581 10.6477 3.7921Z" fill="currentColor"></path><path d="M7.06679 14.3046C7.09196 14.3403 7.14355 14.3208 7.14355 14.2771V4.85559C7.14355 4.79051 7.11013 4.73061 7.05859 4.69087C6.51205 4.26945 5.91539 3.98312 5.35259 3.7921C4.6859 3.5658 4.06074 3.46906 3.60478 3.428C3.37541 3.40734 3.18503 3.40044 3.04866 3.39884C2.98038 3.39803 2.92533 3.39856 2.88537 3.39938C2.86539 3.39979 2.84915 3.40028 2.83688 3.40071L2.82148 3.40131L2.81607 3.40154L2.81394 3.40164L2.8122 3.40173C2.35727 3.42415 2 3.79701 2 4.24937V11.8999C2 12.3484 2.35168 12.7194 2.80252 12.7464C3.3393 12.7786 4.22567 12.8705 5.08792 13.1237C5.97123 13.383 6.69031 13.7709 7.06679 14.3046Z" fill="currentColor"></path></svg>`,
        name: 'online-help'
      },
      'Application_Managment': {
        svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2H14V15H2V2ZM3.333 3.333V13.333H12.667V3.333H3.333Z" fill="currentColor"/>`,
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
      },
      'Settings': {
        svg: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M12.7 6.4a1 1 0 0 0 .3-1.4l-.8-1.4a1 1 0 0 0-1.4-.3l-.5.3a6 6 0 0 0-1.6-.9V2a1 1 0 0 0-1-1H6.3a1 1 0 0 0-1 1v.7a6 6 0 0 0-1.6.9l-.5-.3a1 1 0 0 0-1.4.3l-.8 1.4a1 1 0 0 0 .3 1.4l.5.3v1.6l-.5.3a1 1 0 0 0-.3 1.4l.8 1.4a1 1 0 0 0 1.4.3l.5-.3a6 6 0 0 0 1.6.9V14a1 1 0 0 0 1 1h1.4a1 1 0 0 0 1-1v-.7a6 6 0 0 0 1.6-.9l.5.3a1 1 0 0 0 1.4-.3l.8-1.4a1 1 0 0 0-.3-1.4l-.5-.3V8l.5-.3z" stroke="currentColor" stroke-width="1" fill="none"/></svg>`,
        name: 'settings'
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
    caption.className = 'caption';
    caption.setAttribute('crttextoverflowtitle', '');

    // Simple display name without underlines
    let displayName = ' ' + scriptName.replace(/_/g, ' ');
    caption.textContent = displayName;

    // Сборка
    button.appendChild(matIcon);
    button.appendChild(caption);
    menuItem.appendChild(button);

    // Add divider before Settings item
    if (scriptName === 'Settings') {
      const dividerContainer = document.createElement('div');
      dividerContainer.className = 'ng-star-inserted';
      dividerContainer.setAttribute('crt-menu-view-element-item', 'settings-divider');
      dividerContainer.style.cssText = 'display: block; margin: 8px 0; opacity: 1; visibility: visible;';

      const crtMenuDivider = document.createElement('crt-menu-divider');
      crtMenuDivider.className = 'ng-star-inserted';
      crtMenuDivider.style.cssText = 'display: block; margin: 8px 0;';

      const matDivider = document.createElement('mat-divider');
      matDivider.setAttribute('role', 'separator');
      matDivider.className = 'mat-divider mat-divider-horizontal';
      matDivider.setAttribute('aria-orientation', 'horizontal');
      matDivider.style.cssText = 'display: block !important; height: 1px !important; background-color: #e0e0e0 !important; border: none !important; margin: 0 16px !important; opacity: 1 !important; visibility: visible !important;';

      crtMenuDivider.appendChild(matDivider);
      dividerContainer.appendChild(crtMenuDivider);

      menuContainer.appendChild(dividerContainer);
    }

    // Клик
    menuItem.addEventListener('click', () => {
      if (scriptName === 'Settings') {
        chrome.runtime.sendMessage({action: 'openOptionsPage'});
      } else {
        chrome.runtime.sendMessage({
          action: 'executeScript',
          scriptPath: `navigation/${scriptFile}`
        }, response => {
          debugLog('Navigation script sent to background for injection');
        });
      }
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
        'RestartApp': { file: 'RestartApp.js', icon: `<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M8 2v6l4 2\" stroke=\"currentColor\" stroke-width=\"2\"/><circle cx=\"8\" cy=\"8\" r=\"7\" stroke=\"currentColor\" stroke-width=\"2\"/></svg>`, name: 'refresh', desc: 'Reload the Creatio application' },
        'FlushRedisDB': { file: 'FlushRedisDB.js', icon: `<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"3\" y=\"3\" width=\"10\" height=\"10\" rx=\"2\" fill=\"currentColor\"/><path d=\"M5 6h6M5 8h6M5 10h4" stroke="#fff" stroke-width="1.2" /></svg>`, name: 'delete', desc: 'Clear Redis database' },
        'EnableAutologin': { file: null, icon: `<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"8\" cy=\"8\" r=\"7\" stroke=\"currentColor\" stroke-width=\"2\"/><path d=\"M5 8l2 2 4-4\" stroke=\"#fff\" stroke-width=\"2\"/></svg>`, name: 'check', desc: 'Enable autologin for this site' },
        'DisableAutologin': { file: null, icon: `<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2"/><path d="M5 5l6 6M11 5l-6 6" stroke="#fff" stroke-width="2" /></svg>`, name: 'block', desc: 'Disable autologin for this site' },
        'Settings': { file: null, icon: `<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2"/><path d="M8 4v4l3 2" stroke="currentColor" stroke-width="2"/></svg>`, name: 'settings', desc: 'Open plugin settings' }
      };
      const actionsList = ['RestartApp', 'FlushRedisDB'];
      if (lastUser) actionsList.push(autologinEnabled ? 'DisableAutologin' : 'EnableAutologin');
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

        // Simple display name without underlines
		  let displayName = scriptName
			  .replace('Autologin', ' autologin')
			  .replace(/([a-z])([A-Z])/g, '$1 $2')  // Space between lower-to-upper transitions
			  .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')  // Space in acronyms like RedisDB
			  .trim();
        caption.textContent = displayName;
        // Assemble button
        menuButtonEl.appendChild(iconWrap);
        menuButtonEl.appendChild(caption);
        menuItem.appendChild(menuButtonEl);
        menuItem.addEventListener('click', () => {
          if (scriptName==='EnableAutologin') {
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

  // Make refreshActionsMenu available globally for menu functions
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

  // Additional click handler specifically for configuration page menus
  document.addEventListener('click', (event) => {
    const visibleMenu = document.querySelector('.scripts-menu-container.visible, .actions-menu-container.visible');
    if (visibleMenu) {
      const relatedButton = document.querySelector('.scripts-menu-button, .actions-button');
      if (relatedButton && !relatedButton.contains(event.target) && !visibleMenu.contains(event.target)) {
        visibleMenu.classList.remove('visible');
        visibleMenu.style.display = 'none';
      }
    }
  }, true); // Use capturing phase to ensure it runs first

  try {
    if (pageType === 'configuration') {
      // For Configuration page, create a floating container for buttons
      if (targetContainer) {
        debugLog('Creating floating container for configuration page');
        setupConfigurationFloatingContainer(buttonWrapper);
      }
    } else if (pageType === 'shell') {
      // For Shell page, create floating container with proper positioning
      debugLog('Creating floating container for shell page');
      setupShellFloatingContainer(buttonWrapper);
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

// Function to position floating container relative to crt-global-search element or action-button
function positionFloatingContainerRelativeToSearch() {
  const floatingContainer = document.querySelector('.creatio-satelite-floating');

  if (!floatingContainer) {
    debugLog('Cannot position floating container - floating container not found');
    return false;
  }

  // Don't auto-reposition if user has manually positioned the container
  if (floatingContainer.hasAttribute('data-user-positioned')) {
    debugLog('Container was manually positioned by user, skipping auto-positioning');
    return true;
  }

  // For shell pages, try multiple selectors for search element
  let searchElement = document.querySelector('crt-global-search');
  if (!searchElement) {
    // Try alternative selectors in case the search element has different structure
    searchElement = document.querySelector('[data-item-marker="GlobalSearch"]');
  }
  if (!searchElement) {
    searchElement = document.querySelector('.global-search');
  }
  if (!searchElement) {
    searchElement = document.querySelector('input[placeholder*="Search"], input[placeholder*="search"]');
  }

  // For configuration pages, position relative to action-button with mat-button attribute
  const actionButton = document.querySelector('button[mat-button].action-button');

  const targetElement = searchElement || actionButton;

  // If no target element found, use fallback positioning (center horizontally, 16px from top)
  if (!targetElement) {
    debugLog('No anchor elements found, using fallback positioning');
    const containerRect = floatingContainer.getBoundingClientRect();
    const centerX = (window.innerWidth - containerRect.width) / 2;
    const fallbackTop = 16;

    floatingContainer.style.left = centerX + 'px';
    floatingContainer.style.top = fallbackTop + 'px';
    floatingContainer.style.right = 'auto';
    floatingContainer.setAttribute('data-fallback-position', 'true');

    debugLog(`Fallback positioning applied: center horizontally (${centerX}px), 16px from top`);
    return true;
  }

  // Remove fallback attribute if positioning relative to target element
  floatingContainer.removeAttribute('data-fallback-position');

  // Get the position and dimensions of the target element
  const targetRect = targetElement.getBoundingClientRect();
  const containerRect = floatingContainer.getBoundingClientRect();

  // Check if target element has proper dimensions (not collapsed)
  if (targetRect.width < 20 || targetRect.height < 10) {
    debugLog(`Target element dimensions too small: ${targetRect.width}x${targetRect.height}, skipping positioning`);
    return false;
  }

  // Check if target element is visible (not hidden)
  const computedStyle = window.getComputedStyle(targetElement);
  if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0') {
    debugLog('Target element is not visible, skipping positioning');
    return false;
  }

  // Check if target element is actually in the viewport
  if (targetRect.top < 0 || targetRect.left < 0 || targetRect.bottom > window.innerHeight || targetRect.right > window.innerWidth) {
    debugLog('Target element is outside viewport, skipping positioning');
    return false;
  }

  // Calculate position: right of target element, centered vertically
  const leftPosition = targetRect.right + 20; // 20px gap after target element
  const topPosition = targetRect.top + (targetRect.height - containerRect.height) / 2;

  // Ensure the container stays within viewport bounds
  const finalLeft = Math.min(window.innerWidth - containerRect.width - 10, leftPosition);
  const finalTop = Math.max(10, Math.min(window.innerHeight - containerRect.height - 10, topPosition));

  // Apply the positioning
  floatingContainer.style.left = finalLeft + 'px';
  floatingContainer.style.top = finalTop + 'px';
  floatingContainer.style.right = 'auto';

  const elementType = searchElement ? 'search' : 'action-button';
  debugLog(`Positioned floating container relative to ${elementType} element: left=${finalLeft}, top=${finalTop}, targetWidth=${targetRect.width}`);
  return true;
}

// Function to setup floating container for shell page with proper positioning
function setupShellFloatingContainer(buttonWrapper) {
  // Create a floating button container for shell page
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
  `;

  // Add drag functionality
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
      // Mark as manually positioned to prevent auto-repositioning
      floatingContainer.setAttribute('data-user-positioned', 'true');
      debugLog('Shell container manually positioned by user');
    }
  });

  floatingContainer.appendChild(buttonWrapper);
  document.body.appendChild(floatingContainer);

  // Add special class for shell page styling
  buttonWrapper.classList.add('creatio-satelite-shell');
  buttonWrapper.style.flexDirection = 'row';

  // Add double-click to reset positioning for shell container
  floatingContainer.addEventListener('dblclick', (e) => {
    if (e.target === floatingContainer || e.target.closest('.creatio-satelite')) {
      floatingContainer.removeAttribute('data-user-positioned');
      floatingContainer.removeAttribute('data-fallback-position');
      debugLog('Shell container: Reset to automatic positioning');
      // Trigger repositioning
      setTimeout(() => positionFloatingContainerRelativeToSearch(), 10);
      e.preventDefault();
    }
  });

  // Position relative to search element after delays to ensure DOM is fully loaded
  setTimeout(() => {
    positionFloatingContainerRelativeToSearch();
  }, 100);

  // Try positioning again after more delays in case search element loads later
  setTimeout(() => {
    positionFloatingContainerRelativeToSearch();
  }, 300);

  setTimeout(() => {
    positionFloatingContainerRelativeToSearch();
  }, 800);

  setTimeout(() => {
    positionFloatingContainerRelativeToSearch();
  }, 1500);

  setTimeout(() => {
    positionFloatingContainerRelativeToSearch();
  }, 2500);

  // Additional positioning attempts for slow loading pages
  setTimeout(() => {
    positionFloatingContainerRelativeToSearch();
  }, 4000);

  setTimeout(() => {
    positionFloatingContainerRelativeToSearch();
  }, 6000);

  setTimeout(() => {
    positionFloatingContainerRelativeToSearch();
  }, 8000);

  // Re-position when window is resized
  window.addEventListener('resize', () => {
    if (!isDragging) {
      positionFloatingContainerRelativeToSearch();
    }
  });

  // Add periodic positioning check for newly created containers
  let positionCheckCount = 0;
  const maxPositionChecks = 40; // Increased from 20 to 40 for slower pages
  const positionCheckInterval = setInterval(() => {
    positionCheckCount++;
    const positioned = positionFloatingContainerRelativeToSearch();

    // Stop checking after successful positioning or max attempts
    if (positioned || positionCheckCount >= maxPositionChecks) {
      clearInterval(positionCheckInterval);
      debugLog(`Position check completed after ${positionCheckCount} attempts`);
    }
  }, 100); // Reduced from 150ms to 100ms for more frequent checks

  // Add MutationObserver to detect when search element appears
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if search element was added
        const searchElement = document.querySelector('crt-global-search');
        if (searchElement && !floatingContainer.hasAttribute('data-positioned')) {
          const positioned = positionFloatingContainerRelativeToSearch();
          if (positioned) {
            floatingContainer.setAttribute('data-positioned', 'true');
            observer.disconnect();
            debugLog('Search element detected by MutationObserver, positioning successful');
          }
        }
      }
    });
  });

  // Start observing the document with the configured parameters
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Stop observing after 10 seconds to avoid memory leaks
  setTimeout(() => {
    observer.disconnect();
  }, 10000);

  debugLog('Shell floating container created and positioned relative to search element');
  return floatingContainer;
}

// Function to setup floating container for configuration page with proper positioning
function setupConfigurationFloatingContainer(buttonWrapper) {
  // Create a floating button container for configuration page
  const floatingContainer = document.createElement('div');
  floatingContainer.className = 'creatio-satelite-floating';
  floatingContainer.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
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
  `;

  // Add drag functionality
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
      // Mark as manually positioned to prevent auto-repositioning
      floatingContainer.setAttribute('data-user-positioned', 'true');
      debugLog('Configuration container manually positioned by user');
    }
  });

  floatingContainer.appendChild(buttonWrapper);
  document.body.appendChild(floatingContainer);

  // Add special class for configuration page styling
  buttonWrapper.classList.add('creatio-satelite-configuration');
  buttonWrapper.style.flexDirection = 'row';

  // Add double-click to reset positioning for configuration container
  floatingContainer.addEventListener('dblclick', (e) => {
    if (e.target === floatingContainer || e.target.closest('.creatio-satelite')) {
      floatingContainer.removeAttribute('data-user-positioned');
      floatingContainer.removeAttribute('data-fallback-position');
      debugLog('Configuration container: Reset to automatic positioning');
      // Trigger repositioning
      setTimeout(() => positionFloatingContainerRelativeToSearch(), 10);
      e.preventDefault();
    }
  });

  // Position relative to action-button element after delays to ensure DOM is fully loaded
  setTimeout(() => {
    positionFloatingContainerRelativeToSearch();
  }, 300);

  // Try positioning again after more delays in case action button loads later
  setTimeout(() => {
    positionFloatingContainerRelativeToSearch();
  }, 800);

  setTimeout(() => {
    positionFloatingContainerRelativeToSearch();
  }, 1500);

  setTimeout(() => {
    positionFloatingContainerRelativeToSearch();
  }, 2500);

  // Re-position when window is resized
  window.addEventListener('resize', () => {
    if (!isDragging) {
      positionFloatingContainerRelativeToSearch();
    }
  });

  // Add periodic positioning check for newly created containers
  let positionCheckCount = 0;
  const maxPositionChecks = 20;
  const positionCheckInterval = setInterval(() => {
    positionCheckCount++;
    const positioned = positionFloatingContainerRelativeToSearch();

    // Stop checking after successful positioning or max attempts
    if (positioned || positionCheckCount >= maxPositionChecks) {
      clearInterval(positionCheckInterval);
      debugLog(`Configuration position check completed after ${positionCheckCount} attempts`);
    }
  }, 150);

  debugLog('Configuration floating container created and positioned relative to action-button element');
  return floatingContainer;
}

// Debug function to check current page status - can be called from console
window.creatioSatelliteDebug = function() {
  const pageType = getCreatioPageType();
  console.log('=== Creatio Satellite Debug Info ===');
  console.log('Page Type:', pageType);
  console.log('Menu Created:', menuCreated);
  console.log('Actions Menu Created:', actionsMenuCreated);
  console.log('Current URL:', window.location.href);
  console.log('Document Title:', document.title);

  // Check for Shell indicators
  const shellIndicators = [
    { name: 'ShellContainerWithBackground', element: document.getElementById('ShellContainerWithBackground') },
    { name: 'mainshell', element: document.querySelector('mainshell') },
    { name: 'crt-schema-outlet', element: document.querySelector('crt-schema-outlet') },
    { name: 'AppToolbarGlobalSearch', element: document.querySelector('[data-item-marker="AppToolbarGlobalSearch"]') },
    { name: 'crt-app-toolbar', element: document.querySelector('crt-app-toolbar') },
    { name: 'creatio-logo', element: document.querySelector('.creatio-logo') },
    { name: 'Terrasoft ID', element: document.querySelector('[id*="Terrasoft"]') },
    { name: 'Terrasoft class', element: document.querySelector('[class*="Terrasoft"]') },
    { name: 'creatio script', element: document.querySelector('script[src*="creatio"]') },
    { name: 'terrasoft script', element: document.querySelector('script[src*="terrasoft"]') },
    { name: 'creatio link', element: document.querySelector('link[href*="creatio"]') },
    { name: 'terrasoft link', element: document.querySelector('link[href*="terrasoft"]') }
  ];

  console.log('Shell Indicators:');
  shellIndicators.forEach(indicator => {
    console.log(`  ${indicator.name}:`, indicator.element ? '✓ Found' : '✗ Not found');
  });

  // Check for Configuration indicator
  const configIndicator = document.querySelector('ts-workspace-section');
  console.log('Configuration Indicator (ts-workspace-section):', configIndicator ? '✓ Found' : '✗ Not found');

  console.log('Extension Elements:');
  console.log('  Menu Button:', document.querySelector('.scripts-menu-button') ? '✓ Found' : '✗ Not found');
  console.log('  Actions Button:', document.querySelector('.actions-button') ? '✓ Found' : '✗ Not found');
  console.log('  Menu Container:', document.querySelector('.scripts-menu-container') ? '✓ Found' : '✗ Not found');
  console.log('  Actions Container:', document.querySelector('.actions-menu-container') ? '✓ Found' : '✗ Not found');

  return {
    pageType,
    menuCreated,
    actionsMenuCreated,
    url: window.location.href,
    title: document.title
  };
};

// Function to check page and create menu if needed
function checkCreatioPageAndCreateMenu() {
  debugLog("Checking for Creatio page");
  const pageType = getCreatioPageType();

  // Block menu creation on login pages
  if (pageType === 'login') {
    debugLog('Login page detected - Navigation/Actions menu creation blocked');
    return false;
  }

  if (pageType && !menuCreated && (pageType === 'shell' || pageType === 'configuration')) {
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
    debugLog(`${pageType} page detected but menu already created or page type not supported`);
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
setTimeout(() => {
  // Early check to prevent menu creation on login pages
  const initialPageType = getCreatioPageType();
  if (initialPageType === 'login') {
    debugLog('LOGIN PAGE DETECTED on initial check - Skipping Navigation/Actions menu initialization');
    return; // Exit early to prevent any menu creation on login pages
  }
  checkCreatioPageAndCreateMenu();
}, 1000);

// Check again when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  debugLog('DOMContentLoaded fired, checking for Creatio page');
  checkCreatioPageAndCreateMenu();
});

// Check again when window is fully loaded
window.addEventListener('load', () => {
  debugLog('Window load event fired, checking for Creatio page');
  checkCreatioPageAndCreateMenu();

  // Removed updateMenuPosition timeout - buttons stay in floating container
});

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
  let hasSearchElement = false;

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

          // Check for search element on Shell pages
          if (node.tagName === 'CRT-GLOBAL-SEARCH' ||
              (node.querySelector && node.querySelector('crt-global-search'))) {
            hasSearchElement = true;
            shouldCheck = true;
            debugLog('Search element detected in DOM changes');
          }
        }
      }
    }
  }

  // Always check for inappropriate pages and block menu creation on login pages
  const pageType = getCreatioPageType();
  if (pageType === 'login' || !pageType) {
    // Skip menu creation on login pages or unrecognized pages
    return;
  }

  if (shouldCheck && !menuCreated) {
    debugLog('Significant DOM changes detected, checking for Creatio page');
    if (hasLeftContainer) {
      debugLog('Left container available, priority check for Configuration page');
    }
    if (hasSearchElement) {
      debugLog('Search element available, priority check for Shell page');
    }
    checkCreatioPageAndCreateMenu();
  } else if (hasSearchElement && pageType === 'shell') {
    // If search element appears on shell page, reposition the container
    debugLog('Search element detected on Shell page, repositioning container');
    setTimeout(() => {
      positionFloatingContainerRelativeToSearch();
    }, 50);
    // Try again after a longer delay
    setTimeout(() => {
      positionFloatingContainerRelativeToSearch();
    }, 200);
  }
});

// Function to remove menu from inappropriate pages - REMOVED
// Navigation and Actions buttons will no longer be automatically removed

// Removed automatic menu removal functionality
// Navigation and Actions buttons will no longer be automatically removed from pages

// Function to monitor and restore buttons if they disappear
function monitorButtons() {
  const pageType = getCreatioPageType();

  // Only monitor on shell and configuration pages
  if (pageType !== 'shell' && pageType !== 'configuration') {
    return;
  }

  // Check if Navigation and Actions buttons exist
  const navigationButton = document.querySelector('.scripts-menu-button');
  const actionsButton = document.querySelector('.actions-button');
  const floatingContainer = document.querySelector('.creatio-satelite-floating');

  // If buttons are missing and menu should be created, recreate them
  if (!navigationButton || !actionsButton || !floatingContainer) {
    debugLog('Buttons missing, attempting to restore...');

    // Reset flags to allow recreation
    menuCreated = false;
    actionsMenuCreated = false;

    // Recreate the menu
    const success = createScriptsMenu();
    if (success) {
      debugLog('Buttons successfully restored');
    } else {
      debugLog('Failed to restore buttons');
    }
  } else if (pageType === 'shell' && floatingContainer) {
    // For shell page, check if the container is properly positioned relative to search
    const searchElement = document.querySelector('crt-global-search');
    if (searchElement) {
      // Check if search element has proper dimensions
      const searchRect = searchElement.getBoundingClientRect();
      if (searchRect.width < 50 || searchRect.height < 20) {
        debugLog('Search element dimensions too small, attempting to position container');
        positionFloatingContainerRelativeToSearch();
        return;
      }

      // Check if container position needs adjustment
      const containerRect = floatingContainer.getBoundingClientRect();

      // If container is too far from search element, reposition it
      const expectedLeft = searchRect.right + 20; // 20px gap after search element
      const currentLeft = containerRect.left;

      if (Math.abs(currentLeft - expectedLeft) > 50) {
        debugLog('Container position needs adjustment, repositioning...');
        positionFloatingContainerRelativeToSearch();
      }
    } else {
      // If search element not found, try to position the container
      debugLog('Search element not found, attempting to position container');
      positionFloatingContainerRelativeToSearch();
    }
  }
}

// Start monitoring every 2 seconds
setInterval(monitorButtons, 2000);

// Test function for creating shell floating menu
window.createShellFloatingMenu = function() {
  console.log('Creating shell floating menu...');

  // Remove existing menus
  document.querySelectorAll('.creatio-satelite-floating, .creatio-satelite').forEach(el => el.remove());

  // Reset flags
  menuCreated = false;
  actionsMenuCreated = false;

  // Force page type to shell for testing
  const originalGetCreatioPageType = getCreatioPageType;
  window.getCreatioPageType = () => 'shell';

  // Create menu
  const result = createScriptsMenu();

  // Restore original function
  window.getCreatioPageType = originalGetCreatioPageType;

  console.log('Shell floating menu creation result:', result);
  return result;
};

// Export positioning function for testing
window.positionFloatingContainerRelativeToSearch = positionFloatingContainerRelativeToSearch;

// Export setup function for testing
window.setupShellFloatingContainer = setupShellFloatingContainer;

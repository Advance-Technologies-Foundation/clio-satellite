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
  'ctrl+shift+u': () => executeNavigationScript('Users'), // Users
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
	debugLog(message);
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

// Function to check if current page is the Shell page of Creatio
function isShellPage() {
  const currentHost = window.location.hostname;

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
      return false;
    }
  }

  const creatioIndicators = [
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

  const foundIndicators = creatioIndicators.filter(indicator => indicator);

  const isCreatio = foundIndicators.length >= MIN_INDICATORS;

  if (!isCreatio) {
    debugLog(`Not enough Creatio indicators found (${foundIndicators.length}/${MIN_INDICATORS}). Skipping activation.`);
  } else {
    debugLog(`Found ${foundIndicators.length} Creatio indicators. Activating plugin.`);
  }

  return isCreatio;
}

function adjustMenuPosition(relatedContainer, container) {
  const rectangle = relatedContainer.getBoundingClientRect();
  container.style.top = `${rectangle.bottom + 2}px`;
  container.style.left = `${rectangle.left + 125}px`;
}

// Функция для создания меню скриптов напрямую из content script
function createScriptsMenu() {
  debugLog('Creating scripts menu');

  if (menuCreated || document.querySelector('.scripts-menu-button')) {
    debugLog('Menu already exists, skipping creation');
    return;
  }

  const searchElement = document.querySelector('[id*="AppToolbarGlobalSearch"]') ||
                       document.querySelector('[class*="AppToolbarGlobalSearch"]') ||
                       document.querySelector('.global-search');

  let topPosition = '20px';

  if (searchElement) {
    const searchRect = searchElement.getBoundingClientRect();
    topPosition = searchRect.top + 'px';
    debugLog(`Found search element, position: ${topPosition}`);
  }

  // Create button wrapper with CSS class
  const buttonWrapper = document.createElement('div');
  buttonWrapper.className = 'creatio-satelite';

  // Create menu button with CSS class
  const menuButton = document.createElement('button');
  menuButton.className = 'scripts-menu-button mat-flat-button mat-primary';
  menuButton.title = `Navigation (${getHotkeyString('V')})`; // Add hotkey to tooltip
  
  // Create and style button icon using CSS
  const iconImg = document.createElement('img');
  iconImg.src = chrome.runtime.getURL('icon128.png');
  // Image styles are handled by CSS

  const buttonText = document.createElement('span');
  buttonText.innerHTML = `Na(v)igation`;

  menuButton.appendChild(iconImg);
  menuButton.appendChild(buttonText);

  // Create actions button with CSS class
  const actionsButton = document.createElement('button');
  actionsButton.className = 'actions-button mat-flat-button mat-accent';
  actionsButton.title = `Actions (${getHotkeyString('A')})`; // Add hotkey to tooltip

  // Create actions button icon with CSS class
  const actionsButtonIcon = document.createElement('span');
  actionsButtonIcon.className = 'actions-button-icon';
  actionsButtonIcon.textContent = '⚡'; // Lightning bolt icon
  
  // Create actions button text
  const actionsButtonText = document.createElement('span');
  actionsButtonText.innerHTML = '(A)ctions';
  
  actionsButton.appendChild(actionsButtonIcon);
  actionsButton.appendChild(actionsButtonText);

  buttonWrapper.appendChild(menuButton);
  buttonWrapper.appendChild(actionsButton);

  // Create menu container with CSS class
  const menuContainer = document.createElement('div');
  menuContainer.classList.add('scripts-menu-container');
  hideMenuContainer(menuContainer); // Initially hidden
  // Only set dynamic position based on search element
  menuContainer.style.top = (parseFloat(topPosition) + 40) + 'px';

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
      'Features': '⚙️',
      'Application_Managment': '🔧',
      'Lookups': '🔍',
      'Process_library': '📚',
      'Process_log': '📋',
      'SysSettings': '⚙️',
      'Users': '👥',
      'Configuration': '⚙️',
      'TIDE': '💻'
    };

    // Create menu item with CSS classes
    const menuItem = document.createElement('div');
    menuItem.className = 'scripts-menu-item';
    
    // Create icon with CSS class
    const iconElement = document.createElement('span');
    iconElement.className = 'menu-item-icon';
    iconElement.textContent = menuIcons[scriptName] || '📄';
    
    // Create text container with CSS class
    const textContainer = document.createElement('div');
    textContainer.className = 'menu-item-text';
    
    // Create title with CSS class
    const title = document.createElement('div');
    title.className = 'menu-item-title';
    
    // Highlight hotkey letter in title
    const scriptNameForDisplay = scriptName.replace('_', ' ');
    const hotkeyLetters = {
      'Features': 'E',
      'Application Managment': 'M', 
      'Lookups': 'L',
      'Process library': 'P',
      'Process log': 'G',
      'SysSettings': 'Y',
      'Users': 'U',
      'Configuration': 'C',
      'TIDE': 'T'
    };
    
    const hotkeyLetter = hotkeyLetters[scriptNameForDisplay] || hotkeyLetters[scriptName];
    if (hotkeyLetter) {
      // Special handling for specific words
      let highlightedTitle = scriptNameForDisplay;
      switch(hotkeyLetter) {
        case 'E':
          highlightedTitle = highlightedTitle.replace(/Features/i, 'F(e)atures');
          break;
        case 'M':
          highlightedTitle = highlightedTitle.replace(/Managment/i, '(M)anagment');
          break;
        case 'G':
          highlightedTitle = highlightedTitle.replace(/log/i, 'lo(g)');
          break;
        case 'Y':
          highlightedTitle = highlightedTitle.replace(/SysSettings/i, 'S(y)sSettings');
          break;
        default:
          const regex = new RegExp(`(${hotkeyLetter.toLowerCase()}|${hotkeyLetter.toUpperCase()})`, '');
          highlightedTitle = highlightedTitle.replace(regex, '($1)');
      }
      title.innerHTML = highlightedTitle;
    } else {
      title.textContent = scriptNameForDisplay;
    }
    
    // Create description with CSS class
    const description = document.createElement('div');
    description.className = 'menu-item-description';
    description.textContent = scriptDescriptions[scriptName] || 'Run script ' + scriptName;
    
    // Menu item hover effects are handled by CSS

    menuItem.addEventListener('click', () => {
      // Send correct path under scripts/navigation to background for proper script injection
      chrome.runtime.sendMessage({
        action: 'executeScript',
        scriptPath: `navigation/${scriptFile}`
      }, response => {
        debugLog('Navigation script sent to background for injection');
      });

      hideMenuContainer(menuContainer);
    });

    textContainer.appendChild(title);
    textContainer.appendChild(description);
    menuItem.appendChild(iconElement);
    menuItem.appendChild(textContainer);
    menuContainer.appendChild(menuItem);
  });

  // Create actions menu container with CSS class
  const actionsMenuContainer = document.createElement('div');
  actionsMenuContainer.classList.add('actions-menu-container');
  hideMenuContainer(actionsMenuContainer); // Initially hidden
  actionsMenuContainer.style.top = (parseFloat(topPosition) + 40) + 'px';

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
        'RestartApp': { file: 'RestartApp.js', icon: '🔄', desc: 'Reload the Creatio application', hotkey: getHotkeyString('R') },
        'FlushRedisDB': { file: 'FlushRedisDB.js', icon: '🗑️', desc: 'Clear Redis database', hotkey: getHotkeyString('F') },
        'EnableAutologin': { file: null, icon: '✅', desc: 'Enable autologin for this site' },
        'DisableAutologin': { file: null, icon: '🚫', desc: 'Disable autologin for this site' },
        'Settings': { file: null, icon: '⚙️', desc: 'Open plugin settings', hotkey: getHotkeyString('S') }
      };
      const actionsList = ['RestartApp', 'FlushRedisDB'];
      if (lastUser) actionsList.push(autologinEnabled ? 'DisableAutologin' : 'EnableAutologin');
      actionsList.push('Settings');
      actionsList.forEach(scriptName => {
        const detail = actionDetails[scriptName];
        const menuItem = document.createElement('div'); menuItem.className='actions-menu-item';
        const iconElem = document.createElement('span'); iconElem.className='menu-item-icon'; iconElem.textContent=detail.icon;
        const textCont = document.createElement('div'); textCont.className='menu-item-text';
        const title = document.createElement('div'); title.className='menu-item-title'; 
        
        // Highlight hotkey letter in action titles
        let displayTitle = scriptName.replace('Autologin',' autologin').replace(/([A-Z])/g,' $1').trim();
        // Fix specific cases
        if (scriptName === 'FlushRedisDB') {
          displayTitle = 'Flush Redis DB';
        }
        
        const actionHotkeys = {
          'Restart App': 'R',
          'Flush Redis DB': 'F', 
          'Settings': 'S'
        };
        
        const hotkeyLetter = actionHotkeys[displayTitle];
        if (hotkeyLetter) {
          switch(hotkeyLetter) {
            case 'R':
              title.innerHTML = displayTitle.replace(/Restart/i, '(R)estart');
              break;
            case 'F':
              title.innerHTML = displayTitle.replace(/Flush/i, '(F)lush');
              break;
            case 'S':
              title.innerHTML = displayTitle.replace(/Settings/i, '(S)ettings');
              break;
            default:
              title.textContent = displayTitle;
          }
        } else {
          title.textContent = displayTitle;
        }
        
        const desc = document.createElement('div'); desc.className='menu-item-description'; 
        desc.textContent = detail.desc + (detail.hotkey ? ` (${detail.hotkey})` : '');
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
        textCont.appendChild(title); textCont.appendChild(desc);
        menuItem.appendChild(iconElem); menuItem.appendChild(textCont);
        actionsMenuContainer.appendChild(menuItem);
      });
    });
  }

  // Make refreshActionsMenu available globally for hotkey functions
  window.refreshActionsMenu = refreshActionsMenu;

  actionsButton.addEventListener('click', (target) => {
    hideMenuContainer(menuContainer);
    // Refresh actions menu before showing
    refreshActionsMenu();
    showMenuContainer(actionsMenuContainer);
    adjustMenuPosition(target.currentTarget, actionsMenuContainer);
  });

  menuButton.addEventListener('click', (target) => {
      showMenuContainer(menuContainer);
      hideMenuContainer(actionsMenuContainer);
      adjustMenuPosition(target.currentTarget, menuContainer);
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

    const rootMenuContainer = document.createElement('div');
    rootMenuContainer.classList.add('creatio-satelite-menu-container');
    rootMenuContainer.appendChild(menuContainer);
    rootMenuContainer.appendChild(actionsMenuContainer);
    document.body.appendChild(rootMenuContainer);
    debugLog('Scripts menu created successfully');
    menuCreated = true;
    actionsMenuCreated = true;
  } catch (error) {
    console.error('Error appending menu elements:', error);
    menuCreated = false;
    actionsMenuCreated = false;
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
function checkShellAndCreateMenu() {
  debugLog("Checking for Shell page");
  if (isShellPage() && !menuCreated) {
    debugLog("Shell page detected, creating scripts menu");
    createScriptsMenu();
  }
}

// Initial check with slight delay to let page load
setTimeout(checkShellAndCreateMenu, 1000);

// Check again when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  debugLog('DOMContentLoaded fired, checking for Shell page');
  checkShellAndCreateMenu();
});

// Check again when window is fully loaded
window.addEventListener('load', () => {
  debugLog('Window load event fired, checking for Shell page');
  checkShellAndCreateMenu();

  setTimeout(updateMenuPosition, 2000);
});

// Наблюдаем за изменениями в DOM и обновляем позицию меню
setTimeout(() => {
  positionObserver.observe(document.body, { childList: true, subtree: true });
}, 3000);

// Periodic check in case the page loads Shell content dynamically
let checkCount = 0;
const maxChecks = 20;
const checkInterval = setInterval(() => {
  checkCount++;
  debugLog(`Check interval ${checkCount}/${maxChecks} fired`);

  if (checkShellAndCreateMenu() || checkCount >= maxChecks) {
    debugLog('Clearing check interval');
    clearInterval(checkInterval);
  }
}, 1000);

// Also observe DOM changes to detect Shell page loading
const observer = new MutationObserver(mutations => {
  let shouldCheck = false;

  for (const mutation of mutations) {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 2) {
      shouldCheck = true;
      break;
    }
  }

  if (shouldCheck && !menuCreated) {
    debugLog('Significant DOM changes detected, checking for Shell page');
    checkShellAndCreateMenu();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

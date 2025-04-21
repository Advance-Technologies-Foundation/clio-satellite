// Global flag to track if menu is already created
let menuCreated = false;
let actionsMenuCreated = false; // New flag to track Actions menu creation

/**
 * Loads CSS styles for the extension UI
 * Adds the styles.css file to the page if it hasn't been loaded yet
 */
function loadStyles() {
  if (document.querySelector('link[href*="styles.css"]')) {
    console.log("Styles already loaded");
    return;
  }

  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = chrome.runtime.getURL('styles.css');
  document.head.appendChild(styleLink);
  console.log("Styles loaded");
}

/**
 * Creates the main scripts navigation menu
 * This function builds the primary UI for the extension, including the main navigation
 * button and the actions button, with their respective dropdown menus
 * @returns {boolean} True if menu was created successfully, false if creation was skipped or failed
 */
function createScriptsMenu() {
  console.log("Creating scripts menu");
  
  // First check if domain is in exclusion list
  if (isExcludedDomain()) {
    console.log("Domain is in exclusion list, not creating scripts menu");
    return false;
  }

  // Check if the current URL contains 'NuiLogin.aspx' (case-insensitive) and skip adding buttons if true
  if (window.location.href.toLowerCase().includes('nuilogin.aspx')) {
    console.log("Login page detected, skipping button creation");
    return false; // Explicitly return false to indicate no buttons should be created
  }

  loadStyles();

  if (menuCreated || document.querySelector('.scripts-menu-button')) {
    console.log("Menu already exists, skipping creation");
    return;
  }

  const searchElement = document.querySelector('[id*="AppToolbarGlobalSearch"]') || 
                       document.querySelector('[class*="AppToolbarGlobalSearch"]') ||
                       document.querySelector('.global-search');

  let topPosition = '20px';

  if (searchElement) {
    const searchRect = searchElement.getBoundingClientRect();
    topPosition = searchRect.top + 'px';
    console.log(`Found search element, position: ${topPosition}`);
  }

  const buttonWrapper = document.createElement('div');
  buttonWrapper.className = 'button-wrapper';
  buttonWrapper.style.top = topPosition;

  const menuButton = document.createElement('button');
  menuButton.className = 'scripts-menu-button mat-flat-button mat-primary';

  const iconImg = document.createElement('img');
  iconImg.src = chrome.runtime.getURL('icon128.png');

  const buttonText = document.createElement('span');
  buttonText.textContent = 'Clio Satelite : Try me!';

  menuButton.appendChild(iconImg);
  menuButton.appendChild(buttonText);

  const actionsButton = document.createElement('button');
  actionsButton.className = 'actions-button mat-flat-button mat-accent';

  const actionsButtonIcon = document.createElement('span');
  actionsButtonIcon.textContent = '⚡'; // Lightning bolt icon symbolizing actions/operations
  actionsButtonIcon.title = 'Actions'; // Add tooltip to explain what the button does
  actionsButton.appendChild(actionsButtonIcon);

  buttonWrapper.appendChild(menuButton);
  buttonWrapper.appendChild(actionsButton);

  const menuContainer = document.createElement('div');
  menuContainer.className = 'scripts-menu-container';
  menuContainer.style.top = (parseFloat(topPosition) + 40) + 'px';

  const scriptDescriptions = {
    'Features': 'Open system features management page',
    'Application_Managment': 'Application managment (App Hub)',
    'Lookups': 'Open system lookups',
    'Process_library': 'Open process library',
    'Process_log': 'View process log',
    'SysSettings': 'System settings and parameters',
    'Users': 'Manage system users',
    'Configuration':'Open configuration'
  };

  const scriptFiles = [
    'Features.js', 
    'Application_Managment.js', 
    'Lookups.js', 
    'Process_library.js', 
    'Process_log.js', 
    'SysSettings.js', 
    'Users.js',
    'Configuration.js'
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
      'Configuration': '⚙️'
    };

    const menuItem = document.createElement('div');
    menuItem.className = 'scripts-menu-item';

    const iconElement = document.createElement('span');
    iconElement.textContent = menuIcons[scriptName] || '📄';

    const textContainer = document.createElement('div');
    textContainer.className = 'menu-item-text';

    const title = document.createElement('div');
    title.className = 'menu-item-title';
    title.textContent = scriptName.replace('_', ' ');

    const description = document.createElement('div');
    description.className = 'menu-item-description';
    description.textContent = scriptDescriptions[scriptName] || 'Run script ' + scriptName;

    menuItem.addEventListener('click', () => {
      chrome.runtime.sendMessage({
        action: 'executeScript',
        scriptName: scriptFile
      }, response => {
        console.log('Message sent to background script');
      });

      menuContainer.style.display = 'none';
    });

    textContainer.appendChild(title);
    textContainer.appendChild(description);
    menuItem.appendChild(iconElement);
    menuItem.appendChild(textContainer);
    menuContainer.appendChild(menuItem);
  });

  const actionsMenuContainer = document.createElement('div');
  actionsMenuContainer.className = 'actions-menu-container';
  actionsMenuContainer.style.top = (parseFloat(topPosition) + 40) + 'px';

  const actionsScriptDescriptions = {
    'RestartApp': 'Reload the Creatio application',
    'FlushRedisDB': 'Clear Redis database'
  };

  const actionsIcons = {
    'RestartApp': '🔄',
    'FlushRedisDB': '🗑️'
  };

  const actionsScriptFiles = [
    'RestartApp.js',
    'FlushRedisDB.js'
  ];

  actionsScriptFiles.forEach(scriptFile => {
    const scriptName = scriptFile.replace('.js', '');

    const menuItem = document.createElement('div');
    menuItem.className = 'actions-menu-item';

    const iconElement = document.createElement('span');
    iconElement.textContent = actionsIcons[scriptName] || '⚙️';

    const textContainer = document.createElement('div');
    textContainer.className = 'menu-item-text';

    const title = document.createElement('div');
    title.className = 'menu-item-title';
    title.textContent = scriptName.replace('_', ' ');

    const description = document.createElement('div');
    description.className = 'menu-item-description';
    description.textContent = actionsScriptDescriptions[scriptName] || 'Run action ' + scriptName;

    menuItem.addEventListener('click', () => {
      chrome.runtime.sendMessage({
        action: 'executeScript',
        scriptPath: 'actions/' + scriptFile
      }, response => {
        console.log('Message sent to background script to execute action script: actions/' + scriptFile);
      });

      actionsMenuContainer.style.display = 'none';
    });

    textContainer.appendChild(title);
    textContainer.appendChild(description);
    menuItem.appendChild(iconElement);
    menuItem.appendChild(textContainer);
    actionsMenuContainer.appendChild(menuItem);
  });

  actionsButton.addEventListener('click', () => {
    if (actionsMenuContainer.style.display === 'none') {
      actionsMenuContainer.style.display = 'flex';
      menuContainer.style.display = 'none';
    } else {
      actionsMenuContainer.style.display = 'none';
    }
  });

  menuButton.addEventListener('click', () => {
    if (menuContainer.style.display === 'none') {
      menuContainer.style.display = 'flex';
      actionsMenuContainer.style.display = 'none';
    } else {
      menuContainer.style.display = 'none';
    }
  });

  document.addEventListener('click', (event) => {
    if (!menuButton.contains(event.target) && !menuContainer.contains(event.target)) {
      menuContainer.style.display = 'none';
    }
    if (!actionsButton.contains(event.target) && !actionsMenuContainer.contains(event.target)) {
      actionsMenuContainer.style.display = 'none';
    }
  });

  try {
    const searchElement = document.querySelector('[data-item-marker="AppToolbarGlobalSearch"]');

    if (searchElement && searchElement.parentElement) {
      const searchParent = searchElement.parentElement;
      searchElement.insertAdjacentElement('afterend', buttonWrapper);

      buttonWrapper.classList.add('button-wrapper-in-toolbar');
      buttonWrapper.classList.remove('button-wrapper');

      console.log("Button placed next to search element on initial creation");
    } else {
      const appToolbar = document.querySelector('crt-app-toolbar');

      if (appToolbar) {
        appToolbar.appendChild(buttonWrapper);
        console.log("Button inserted into crt-app-toolbar");

        const centerContainer = document.createElement('div');
        centerContainer.className = 'center-container';

        buttonWrapper.remove();
        centerContainer.appendChild(buttonWrapper);
        appToolbar.appendChild(centerContainer);

        buttonWrapper.classList.add('button-wrapper-in-toolbar');
        buttonWrapper.classList.remove('button-wrapper');
      } else {
        document.body.appendChild(buttonWrapper);
        console.log("crt-app-toolbar not found, button added to body");
      }
    }

    document.body.appendChild(menuContainer);
    document.body.appendChild(actionsMenuContainer);
    console.log("Scripts menu created successfully");
    menuCreated = true;
    actionsMenuCreated = true;
    return true;
  } catch (error) {
    console.error("Error appending menu elements:", error);
    menuCreated = false;
    actionsMenuCreated = false;
    return false;
  }
}

/**
 * Creates a centered toolbar for pages without standard toolbar
 * This function is used as a fallback when the standard Creatio toolbar
 * or search element is not present on the page
 * @returns {boolean} True if the centered toolbar was created, false otherwise
 */
function createCenteredToolbar() {
  console.log("Creating centered toolbar for pages without standard toolbar");
  
  // First check if domain is in exclusion list
  if (isExcludedDomain()) {
    console.log("Domain is in exclusion list, not creating centered toolbar");
    return false;
  }
  
  // Check if the current URL contains 'NuiLogin.aspx' (case-insensitive) and skip adding buttons if true
  if (window.location.href.toLowerCase().includes('nuilogin.aspx')) {
    console.log("Login page detected, skipping button creation");
    return false; // Explicitly return false to indicate no buttons should be created
  }

  loadStyles();

  if (document.querySelector('.centered-toolbar')) {
    console.log("Centered toolbar already exists, skipping creation");
    return;
  }

  const hasToolbar = !!document.querySelector('crt-app-toolbar');
  const hasSearch = !!document.querySelector('[data-item-marker="AppToolbarGlobalSearch"]');
  
  if (hasToolbar || hasSearch) {
    console.log("Standard toolbar or search element found, not creating centered toolbar");
    return;
  }

  const centeredToolbar = document.createElement('div');
  centeredToolbar.className = 'centered-toolbar';

  const scriptsButton = document.createElement('button');
  scriptsButton.className = 'scripts-menu-button mat-flat-button mat-primary';

  const iconImg = document.createElement('img');
  iconImg.src = chrome.runtime.getURL('icon128.png');

  const buttonText = document.createElement('span');
  buttonText.textContent = 'Clio Satelite';

  scriptsButton.appendChild(iconImg);
  scriptsButton.appendChild(buttonText);

  const actionsButton = document.createElement('button');
  actionsButton.className = 'actions-button mat-flat-button mat-accent';

  const actionsButtonIcon = document.createElement('span');
  actionsButtonIcon.textContent = '⚡'; 
  actionsButtonIcon.title = 'Actions';
  actionsButton.appendChild(actionsButtonIcon);

  centeredToolbar.appendChild(scriptsButton);
  centeredToolbar.appendChild(actionsButton);

  const menuContainer = document.createElement('div');
  menuContainer.className = 'scripts-menu-container';

  const scriptDescriptions = {
    'Features': 'Open system features management page',
    'Application_Managment': 'Application managment (App Hub)',
    'Lookups': 'Open system lookups',
    'Process_library': 'Open process library',
    'Process_log': 'View process log',
    'SysSettings': 'System settings and parameters',
    'Users': 'Manage system users',
    'Configuration':'Open configuration'
  };

  const scriptFiles = [
    'Features.js', 
    'Application_Managment.js', 
    'Lookups.js', 
    'Process_library.js', 
    'Process_log.js', 
    'SysSettings.js', 
    'Users.js',
    'Configuration.js'
  ];

  const menuIcons = {
    'Features': '⚙️',
    'Application_Managment': '🔧',
    'Lookups': '🔍',
    'Process_library': '📚',
    'Process_log': '📋',
    'SysSettings': '⚙️',
    'Users': '👥',
    'Configuration': '⚙️'
  };

  scriptFiles.forEach(scriptFile => {
    const scriptName = scriptFile.replace('.js', '');

    const menuItem = document.createElement('div');
    menuItem.className = 'scripts-menu-item';

    const iconElement = document.createElement('span');
    iconElement.textContent = menuIcons[scriptName] || '📄';

    const textContainer = document.createElement('div');
    textContainer.className = 'menu-item-text';

    const title = document.createElement('div');
    title.className = 'menu-item-title';
    title.textContent = scriptName.replace('_', ' ');

    const description = document.createElement('div');
    description.className = 'menu-item-description';
    description.textContent = scriptDescriptions[scriptName] || 'Run script ' + scriptName;

    menuItem.addEventListener('click', () => {
      chrome.runtime.sendMessage({
        action: 'executeScript',
        scriptName: scriptFile
      }, response => {
        console.log('Message sent to background script');
      });

      menuContainer.style.display = 'none';
    });

    textContainer.appendChild(title);
    textContainer.appendChild(description);
    menuItem.appendChild(iconElement);
    menuItem.appendChild(textContainer);
    menuContainer.appendChild(menuItem);
  });

  const actionsMenuContainer = document.createElement('div');
  actionsMenuContainer.className = 'actions-menu-container';

  const actionsScriptDescriptions = {
    'RestartApp': 'Reload the Creatio application',
    'FlushRedisDB': 'Clear Redis database'
  };

  const actionsIcons = {
    'RestartApp': '🔄',
    'FlushRedisDB': '🗑️'
  };

  const actionsScriptFiles = [
    'RestartApp.js',
    'FlushRedisDB.js'
  ];

  actionsScriptFiles.forEach(scriptFile => {
    const scriptName = scriptFile.replace('.js', '');

    const menuItem = document.createElement('div');
    menuItem.className = 'actions-menu-item';

    const iconElement = document.createElement('span');
    iconElement.textContent = actionsIcons[scriptName] || '⚙️';

    const textContainer = document.createElement('div');
    textContainer.className = 'menu-item-text';

    const title = document.createElement('div');
    title.className = 'menu-item-title';
    title.textContent = scriptName.replace('_', ' ');

    const description = document.createElement('div');
    description.className = 'menu-item-description';
    description.textContent = actionsScriptDescriptions[scriptName] || 'Run action ' + scriptName;

    menuItem.addEventListener('click', () => {
      chrome.runtime.sendMessage({
        action: 'executeScript',
        scriptPath: 'actions/' + scriptFile
      }, response => {
        console.log('Message sent to background script to execute action script: actions/' + scriptFile);
      });

      actionsMenuContainer.style.display = 'none';
    });

    textContainer.appendChild(title);
    textContainer.appendChild(description);
    menuItem.appendChild(iconElement);
    menuItem.appendChild(textContainer);
    actionsMenuContainer.appendChild(menuItem);
  });

  scriptsButton.addEventListener('click', () => {
    if (menuContainer.style.display === 'none') {
      menuContainer.style.display = 'flex';
      actionsMenuContainer.style.display = 'none';
    } else {
      menuContainer.style.display = 'none';
    }
  });

  actionsButton.addEventListener('click', () => {
    if (actionsMenuContainer.style.display === 'none') {
      actionsMenuContainer.style.display = 'flex';
      menuContainer.style.display = 'none';
    } else {
      actionsMenuContainer.style.display = 'none';
    }
  });

  document.addEventListener('click', (event) => {
    if (!scriptsButton.contains(event.target) && !menuContainer.contains(event.target)) {
      menuContainer.style.display = 'none';
    }
    if (!actionsButton.contains(event.target) && !actionsMenuContainer.contains(event.target)) {
      actionsMenuContainer.style.display = 'none';
    }
  });

  document.body.appendChild(centeredToolbar);
  document.body.appendChild(menuContainer);
  document.body.appendChild(actionsMenuContainer);
  
  console.log("Centered toolbar created successfully");
  return true;
}

/**
 * Places the extension button next to the search element if it exists
 * This improves UI integration by positioning our controls near existing UI elements
 * @returns {boolean} True if button was successfully placed next to search, false otherwise
 */
function placeButtonNextToSearch() {
  const buttonWrapper = document.querySelector('div:has(.scripts-menu-button)');
  const searchElement = document.querySelector('[data-item-marker="AppToolbarGlobalSearch"]');
  
  if (!buttonWrapper || !searchElement || !searchElement.parentElement) {
    return false;
  }
  
  if (buttonWrapper.nextElementSibling === searchElement || 
      buttonWrapper.previousElementSibling === searchElement) {
    return true;
  }
  
  try {
    searchElement.insertAdjacentElement('afterend', buttonWrapper);
    
    buttonWrapper.classList.add('button-wrapper-in-toolbar');
    buttonWrapper.classList.remove('button-wrapper');
    
    const searchRect = searchElement.getBoundingClientRect();
    const searchInput = searchElement.querySelector('input') || searchElement;
    if (searchInput) {
      const inputRect = searchInput.getBoundingClientRect();
      const verticalCenter = inputRect.top + (inputRect.height / 2);
      const buttonHeight = buttonWrapper.offsetHeight;
      buttonWrapper.style.marginTop = ((verticalCenter - searchRect.top) - (buttonHeight / 2)) + 'px';
    }
    
    console.log("Button placed next to search element dynamically and aligned vertically");
    return true;
  } catch (error) {
    console.error("Error placing button next to search:", error);
    return false;
  }
}

/**
 * Updates the position of the extension menu
 * Finds the search element and adjusts the position of the scripts button accordingly
 */
function updateMenuPosition() {
  const buttonWrapper = document.querySelector('div:has(.scripts-menu-button)');
  const menuContainer = document.querySelector('.scripts-menu-container');
  const actionsMenuContainer = document.querySelector('.actions-menu-container');

  if (!buttonWrapper || !menuContainer) return;

  const isInToolbar = !!buttonWrapper.closest('crt-app-toolbar');

  if (isInToolbar) {
    const buttonRect = buttonWrapper.getBoundingClientRect();
    menuContainer.style.top = (buttonRect.bottom + 5) + 'px';
    menuContainer.style.left = '50%';
    menuContainer.style.transform = 'translateX(-50%)';

    if (actionsMenuContainer) {
      actionsMenuContainer.style.top = (buttonRect.bottom + 5) + 'px';
      actionsMenuContainer.style.left = '50%';
      actionsMenuContainer.style.transform = 'translateX(-50%)';
    }
    return;
  }

  const searchElement = document.querySelector('[data-item-marker="AppToolbarGlobalSearch"]') || 
                       document.querySelector('[class*="AppToolbarGlobalSearch"]') ||
                       document.querySelector('.global-search');

  if (searchElement) {
    const searchRect = searchElement.getBoundingClientRect();
    
    const searchInput = searchElement.querySelector('input') || searchElement;
    if (searchInput) {
      const inputRect = searchInput.getBoundingClientRect();
      const verticalCenter = inputRect.top + (inputRect.height / 2);
      const buttonHeight = buttonWrapper.offsetHeight;
      buttonWrapper.style.top = (verticalCenter - (buttonHeight / 2)) + 'px';
    } else {
      buttonWrapper.style.top = searchRect.top + 'px';
    }
    
    menuContainer.style.top = (searchRect.bottom + 5) + 'px';

    if (actionsMenuContainer) {
      actionsMenuContainer.style.top = (searchRect.bottom + 5) + 'px';
    }

    console.log(`Updated menu position to match search element: ${buttonWrapper.style.top}`);
  }
}

/**
 * Moves the extension button to toolbar if it appears
 * This ensures proper integration with dynamically loaded Creatio UI
 * @returns {boolean} True if button was moved successfully, false otherwise
 */
function moveButtonToToolbar() {
  const menuButton = document.querySelector('.scripts-menu-button');
  const menuContainer = document.querySelector('.scripts-menu-container');
  const actionsMenuContainer = document.querySelector('.actions-menu-container');

  if (!menuButton) return false;

  const isInToolbar = !!menuButton.closest('crt-app-toolbar');
  if (isInToolbar) return true;

  const appToolbar = document.querySelector('crt-app-toolbar');
  if (!appToolbar) return false;

  const centerContainer = document.createElement('div');
  centerContainer.className = 'center-container';

  menuButton.remove();
  centerContainer.appendChild(menuButton);
  appToolbar.appendChild(centerContainer);

  const buttonWrapper = menuButton.parentElement;
  buttonWrapper.classList.add('button-wrapper-in-toolbar');
  buttonWrapper.classList.remove('button-wrapper');

  if (menuContainer) {
    const buttonRect = menuButton.getBoundingClientRect();
    menuContainer.style.top = (buttonRect.bottom + 5) + 'px';
  }

  if (actionsMenuContainer) {
    const buttonRect = menuButton.getBoundingClientRect();
    actionsMenuContainer.style.top = (buttonRect.bottom + 5) + 'px';
  }

  console.log("Button moved to crt-app-toolbar and centered");
  return true;
}

// Observer to update menu position when DOM changes
const positionObserver = new MutationObserver(() => {
  if (placeButtonNextToSearch()) {
    return;
  }

  updateMenuPosition();
  moveButtonToToolbar();
});

/**
 * Checks the page type and creates appropriate menu
 * This function determines whether to create standard menu or centered toolbar
 * based on page content
 * @returns {boolean} True if menu was created, false otherwise
 */
function checkShellAndCreateMenu() {
  console.log("Checking for Shell page");
  
  if (typeof isLoginPage === 'function' && isLoginPage()) {
    console.log("Login page detected, skipping scripts menu creation");
    return false;
  }
  
  if (isShellPage() && !menuCreated) {
    console.log("Shell page detected, creating scripts menu");
    createScriptsMenu();
    return true;
  } else if (!menuCreated) {
    console.log("Shell page not detected, checking for toolbar-less page");
    return createCenteredToolbar();
  }
  return false;
}

// Initial check with slight delay to let page load
setTimeout(checkShellAndCreateMenu, 1000);

// Check again when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded fired, checking for Shell page');
  checkShellAndCreateMenu();
});

// Check again when window is fully loaded
window.addEventListener('load', () => {
  console.log('Window load event fired, checking for Shell page');
  checkShellAndCreateMenu();

  setTimeout(updateMenuPosition, 2000);
});

// Observe DOM changes and update menu position
setTimeout(() => {
  positionObserver.observe(document.body, { childList: true, subtree: true });
}, 3000);

// Periodic check in case the page loads Shell content dynamically
let checkCount = 0;
const maxChecks = 20;
const checkInterval = setInterval(() => {
  checkCount++;
  console.log(`Check interval ${checkCount}/${maxChecks} fired`);

  if (checkShellAndCreateMenu() || checkCount >= maxChecks) {
    console.log('Clearing check interval');
    clearInterval(checkInterval);
  }
}, 1000);

// Observer to detect login page loading
const loginObserver = new MutationObserver(() => {
  if (typeof isLoginPage === 'function' && isLoginPage()) {
    console.log("Login page detected via mutation observer, removing navigation buttons");
    
    const buttonsToRemove = [
      '.scripts-menu-button',
      '.actions-button',
      '.button-wrapper',
      '.scripts-menu-container',
      '.actions-menu-container',
      '.centered-toolbar'
    ];
    
    buttonsToRemove.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.remove();
        console.log(`Removed element: ${selector}`);
      });
    });
    
    menuCreated = false;
    actionsMenuCreated = false;
  }
});

// Start observer to track appearance of login page
setTimeout(() => {
  loginObserver.observe(document.body, { childList: true, subtree: true });
}, 1000);

// Observer to detect Shell page loading
const observer = new MutationObserver(mutations => {
  let shouldCheck = false;

  for (const mutation of mutations) {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 2) {
      shouldCheck = true;
      break;
    }
  }

  if (shouldCheck && !menuCreated) {
    console.log('Significant DOM changes detected, checking for Shell page');
    checkShellAndCreateMenu();
  }
});

observer.observe(document.body, { childList: true, subtree: true });
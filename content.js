// Global flag to track if menu is already created
let menuCreated = false;
let actionsMenuCreated = false; // New flag to track Actions menu creation

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
      console.log(`Domain ${currentHost} is in the exclusion list. Skipping activation.`);
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
    console.log(`Not enough Creatio indicators found (${foundIndicators.length}/${MIN_INDICATORS}). Skipping activation.`);
  } else {
    console.log(`Found ${foundIndicators.length} Creatio indicators. Activating plugin.`);
  }

  return isCreatio;
}

// Функция для создания меню скриптов напрямую из content script
function createScriptsMenu() {
  console.log('Creating scripts menu');

  if (menuCreated || document.querySelector('.scripts-menu-button')) {
    console.log('Menu already exists, skipping creation');
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

  // Create button wrapper with CSS class
  const buttonWrapper = document.createElement('div');
  buttonWrapper.className = 'creatio-satelite';

  // Create menu button with CSS class
  const menuButton = document.createElement('button');
  menuButton.className = 'scripts-menu-button mat-flat-button mat-primary';
  
  // Create and style button icon using CSS
  const iconImg = document.createElement('img');
  iconImg.src = chrome.runtime.getURL('icon128.png');
  // Image styles are handled by CSS

  const buttonText = document.createElement('span');
  buttonText.textContent = 'Clio Satelite : Try me!';

  menuButton.appendChild(iconImg);
  menuButton.appendChild(buttonText);

  // Create actions button with CSS class
  const actionsButton = document.createElement('button');
  actionsButton.className = 'actions-button mat-flat-button mat-accent';

  // Create actions button icon with CSS class
  const actionsButtonIcon = document.createElement('span');
  actionsButtonIcon.className = 'actions-button-icon';
  actionsButtonIcon.textContent = '⚡'; // Lightning bolt icon
  actionsButtonIcon.title = 'Actions'; // Add tooltip
  actionsButton.appendChild(actionsButtonIcon);

  buttonWrapper.appendChild(menuButton);
  buttonWrapper.appendChild(actionsButton);

  // Create menu container with CSS class
  const menuContainer = document.createElement('div');
  menuContainer.className = 'scripts-menu-container';
  // Only set dynamic position based on search element
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
    title.textContent = scriptName.replace('_', ' ');
    
    // Create description with CSS class
    const description = document.createElement('div');
    description.className = 'menu-item-description';
    description.textContent = scriptDescriptions[scriptName] || 'Run script ' + scriptName;
    
    // Menu item hover effects are handled by CSS

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

  // Create actions menu container with CSS class
  const actionsMenuContainer = document.createElement('div');
  actionsMenuContainer.className = 'actions-menu-container';
  // Only set dynamic position based on search element
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

    // Create menu item with CSS classes
    const menuItem = document.createElement('div');
    menuItem.className = 'actions-menu-item';
    
    // Create icon with CSS class
    const iconElement = document.createElement('span');
    iconElement.className = 'menu-item-icon';
    iconElement.textContent = actionsIcons[scriptName] || '⚙️';
    
    // Create text container with CSS class
    const textContainer = document.createElement('div');
    textContainer.className = 'menu-item-text';
    
    // Create title with CSS class
    const title = document.createElement('div');
    title.className = 'menu-item-title';
    title.textContent = scriptName.replace('_', ' ');
    
    // Create description with CSS class
    const description = document.createElement('div');
    description.className = 'menu-item-description';
    description.textContent = actionsScriptDescriptions[scriptName] || 'Run action ' + scriptName;
    
    // Menu item hover effects are handled by CSS

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
      
      // Apply creatio-satelite-button-next-to-search class
      buttonWrapper.classList.add('creatio-satelite-button-next-to-search');
      
      console.log('Button placed next to search element on initial creation');
    } else {
      const appToolbar = document.querySelector('crt-app-toolbar');

      if (appToolbar) {
        appToolbar.appendChild(buttonWrapper);
        console.log('Button inserted into crt-app-toolbar');

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
        console.log('crt-app-toolbar not found, button added to body');
      }
    }

    document.body.appendChild(menuContainer);
    document.body.appendChild(actionsMenuContainer);
    console.log('Scripts menu created successfully');
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
    
    console.log('Button placed next to search element dynamically');
    return true;
  } catch (error) {
    console.error('Error placing button next to search:', error);
    return false;
  }
}

// Функция, которая ищет элемент поиска и обновляет позицию кнопки скриптов
function updateMenuPosition() {
  const buttonWrapper = document.querySelector('.creatio-satelite');
  const menuContainer = document.querySelector('.scripts-menu-container');
  const actionsMenuContainer = document.querySelector('.actions-menu-container');

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

    console.log(`Updated menu position to match search element: ${searchRect.top}px`);
  }
}

// Функция для перемещения кнопки в toolbar, если он появился
function moveButtonToToolbar() {
  const menuButton = document.querySelector('.scripts-menu-button');
  const menuContainer = document.querySelector('.scripts-menu-container');
  const actionsMenuContainer = document.querySelector('.actions-menu-container');
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

  console.log('Button moved to crt-app-toolbar and centered');
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
  console.log("Checking for Shell page");
  if (isShellPage() && !menuCreated) {
    console.log("Shell page detected, creating scripts menu");
    createScriptsMenu();
  }
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

// Наблюдаем за изменениями в DOM и обновляем позицию меню
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
    console.log('Significant DOM changes detected, checking for Shell page');
    checkShellAndCreateMenu();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Login page functionality (separate from Shell page logic)
function waitForLoginElements() {
  const usernameField = document.querySelector('#loginEdit-el');
  const passwordField = document.querySelector('#passwordEdit-el');
  const loginButton = document.querySelector('.login-button-login');

  if (usernameField && passwordField && loginButton) {
    const autoLoginButton = document.createElement('button');
    autoLoginButton.textContent = 'LOGIN AS SUPERVISOR';
    autoLoginButton.className = 'auto-login-button btn';
    
    // Copy dimensions from the original button
    autoLoginButton.style.width = loginButton.offsetWidth + 'px';
    autoLoginButton.style.height = loginButton.offsetHeight + 'px';
    autoLoginButton.style.fontSize = window.getComputedStyle(loginButton).fontSize;
    autoLoginButton.style.padding = window.getComputedStyle(loginButton).padding;

    autoLoginButton.addEventListener('click', () => {
      usernameField.value = 'Supervisor';
      passwordField.value = 'Supervisor';
      loginButton.click();
    });

    const autoLoginRow = document.createElement('div');
    autoLoginRow.className = 'login-row';

    autoLoginRow.appendChild(autoLoginButton);

    const passwordFieldRow = document.querySelector('#passwordEdit-wrap').parentElement;
    passwordFieldRow.parentElement.appendChild(autoLoginRow);
    
    console.log('Login form elements found and auto login button added');
  } else {
    setTimeout(waitForLoginElements, 500);
  }
}

waitForLoginElements();
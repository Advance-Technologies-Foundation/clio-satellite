// Ensure the styles.css file is included in the content script
const styleLink = document.createElement('link');
styleLink.rel = 'stylesheet';
styleLink.href = chrome.runtime.getURL('styles.css');
document.head.appendChild(styleLink);

// Global flag to track if menu is already created
let menuCreated = false;

// Function to create the scripts menu directly from content script
function createScriptsMenu() {
  console.log("Creating scripts menu");
  
  // Prevent duplicate menus
  if (menuCreated || document.querySelector('.scripts-menu-button')) {
    console.log("Menu already exists, skipping creation");
    return;
  }
  
  // Найдем элемент AppToolbarGlobalSearch для выравнивания
  const searchElement = document.querySelector('[id*="AppToolbarGlobalSearch"]') || 
                       document.querySelector('[class*="AppToolbarGlobalSearch"]') ||
                       document.querySelector('.global-search');
  
  // Позиция по умолчанию, если элемент поиска не найден
  let topPosition = '20px';
  
  // Если элемент поиска найден, используем его позицию
  if (searchElement) {
    const searchRect = searchElement.getBoundingClientRect();
    topPosition = searchRect.top + 'px';
    console.log(`Found search element, position: ${topPosition}`);
  }
  
  // Create the main menu button
  const menuButton = document.createElement('button');
  menuButton.className = 'scripts-menu-button';
  menuButton.style.position = 'fixed';
  menuButton.style.top = topPosition; // Используем позицию элемента поиска
  menuButton.style.left = '50%';
  menuButton.style.transform = 'translateX(-50%)';
  menuButton.style.zIndex = '9999';
  menuButton.style.backgroundColor = '#FF8C00'; // Оранжевый цвет
  menuButton.style.color = 'white';
  menuButton.style.border = 'none';
  menuButton.style.borderRadius = '4px';
  menuButton.style.padding = '10px 15px';
  menuButton.style.fontFamily = 'Montserrat, sans-serif';
  menuButton.style.fontWeight = '500';
  menuButton.style.cursor = 'pointer';
  menuButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  menuButton.style.display = 'flex';
  menuButton.style.alignItems = 'center';
  menuButton.style.justifyContent = 'center';
  
  // Добавляем иконку к кнопке
  const iconImg = document.createElement('img');
  iconImg.src = chrome.runtime.getURL('icon128.png');
  iconImg.style.width = '24px';
  iconImg.style.height = '24px';
  iconImg.style.marginRight = '8px';
  
  // Добавляем текст к кнопке
  const buttonText = document.createElement('span');
  buttonText.textContent = 'Scripts Menu';
  
  // Добавляем иконку и текст к кнопке
  menuButton.appendChild(iconImg);
  menuButton.appendChild(buttonText);

  // Create the dropdown menu container
  const menuContainer = document.createElement('div');
  menuContainer.className = 'scripts-menu-container';
  menuContainer.style.position = 'fixed';
  menuContainer.style.top = (parseFloat(topPosition) + 40) + 'px'; // Под кнопкой
  menuContainer.style.left = '50%';
  menuContainer.style.transform = 'translateX(-50%)';
  menuContainer.style.zIndex = '9999';
  menuContainer.style.backgroundColor = 'white';
  menuContainer.style.borderRadius = '4px';
  menuContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  menuContainer.style.display = 'none';
  menuContainer.style.flexDirection = 'column';
  menuContainer.style.width = '250px';
  menuContainer.style.maxHeight = '80vh';
  menuContainer.style.overflowY = 'auto';

  // Script descriptions in English
  const scriptDescriptions = {
    'Features': 'Open system features management page',
    'Install_package': 'Install packages and extensions',
    'Lookups': 'Open system lookups',
    'Process_library': 'Open process library',
    'Process_log': 'View process log',
    'SysSettings': 'System settings and parameters',
    'Users': 'Manage system users'
  };

  // Create menu items for each script
  const scriptFiles = [
    'Features.js', 
    'Install_package.js', 
    'Lookups.js', 
    'Process_library.js', 
    'Process_log.js', 
    'SysSettings.js', 
    'Users.js'
  ];

  scriptFiles.forEach(scriptFile => {
    const scriptName = scriptFile.replace('.js', '');
    
    // Create menu item
    const menuItem = document.createElement('div');
    menuItem.className = 'scripts-menu-item';
    menuItem.style.padding = '12px 15px';
    menuItem.style.borderBottom = '1px solid #eee';
    menuItem.style.cursor = 'pointer';
    menuItem.style.transition = 'background-color 0.2s';
    
    // Create title element
    const title = document.createElement('div');
    title.textContent = scriptName.replace('_', ' ');
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '5px';
    
    // Create description element
    const description = document.createElement('div');
    description.textContent = scriptDescriptions[scriptName] || 'Run script ' + scriptName;
    description.style.fontSize = '12px';
    description.style.color = '#666';
    
    // Add hover effect
    menuItem.addEventListener('mouseover', () => {
      menuItem.style.backgroundColor = '#f5f5f5';
    });
    
    menuItem.addEventListener('mouseout', () => {
      menuItem.style.backgroundColor = 'white';
    });
    
    // Add click event - directly send message to background script
    menuItem.addEventListener('click', () => {
      // Send message directly to background script
      chrome.runtime.sendMessage({
        action: 'executeScript',
        scriptName: scriptFile
      }, response => {
        console.log('Message sent to background script');
      });
      
      // Hide menu after click
      menuContainer.style.display = 'none';
    });
    
    // Append elements
    menuItem.appendChild(title);
    menuItem.appendChild(description);
    menuContainer.appendChild(menuItem);
  });

  // Toggle menu display when button is clicked
  menuButton.addEventListener('click', () => {
    if (menuContainer.style.display === 'none') {
      menuContainer.style.display = 'flex';
    } else {
      menuContainer.style.display = 'none';
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', (event) => {
    if (!menuButton.contains(event.target) && !menuContainer.contains(event.target)) {
      menuContainer.style.display = 'none';
    }
  });

  // Use a try-catch block to handle potential issues with DOM manipulation
  try {
    // Append menu elements to the document
    document.body.appendChild(menuButton);
    document.body.appendChild(menuContainer);
    console.log("Scripts menu created successfully");
    menuCreated = true;
  } catch (error) {
    console.error("Error appending menu elements:", error);
    menuCreated = false;
  }
}

// Функция, которая ищет элемент поиска и обновляет позицию кнопки скриптов
function updateMenuPosition() {
  const menuButton = document.querySelector('.scripts-menu-button');
  const menuContainer = document.querySelector('.scripts-menu-container');
  
  if (!menuButton || !menuContainer) return;
  
  const searchElement = document.querySelector('[id*="AppToolbarGlobalSearch"]') || 
                       document.querySelector('[class*="AppToolbarGlobalSearch"]') ||
                       document.querySelector('.global-search');
  
  if (searchElement) {
    const searchRect = searchElement.getBoundingClientRect();
    menuButton.style.top = searchRect.top + 'px';
    menuContainer.style.top = (searchRect.top + 40) + 'px';
    console.log(`Updated menu position to match search element: ${searchRect.top}px`);
  }
}

// Function to check if current page is the Shell page
function isShellPage() {
  // Check for various indicators that this is the Shell page
  const shellIndicators = [
    document.getElementById('ShellContainerWithBackground'),
    document.querySelector('mainshell'),
    document.querySelector('crt-schema-outlet'),
    document.querySelector('.app-background'),
    document.querySelector('crt-reusable-schema'),
    document.querySelector('crt-page'),
    document.querySelector('[id*="shell" i]'),
    document.querySelector('[id*="Shell" i]'),
    document.querySelector('[class*="shell" i]'),
    document.querySelector('[class*="Shell" i]')
  ];
  
  return shellIndicators.some(indicator => indicator);
}

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
  
  // Добавляем небольшую задержку, чтобы дать время элементам загрузиться
  setTimeout(updateMenuPosition, 2000);
});

// Наблюдаем за изменениями в DOM и обновляем позицию меню
const positionObserver = new MutationObserver(() => {
  updateMenuPosition();
});

// Добавим observer для отслеживания изменений в DOM и обновления позиции меню
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
  
  // Check if any meaningful DOM changes happened
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

// Start observing DOM changes
observer.observe(document.body, { childList: true, subtree: true });

// Login page functionality (separate from Shell page logic)
function waitForLoginElements() {
  const usernameField = document.querySelector('#loginEdit-el');
  const passwordField = document.querySelector('#passwordEdit-el');
  const loginButton = document.querySelector('.login-button-login');

  if (usernameField && passwordField && loginButton) {
    // Create a new button
    const autoLoginButton = document.createElement('button');
    autoLoginButton.textContent = 'LOGIN AS SUPERVISOR';
    // Ensure the text color of the auto-login button is white by applying a CSS class
    autoLoginButton.classList.add('auto-login-button');
    // Apply the specified CSS class to the auto-login button
    autoLoginButton.classList.add('btn');
    //autoLoginButton.style.marginLeft = '10px';
    // Adjust the auto-login button to match the size of the login button and position it below
    autoLoginButton.style.cssText = loginButton.style.cssText;
    autoLoginButton.style.backgroundColor = 'red';
    autoLoginButton.style.display = 'block';
    autoLoginButton.style.color = 'white';

    // Ensure the auto-login button matches the exact size and style of the login button
    autoLoginButton.style.width = loginButton.offsetWidth + 'px';
    autoLoginButton.style.height = loginButton.offsetHeight + 'px';
    autoLoginButton.style.fontSize = window.getComputedStyle(loginButton).fontSize;
    autoLoginButton.style.padding = window.getComputedStyle(loginButton).padding;
    autoLoginButton.style.border = window.getComputedStyle(loginButton).border;

    // Ensure the styles are applied inline to the auto-login button
    autoLoginButton.style.fontFamily = 'Montserrat, sans-serif';
    autoLoginButton.style.fontWeight = '500';
    autoLoginButton.style.color = '#ffffff';
    autoLoginButton.style.borderRadius = '4px';
    autoLoginButton.style.border = 'none';
    //autoLoginButton.style.height = '40px';
    //autoLoginButton.style.width = '160px';
    autoLoginButton.style.marginLeft = 'auto';
    autoLoginButton.style.marginRight = 'auto';

    // Add click event to the button
    autoLoginButton.addEventListener('click', () => {
      usernameField.value = 'Supervisor'; // Replace with your username
      passwordField.value = 'Supervisor'; // Replace with your password
      loginButton.click();
    });

    // Create a new row for the auto-login button
    const autoLoginRow = document.createElement('div');
    autoLoginRow.className = 'login-row';

    // Append the button to the new row
    autoLoginRow.appendChild(autoLoginButton);

    // Append the new row below the password field
    const passwordFieldRow = document.querySelector('#passwordEdit-wrap').parentElement;
    passwordFieldRow.parentElement.appendChild(autoLoginRow);
    
    console.log("Login form elements found and auto login button added");
  } else {
    // Retry after a short delay if elements are not yet available
    setTimeout(waitForLoginElements, 500);
  }
}

// Start the login form process (separate from Shell detection logic)
waitForLoginElements();
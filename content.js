// Global flag to track if menu is already created
let menuCreated = false;

// Function to check if current page is the Shell page of Creatio
function isShellPage() {
  // Сначала проверяем URL - активируем плагин только на доменах, связанных с Creatio
  const currentHost = window.location.hostname;
  
  // Список доменов, на которых НЕ должен работать плагин
  const excludedDomains = [
    'gitlab.com', 
    'github.com',
    'bitbucket.org',
    'google.com',
    'mail.google.com',
    'youtube.com'
  ];
  
  // Если текущий домен в списке исключений, не активируем плагин
  for (const domain of excludedDomains) {
    if (currentHost.includes(domain)) {
      console.log(`Domain ${currentHost} is in the exclusion list. Skipping activation.`);
      return false;
    }
  }
  
  // Дополнительные признаки Creatio, которые помогут точнее определить платформу
  const creatioIndicators = [
    // Элементы Shell
    document.getElementById('ShellContainerWithBackground'),
    document.querySelector('mainshell'),
    document.querySelector('crt-schema-outlet'),
    
    // Дополнительные специфичные элементы Creatio
    document.querySelector('[data-item-marker="AppToolbarGlobalSearch"]'),
    document.querySelector('crt-app-toolbar'),
    document.querySelector('.creatio-logo'),
    document.querySelector('[id*="Terrasoft"]'),
    document.querySelector('[class*="Terrasoft"]'),
    
    // Проверка наличия конкретных скриптов и стилей Creatio
    document.querySelector('script[src*="creatio"]'),
    document.querySelector('script[src*="terrasoft"]'),
    document.querySelector('link[href*="creatio"]'),
    document.querySelector('link[href*="terrasoft"]')
  ];
  
  // Устанавливаем минимальное количество индикаторов
  const MIN_INDICATORS = 2; // Требуем хотя бы два совпадения для большей уверенности
  
  // Подсчитываем количество найденных индикаторов
  const foundIndicators = creatioIndicators.filter(indicator => indicator);
  
  // Если найдено достаточное количество признаков Creatio, считаем что мы на нужной странице
  const isCreatio = foundIndicators.length >= MIN_INDICATORS;
  
  if (!isCreatio) {
    console.log(`Not enough Creatio indicators found (${foundIndicators.length}/${MIN_INDICATORS}). Skipping activation.`);
  } else {
    console.log(`Found ${foundIndicators.length} Creatio indicators. Activating plugin.`);
  }
  
  return isCreatio;
}

// Функция для загрузки стилей CSS
function loadStyles() {
  // Проверяем, не загружены ли уже стили
  if (document.querySelector('link[href*="styles.css"]')) {
    console.log("Styles already loaded");
    return;
  }
  
  // Загружаем стили
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = chrome.runtime.getURL('styles.css');
  document.head.appendChild(styleLink);
  console.log("Styles loaded");
}

// Function to create the scripts menu directly from content script
function createScriptsMenu() {
  console.log("Creating scripts menu");
  
  // Загружаем стили перед созданием меню
  loadStyles();
  
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
  menuButton.className = 'scripts-menu-button mat-flat-button mat-primary';
  menuButton.style.position = 'fixed';
  menuButton.style.top = topPosition; // Используем позицию элемента поиска
  menuButton.style.left = '50%';
  menuButton.style.transform = 'translateX(-50%)';
  menuButton.style.zIndex = '9999';
  // Удаляем встроенные стили, которые будут переопределены классами mat-flat-button.mat-primary
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
  buttonText.textContent = 'Clio Satelite : Try me!';
  
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
    'Application_Managment': 'Application managment (App Hub)',
    'Lookups': 'Open system lookups',
    'Process_library': 'Open process library',
    'Process_log': 'View process log',
    'SysSettings': 'System settings and parameters',
    'Users': 'Manage system users',
    'Configuration':'Open configuration'
  };

  // Create menu items for each script
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
    
    // Определяем иконки для каждого пункта меню
    const menuIcons = {
      'Features': '⚙️', // шестеренка для функций
      'Application_Managment': '🔧', // гаечный ключ для управления приложением
      'Lookups': '🔍', // лупа для поиска
      'Process_library': '📚', // книги для библиотеки процессов
      'Process_log': '📋', // список для логов процессов
      'SysSettings': '⚙️', // шестеренка для системных настроек
      'Users': '👥',  // люди для управления пользователями
      'Configuration': '⚙️' // шестеренка для конфигурации
    };
    
    // Create menu item
    const menuItem = document.createElement('div');
    menuItem.className = 'scripts-menu-item';
    menuItem.style.padding = '12px 15px';
    menuItem.style.borderBottom = '1px solid #eee';
    menuItem.style.cursor = 'pointer';
    menuItem.style.transition = 'background-color 0.2s';
    menuItem.style.display = 'flex';
    menuItem.style.alignItems = 'center';
    
    // Создаем элемент для иконки
    const iconElement = document.createElement('span');
    iconElement.textContent = menuIcons[scriptName] || '📄'; // Если иконка не найдена, используем документ
    iconElement.style.marginRight = '10px';
    iconElement.style.fontSize = '20px';
    
    // Создаем контейнер для текста
    const textContainer = document.createElement('div');
    textContainer.style.flex = '1';
    
    // Create title element
    const title = document.createElement('div');
    title.textContent = scriptName.replace('_', ' ');
    title.style.fontWeight = '500';
    title.style.marginBottom = '5px';
    title.style.fontFamily = 'Roboto, "Helvetica Neue", sans-serif'; // Соответствует шрифту кнопки
    title.style.fontSize = '14px';
    
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
    textContainer.appendChild(title);
    textContainer.appendChild(description);
    menuItem.appendChild(iconElement);
    menuItem.appendChild(textContainer);
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
    // Сначала пробуем найти элемент поиска по data-item-marker
    const searchElement = document.querySelector('[data-item-marker="AppToolbarGlobalSearch"]');
    
    if (searchElement && searchElement.parentElement) {
      // Если найден элемент поиска, добавляем кнопку в его родительский элемент сразу после него
      const searchParent = searchElement.parentElement;
      searchElement.insertAdjacentElement('afterend', menuButton);
      
      // Обновляем стили кнопки для размещения рядом с полем поиска
      menuButton.style.position = 'relative';
      menuButton.style.top = 'auto';
      menuButton.style.left = 'auto';
      menuButton.style.transform = 'none';
      menuButton.style.margin = '0 5px';
      menuButton.style.height = 'auto';
      
      console.log("Button placed next to search element on initial creation");
    }
    // Если элемент поиска не найден, используем логику добавления в toolbar
    else {
      // Ищем toolbar для вставки кнопки
      const appToolbar = document.querySelector('crt-app-toolbar');
      
      if (appToolbar) {
        // Если toolbar найден, вставляем кнопку в него
        appToolbar.appendChild(menuButton);
        console.log("Button inserted into crt-app-toolbar");
        
        // Создаем контейнер для центрирования кнопки внутри toolbar
        const centerContainer = document.createElement('div');
        centerContainer.style.width = '100%';
        centerContainer.style.display = 'flex';
        centerContainer.style.justifyContent = 'center';
        centerContainer.style.position = 'absolute';
        centerContainer.style.left = '0';
        centerContainer.style.top = '0';
        centerContainer.style.height = '100%';
        centerContainer.style.pointerEvents = 'none'; // Чтобы элемент не блокировал клики
        centerContainer.style.zIndex = '1'; // Чтобы был ниже, чем другие элементы toolbar
        
        // Перемещаем кнопку внутрь контейнера для центрирования
        menuButton.remove(); // Убираем кнопку из toolbar
        centerContainer.appendChild(menuButton);
        appToolbar.appendChild(centerContainer);
        
        // Обновляем стили кнопки
        menuButton.style.position = 'relative';
        menuButton.style.top = 'auto';
        menuButton.style.left = 'auto';
        menuButton.style.transform = 'none';
        menuButton.style.pointerEvents = 'auto'; // Возвращаем возможность кликать
        menuButton.style.margin = 'auto'; // Центрируем по вертикали
      } else {
        // Если toolbar не найден, добавляем кнопку в body как раньше
        document.body.appendChild(menuButton);
        console.log("crt-app-toolbar not found, button added to body");
      }
    }
    
    // Добавляем контейнер меню в body в любом случае
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
  
  // Проверяем, находится ли кнопка внутри app-toolbar
  const isInToolbar = !!menuButton.closest('crt-app-toolbar');
  
  // Если кнопка уже в тулбаре, обновляем только позицию выпадающего меню
  if (isInToolbar) {
    // Обновляем позицию контейнера меню относительно центра экрана
    const buttonRect = menuButton.getBoundingClientRect();
    menuContainer.style.top = (buttonRect.bottom + 5) + 'px';
    menuContainer.style.left = '50%'; // По центру экрана
    menuContainer.style.transform = 'translateX(-50%)'; // Смещаем на половину своей ширины влево
    return;
  }
  
  // Если кнопка не в тулбаре, используем старую логику
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

// Функция для перемещения кнопки в toolbar, если он появился
function moveButtonToToolbar() {
  const menuButton = document.querySelector('.scripts-menu-button');
  const menuContainer = document.querySelector('.scripts-menu-container');
  
  if (!menuButton) return false; // Кнопка еще не создана
  
  // Проверяем, находится ли кнопка уже в toolbar или в контейнере центрирования
  const isInToolbar = !!menuButton.closest('crt-app-toolbar');
  if (isInToolbar) return true; // Кнопка уже в toolbar, ничего делать не нужно
  
  // Ищем toolbar
  const appToolbar = document.querySelector('crt-app-toolbar');
  if (!appToolbar) return false; // Toolbar еще не появился
  
  // Создаем контейнер для центрирования кнопки внутри toolbar
  const centerContainer = document.createElement('div');
  centerContainer.style.width = '100%';
  centerContainer.style.display = 'flex';
  centerContainer.style.justifyContent = 'center';
  centerContainer.style.position = 'absolute';
  centerContainer.style.left = '0';
  centerContainer.style.top = '0';
  centerContainer.style.height = '100%';
  centerContainer.style.pointerEvents = 'none'; // Чтобы элемент не блокировал клики
  centerContainer.style.zIndex = '1'; // Чтобы был ниже, чем другие элементы toolbar
  
  // Перемещаем кнопку в центрирующий контейнер
  menuButton.remove(); // Удаляем кнопку из текущего родителя
  centerContainer.appendChild(menuButton);
  appToolbar.appendChild(centerContainer);
  
  // Обновляем стили кнопки
  menuButton.style.position = 'relative';
  menuButton.style.top = 'auto';
  menuButton.style.left = 'auto';
  menuButton.style.transform = 'none';
  menuButton.style.pointerEvents = 'auto'; // Возвращаем возможность кликать
  menuButton.style.margin = 'auto'; // Центрируем по вертикали
  
  // Обновляем позицию выпадающего меню
  if (menuContainer) {
    const buttonRect = menuButton.getBoundingClientRect();
    menuContainer.style.top = (buttonRect.bottom + 5) + 'px';
    menuContainer.style.left = '50%';
    menuContainer.style.transform = 'translateX(-50%)';
  }
  
  console.log("Button moved to crt-app-toolbar and centered");
  return true; // Успешно переместили кнопку
}

// Функция для размещения кнопки рядом с полем поиска
function placeButtonNextToSearch() {
  const menuButton = document.querySelector('.scripts-menu-button');
  const menuContainer = document.querySelector('.scripts-menu-container');
  
  if (!menuButton) return false; // Кнопка еще не создана
  
  // Ищем элемент поиска по data-item-marker
  const searchElement = document.querySelector('[data-item-marker="AppToolbarGlobalSearch"]');
  if (!searchElement) return false; // Элемент поиска не найден
  
  // Нам нужен родительский элемент для элемента поиска
  const searchParent = searchElement.parentElement;
  if (!searchParent) return false; // Родительский элемент не найден
  
  // Проверяем, находится ли кнопка уже в правильном месте
  if (menuButton.parentElement === searchParent && 
      menuButton.nextSibling && 
      menuButton.previousSibling === searchElement) {
    return true; // Кнопка уже находится в нужном месте
  }
  
  console.log("Moving button next to search element");
  
  // Удаляем контейнер центрирования, если он существует
  const centerContainer = menuButton.parentElement;
  if (centerContainer && centerContainer !== searchParent) {
    menuButton.remove(); // Удаляем кнопку из текущего контейнера
  }
  
  // Обновляем стили кнопки для размещения рядом с полем поиска
  menuButton.style.position = 'relative';
  menuButton.style.top = 'auto';
  menuButton.style.left = 'auto';
  menuButton.style.transform = 'none';
  menuButton.style.margin = '0 5px';
  menuButton.style.height = 'auto';
  
  // Вставляем кнопку после элемента поиска в том же родительском элементе
  searchElement.insertAdjacentElement('afterend', menuButton);
  
  // Обновляем позицию выпадающего меню
  if (menuContainer) {
    const buttonRect = menuButton.getBoundingClientRect();
    menuContainer.style.top = (buttonRect.bottom + 5) + 'px';
    menuContainer.style.left = buttonRect.left + 'px';
    menuContainer.style.transform = 'none';
  }
  
  console.log("Button placed next to search element");
  return true;
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
  // Пробуем разместить кнопку рядом с полем поиска
  if (placeButtonNextToSearch()) {
    // Если удалось разместить кнопку рядом с полем поиска, выходим
    return;
  }
  
  // Если не удалось разместить кнопку рядом с полем поиска, используем старую логику
  updateMenuPosition();
  moveButtonToToolbar();
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
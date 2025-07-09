// Scripts menu functionality for the Shell page
function createScriptsMenu() {
  console.log("Attempting to create scripts menu");
  
  // Check if menu already exists to avoid duplicates
  if (document.querySelector('.scripts-menu-button')) {
    console.log("Scripts menu button already exists, skipping creation");
    return true;
  }
  
  // Check if we're on the Shell page by looking for any of these unique elements
  const shellPageIndicators = [
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
  
  // If any indicator is found, create the menu
  if (shellPageIndicators.some(indicator => indicator)) {
    console.log("Shell page indicator found, creating scripts menu");
    
    // Create the main menu button
    const menuButton = document.createElement('button');
    menuButton.textContent = 'Scripts Menu';
    menuButton.className = 'scripts-menu-button';
    menuButton.style.position = 'fixed';
    menuButton.style.top = '20px';
    menuButton.style.right = '20px';
    menuButton.style.zIndex = '9999';
    menuButton.style.backgroundColor = '#0066cc';
    menuButton.style.color = 'white';
    menuButton.style.border = 'none';
    menuButton.style.borderRadius = '4px';
    menuButton.style.padding = '10px 15px';
    menuButton.style.fontFamily = 'Montserrat, sans-serif';
    menuButton.style.fontWeight = '500';
    menuButton.style.cursor = 'pointer';
    menuButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

    // Create menu container
    const menuContainer = document.createElement('div');
    menuContainer.className = 'scripts-menu-container';
    menuContainer.style.display = 'none';
    menuContainer.style.position = 'fixed';
    menuContainer.style.top = '60px';
    menuContainer.style.right = '20px';
    menuContainer.style.backgroundColor = 'white';
    menuContainer.style.border = '1px solid #ccc';
    menuContainer.style.borderRadius = '4px';
    menuContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    menuContainer.style.zIndex = '9998';
    menuContainer.style.minWidth = '200px';
    menuContainer.style.maxWidth = '300px';
    menuContainer.style.flexDirection = 'column';
    menuContainer.tabIndex = -1; // Make focusable but not in tab order
    menuContainer.setAttribute('role', 'menu'); // Accessibility

    // Script descriptions in English
    const scriptDescriptions = {
      'Features': 'Open system features management page',
      'Application_Managment': 'Application manmagment (App Hub)',
      'Lookups': 'Open system lookups',
      'Process_library': 'Open process library',
      'Process_log': 'View process log',
      'SysSettings': 'System settings and parameters',
      'Users': 'Manage system users'
    };

    // Create menu items for each script
    const scriptFiles = [
      'Features.js', 
      'Application_Managment.js', 
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
      menuItem.tabIndex = 0; // Make focusable
      menuItem.setAttribute('role', 'menuitem'); // Accessibility
      
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
      
      // Add hover and focus effects
      menuItem.addEventListener('mouseover', () => {
        menuItem.style.backgroundColor = '#f5f5f5';
      });
      
      menuItem.addEventListener('mouseout', () => {
        menuItem.style.backgroundColor = 'white';
      });

      menuItem.addEventListener('focus', () => {
        menuItem.style.backgroundColor = '#f5f5f5';
      });

      menuItem.addEventListener('blur', () => {
        menuItem.style.backgroundColor = 'white';
      });
      
      // Add click and keyboard event
      const executeScript = () => {
        // Use a custom event to communicate with content script instead of chrome.runtime API
        const customEvent = new CustomEvent('executeScript', {
          detail: {
            scriptName: 'navigation/' + scriptFile
          }
        });
        document.dispatchEvent(customEvent);
        
        // Hide menu after click
        menuContainer.style.display = 'none';
      };

      menuItem.addEventListener('click', executeScript);
      
      menuItem.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          executeScript();
        }
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

    // Close menu when button loses focus
    menuButton.addEventListener('blur', () => {
      // Delay hiding to allow click on menu items
      setTimeout(() => {
        if (!menuContainer.contains(document.activeElement)) {
          menuContainer.style.display = 'none';
        }
      }, 150);
    });

    // Close menu when container loses focus
    menuContainer.addEventListener('focusout', (event) => {
      // Check if focus moved outside the menu container
      if (!menuContainer.contains(event.relatedTarget) && !menuButton.contains(event.relatedTarget)) {
        menuContainer.style.display = 'none';
      }
    });

    // Make menu items focusable for keyboard navigation
    menuContainer.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        menuContainer.style.display = 'none';
        menuButton.focus();
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
      return true;
    } catch (error) {
      console.error("Error appending menu elements:", error);
      return false;
    }
  } else {
    console.log("No Shell page indicators found");
    return false;
  }
}

// Initialize menu when on Shell page
function initScriptsMenu() {
  console.log("Initializing scripts menu");
  
  // Try to create menu immediately
  if (createScriptsMenu()) {
    console.log("Scripts menu created on first attempt");
    return;
  }
  
  // If document is still loading, try when DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      console.log("DOM content loaded, trying again to create scripts menu");
      createScriptsMenu();
    });
  }
  
  // Try again when window is fully loaded
  window.addEventListener('load', function() {
    console.log("Window fully loaded, trying again to create scripts menu");
    createScriptsMenu();
  });
  
  // Also try with intervals to catch async DOM updates
  let attempts = 0;
  const maxAttempts = 20;
  const checkInterval = setInterval(function() {
    attempts++;
    console.log(`Attempt ${attempts}/${maxAttempts} to create scripts menu`);
    
    if (createScriptsMenu()) {
      console.log(`Scripts menu created on attempt ${attempts}`);
      clearInterval(checkInterval);
    } else if (attempts >= maxAttempts) {
      console.log("Maximum attempts reached, giving up");
      clearInterval(checkInterval);
    }
  }, 500);
}

// Export the init function
window.initScriptsMenu = initScriptsMenu;

// Try to initialize immediately
console.log("Executing scriptsMenu.js");
initScriptsMenu();
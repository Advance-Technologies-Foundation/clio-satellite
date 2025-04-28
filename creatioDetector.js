/**
 * Creatio page detection module
 * Contains functions for detecting Creatio-specific elements on the page
 */

/**
 * Initialize the detection functions and make them available globally
 */
function initCreatioDetector() {
  // Expose functions to window object to make them globally available
  window.isCreatioPage = isCreatioPage;
  window.isShellPage = isShellPage;
  window.isLoginPage = isLoginPage;
  
  console.log('Creatio detector initialized');
  
  // Set up a mutation observer to detect page changes
  setupPageChangeDetector();
}

/**
 * Gets a list of indicators that suggest the page is a Creatio application
 * @returns {Array} Array of found Creatio indicator elements
 */
function getCreatioIndicators() {
  return [
    document.getElementById('ShellContainerWithBackground'),
    document.querySelector('mainshell'),
    document.querySelector('crt-schema-outlet'),
    document.querySelector('[data-item-marker="AppToolbarGlobalSearch"]'),
    document.querySelector('crt-app-toolbar')
  ];
}

/**
 * Checks if the current page has the minimum required Creatio indicators
 * @returns {boolean} True if the page is a Creatio application, otherwise False
 */
function isCreatioPage() {
  // First check if the domain is excluded
  if (typeof isExcludedDomain === 'function' && isExcludedDomain()) {
    console.log('[DETECTOR] Domain is in exclusion list, not a Creatio page');
    return false;
  }

  // Check for presence of crt-root or creatio-root elements
  const crtRootElement = document.querySelector('crt-root');
  const creatioRootElement = document.querySelector('creatio-root');
  
  console.log('[DETECTOR] DOM check results:', {
    url: window.location.href,
    domain: window.location.hostname,
    crtRootFound: !!crtRootElement,
    creatioRootFound: !!creatioRootElement
  });

  if (crtRootElement || creatioRootElement) {
    console.log('[DETECTOR] Creatio root element found in DOM. Activating plugin.', 
      crtRootElement ? 'crt-root found' : 'creatio-root found');
    return true;
  }
  
  // If root elements are not found, we return false
  console.log('[DETECTOR] Creatio root elements NOT found in DOM. Skipping activation.');
  return false;
}

/**
 * Checks if the current page is a Creatio Shell page
 * Shell page is the main interface of the system with toolbar and menu
 * @returns {boolean} True if the page is a Creatio Shell page, otherwise False
 */
function isShellPage() {
  // Check for Creatio indicators first
  if (!isCreatioPage()) {
    console.log('[DETECTOR] Not a Creatio page, so not a Shell page');
    return false;
  }

  // Additionally check for Shell-specific elements
  const appToolbar = document.querySelector('crt-app-toolbar');
  const shellContainer = document.getElementById('ShellContainerWithBackground');
  const mainShell = document.querySelector('mainshell');
  
  const shellSpecificIndicators = [appToolbar, shellContainer, mainShell];
  const hasShellIndicator = shellSpecificIndicators.some(indicator => indicator);
  
  console.log('[DETECTOR] Shell page check results:', {
    appToolbarFound: !!appToolbar,
    shellContainerFound: !!shellContainer,
    mainShellFound: !!mainShell,
    isShellPage: hasShellIndicator
  });
  
  if (hasShellIndicator) {
    console.log("[DETECTOR] Shell page indicators found - buttons will be shown");
  } else {
    console.log("[DETECTOR] This is a Creatio page, but not a Shell page");
  }
  
  return hasShellIndicator;
}

/**
 * Checks if the current page is a Creatio login page
 * @returns {boolean} True if the page is a login page, otherwise False
 */
function isLoginPage() {
  // Check for login form elements
  const loginIndicators = [
    document.querySelector('#loginEdit-el'),
    document.querySelector('#passwordEdit-el'),
    document.querySelector('.login-button-login'),
    document.querySelector('.login-page'),
    document.querySelector('[data-item-marker="LoginPageView"]')
  ];
  
  const foundLoginIndicators = loginIndicators.filter(indicator => indicator);
  const isLogin = foundLoginIndicators.length >= 2;
  
  if (isLogin) {
    console.log("Login page detected");
  }
  
  return isLogin;
}

/**
 * Sets up a mutation observer to detect page changes
 * This is useful for SPA (Single Page Applications) like Creatio
 * where page content can change without a full page reload
 */
function setupPageChangeDetector() {
  // Create a mutation observer to watch for DOM changes
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    
    for (const mutation of mutations) {
      // Check if the mutation added nodes that could be relevant
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // If significant elements are added, trigger a check
            if (node.tagName === 'CRT-APP-TOOLBAR' ||
                node.tagName === 'CRT-ROOT' ||
                node.tagName === 'CREATIO-ROOT' ||
                node.id === 'ShellContainerWithBackground' ||
                node.querySelector('#loginEdit-el')) {
              shouldCheck = true;
              break;
            }
          }
        }
      }
      
      if (shouldCheck) break;
    }
    
    if (shouldCheck) {
      console.log('Significant DOM changes detected, rechecking page type');
      
      // Give the DOM time to fully update
      setTimeout(() => {
        const isCreatio = isCreatioPage();
        const isLogin = isLoginPage();
        
        // Dispatch a custom event that content.js can listen for
        window.dispatchEvent(new CustomEvent('creatioPageStateChanged', {
          detail: {
            isCreatio,
            isLogin,
            isShell: isShellPage()
          }
        }));
      }, 500);
    }
  });
  
  // Start observing the document with the configured parameters
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  console.log('Page change detector set up');
}

// Initialize globally available detection functions
window.initCreatioDetector = initCreatioDetector;
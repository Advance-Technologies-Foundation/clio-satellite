/**
 * Creatio page detection module
 * Contains functions for detecting Creatio-specific elements on the page
 */

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
    document.querySelector('crt-app-toolbar'),
    document.querySelector('.creatio-logo'),
    document.querySelector('[id*="Terrasoft"]'),
    document.querySelector('[class*="Terrasoft"]'),
    document.querySelector('script[src*="creatio"]'),
    document.querySelector('script[src*="terrasoft"]'),
    document.querySelector('link[href*="creatio"]'),
    document.querySelector('link[href*="terrasoft"]')
  ];
}

/**
 * Checks if the current page has the minimum required Creatio indicators
 * @returns {boolean} True if the page is a Creatio application, otherwise False
 */
function isCreatioPage() {
  // First check if the domain is excluded
  if (typeof isExcludedDomain === 'function' && isExcludedDomain()) {
    return false;
  }

  const creatioIndicators = getCreatioIndicators();
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

/**
 * Checks if the current page is a Creatio Shell page
 * Shell page is the main interface of the system with toolbar and menu
 * @returns {boolean} True if the page is a Creatio Shell page, otherwise False
 */
function isShellPage() {
  // Check for Creatio indicators first
  if (!isCreatioPage()) {
    return false;
  }

  // Additionally check for Shell-specific elements
  const shellSpecificIndicators = [
    document.querySelector('crt-app-toolbar'),
    document.getElementById('ShellContainerWithBackground'),
    document.querySelector('mainshell')
  ];

  const hasShellIndicator = shellSpecificIndicators.some(indicator => indicator);
  
  if (hasShellIndicator) {
    console.log("Shell page indicators found");
  } else {
    console.log("This is a Creatio page, but not a Shell page");
  }
  
  return hasShellIndicator;
}

/**
 * Checks if the current page is a Creatio login page
 * @returns {boolean} True if the page is a login page, otherwise False
 */
function isLoginPage() {
  // Check for login form elements
  const usernameField = document.querySelector('#loginEdit-el');
  const passwordField = document.querySelector('#passwordEdit-el');
  const loginButton = document.querySelector('.login-button-login');
  
  const isLogin = !!(usernameField && passwordField && loginButton);
  
  if (isLogin) {
    console.log("Login page detected");
  }
  
  return isLogin;
}

// Export functions for use in other files
window.isCreatioPage = isCreatioPage;
window.isShellPage = isShellPage;
window.isLoginPage = isLoginPage;
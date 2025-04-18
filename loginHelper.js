/**
 * Login helper module
 * Adds helper elements to the login page for quick system access with Supervisor account
 */

/**
 * Waits for login form elements to load and adds a button for Supervisor login
 * @returns {boolean} False if domain is excluded, otherwise no return value
 */
function waitForLoginElements() {
  // First check if domain is excluded
  if (typeof isExcludedDomain === 'function' && isExcludedDomain()) {
    console.log("Domain is in exclusion list, not adding login helper button");
    return false;
  }

  const usernameField = document.querySelector('#loginEdit-el');
  const passwordField = document.querySelector('#passwordEdit-el');
  const loginButton = document.querySelector('.login-button-login');

  if (usernameField && passwordField && loginButton) {
    const autoLoginButton = document.createElement('button');
    autoLoginButton.textContent = 'LOGIN AS SUPERVISOR';
    autoLoginButton.className = 'auto-login-button btn';
    
    // Copy only dynamic attributes that can't be extracted to CSS
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
    
    console.log("Login form elements found and auto login button added");
  } else {
    // If form elements aren't loaded yet, try again in 500ms
    setTimeout(waitForLoginElements, 500);
  }
}

/**
 * Initializes the login helper functionality
 */
function initLoginHelper() {
  console.log("Initializing login helper");
  waitForLoginElements();
}

// Export function for use in other files
window.initLoginHelper = initLoginHelper;

// Automatically start initialization
initLoginHelper();
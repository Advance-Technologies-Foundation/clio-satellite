// Ensure the styles.css file is included in the content script
const styleLink = document.createElement('link');
styleLink.rel = 'stylesheet';
styleLink.href = chrome.runtime.getURL('styles.css');
document.head.appendChild(styleLink);

// Wait for the DOM to load
function waitForElements() {
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
  } else {
    // Retry after a short delay if elements are not yet available
    setTimeout(waitForElements, 500);
  }
}

// Start the process
waitForElements();
/**
 * Login page functionality for Creatio
 * This script adds a login profile selector dropdown to the login page
 */

// Function to wait for login form elements and add login profile selector
(function waitForLoginElements() {
  // Find login form elements
  const usernameField = document.querySelector('#loginEdit-el');
  const passwordField = document.querySelector('#passwordEdit-el');
  const loginButton = document.querySelector('.login-button-login');

  if (usernameField && passwordField && loginButton) {
    // Create login profiles container
    const loginProfilesContainer = document.createElement('div');
    loginProfilesContainer.className = 'creatio-satelite-login-profiles-container';
    
    // Create dropdown select element
    const profileSelect = document.createElement('select');
    profileSelect.className = 'creatio-satelite-login-profile-select';
    profileSelect.style.width = loginButton.offsetWidth + 'px';
    
    // Define available login profiles
    const profiles = [
      { label: '-- Select login profile --', username: '', password: '' },
      { label: 'Supervisor', username: 'Supervisor', password: 'Supervisor' },
      { label: 'User_001', username: 'User_001', password: 'Password' },
      { label: 'Administrator_001', username: 'Administrator_001', password: 'Password' }
    ];
    
    // Add profile options to the dropdown
    profiles.forEach(profile => {
      const option = document.createElement('option');
      option.value = profile.username;
      option.textContent = profile.label;
      option.dataset.username = profile.username;
      option.dataset.password = profile.password;
      profileSelect.appendChild(option);
    });

    // Add change event handler to execute login when a profile is selected
    profileSelect.addEventListener('change', () => {
      const selectedOption = profileSelect.options[profileSelect.selectedIndex];
      const username = selectedOption.dataset.username;
      const password = selectedOption.dataset.password;
      
      if (username && password) {
        // Fill credentials and submit login form
        usernameField.focus();
        usernameField.value = username;
        passwordField.focus();
        passwordField.value = password;
        loginButton.click();
      }
    });
    
    // Add caption text
    const loginCaption = document.createElement('div');
    loginCaption.className = 'creatio-satelite-login-caption';
    loginCaption.textContent = 'Login as';
    
    // Append elements to container
    loginProfilesContainer.appendChild(loginCaption);
    loginProfilesContainer.appendChild(profileSelect);
    loginCaption.style.fontSize = window.getComputedStyle(loginButton).fontSize;
    profileSelect.style.fontSize = window.getComputedStyle(loginButton).fontSize;

    // Insert container into the login form
    const passwordFieldRow = document.querySelector('#passwordEdit-wrap').parentElement;
    passwordFieldRow.parentElement.appendChild(loginProfilesContainer);
    
    console.log('Login form elements found and profile selector added');
  } else {
    // If elements aren't found yet, try again after a delay
    setTimeout(waitForLoginElements, 500);
  }
})();

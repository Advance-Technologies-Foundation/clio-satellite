/**
 * Login page functionality for Creatio
 * This script adds a login profile selector dropdown to the login page
 */

// Function to wait for login form elements and add login profile selector
(function waitForLoginElements() {

  function addOption(parent, value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    parent.appendChild(option);
  }

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

    // Get current profiles and add the new one
    chrome.storage.sync.get({ userProfiles: [] }, (data) => {
      const profiles = data.userProfiles;
      if (profiles.length === 0) {
        // If no profiles are found, add a default option
        addOption(profileSelect, '', 'Setup user in options');
      }
      profiles.forEach(profile => {
        const option = document.createElement('option');
        option.value = profile.username;
        option.textContent = profile.username; // Display username in the dropdown
        option.dataset.username = profile.username;
        option.dataset.password = profile.password;
        profileSelect.appendChild(option);
      });
    });

    // Add caption text
    const loginCaption = document.createElement('button');
    loginCaption.classList.add('creatio-satelite');
    loginCaption.classList.add('auto-login-button');
    loginCaption.textContent = 'Log in as:';
    loginCaption.style.width = loginButton.offsetWidth + 'px';
    loginCaption.style.height = loginButton.offsetHeight + 'px';
    loginCaption.style.fontSize = window.getComputedStyle(loginButton).fontSize;
    loginCaption.style.padding = window.getComputedStyle(loginButton).padding;

    // Append elements to container
    loginProfilesContainer.appendChild(loginCaption);
    loginProfilesContainer.appendChild(profileSelect);
    loginCaption.style.fontSize = window.getComputedStyle(loginButton).fontSize;
    profileSelect.style.fontSize = window.getComputedStyle(loginButton).fontSize;

    // Insert container into the login form
    const passwordFieldRow = document.querySelector('#passwordEdit-wrap').parentElement;
    passwordFieldRow.parentElement.appendChild(loginProfilesContainer);

    registerLoginEvents(loginCaption);

    console.log('Login form elements found and profile selector added');
  } else {
    // If elements aren't found yet, try again after a delay
    setTimeout(waitForLoginElements, 500);
  }
})();

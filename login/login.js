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

  // Find login form elements - universal selectors
  const usernameField = document.querySelector('#loginEdit-el') || 
                       document.querySelector('input[name*="username"]') ||
                       document.querySelector('input[name*="login"]') ||
                       document.querySelector('input[name*="email"]') ||
                       document.querySelector('input[name*="user"]') ||
                       document.querySelector('input[type="text"]') ||
                       document.querySelector('input[type="email"]');
                       
  const passwordField = document.querySelector('#passwordEdit-el') ||
                       document.querySelector('input[type="password"]');
                       
  const loginButton = document.querySelector('.login-button-login') ||
                     document.querySelector('button[type="submit"]') ||
                     document.querySelector('input[type="submit"]');

  if (usernameField && passwordField && loginButton) {
    // Create login profiles container
    const loginProfilesContainer = document.createElement('div');
    loginProfilesContainer.className = 'creatio-satelite-login-profiles-container';

    // Create dropdown select element
    const profileSelect = document.createElement('select');
    profileSelect.className = 'creatio-satelite-login-profile-select';
    profileSelect.style.width = (loginButton.offsetWidth || 200) + 'px';
    profileSelect.style.padding = '8px';
    profileSelect.style.borderRadius = '4px';
    profileSelect.style.border = '1px solid #ddd';

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

        // Display format: "alias (username)" if alias exists, otherwise just "username"
        const displayText = profile.alias && profile.alias.trim() !== '' 
          ? `${profile.alias} (${profile.username})` 
          : profile.username;
        option.textContent = displayText;
        
        option.dataset.username = profile.username;
        option.dataset.password = profile.password;
        option.dataset.alias = profile.alias || '';
        option.dataset.autologin = profile.autologin ? 'true' : 'false';
        profileSelect.appendChild(option);
      });

      // Restore last used profile for this URL
      chrome.storage.sync.get({ lastLoginProfiles: {} }, (result) => {
        const map = result.lastLoginProfiles;
        // Instead of full href, use origin for storage key
        const key = window.location.origin;
        const lastUser = map[key];
        if (lastUser) {
          profileSelect.value = lastUser;

          // Trigger autologin if enabled
          const selectedOption = profileSelect.options[profileSelect.selectedIndex];
          if (selectedOption.dataset.autologin === 'true') {
            loginCaption.click();
          }
        }
      });
    });

    // Add caption text - login button
    const loginCaption = document.createElement('button');
    loginCaption.classList.add('creatio-satelite');
    loginCaption.classList.add('auto-login-button');
    loginCaption.textContent = 'Login with profile';
    loginCaption.style.width = loginButton.offsetWidth + 'px';
    loginCaption.style.height = loginButton.offsetHeight + 'px';
    loginCaption.style.padding = '8px 16px';
    loginCaption.style.backgroundColor = 'rgb(255, 87, 34)'; // Новый цвет для кнопки LOGIN WITH PROFILE
    loginCaption.style.color = 'white';
    loginCaption.style.border = 'none';
    loginCaption.style.borderRadius = '4px';
    loginCaption.style.cursor = 'pointer';
    loginCaption.style.fontSize = window.getComputedStyle(loginButton).fontSize;
    loginCaption.style.display = 'flex';
    loginCaption.style.alignItems = 'center';
    loginCaption.style.justifyContent = 'center';
    loginCaption.style.textAlign = 'center';

    // Create settings button
    const settingsButton = document.createElement('button');
    settingsButton.classList.add('creatio-satelite');
    settingsButton.classList.add('auto-login-button');
    settingsButton.classList.add('settings-button');
    
    // Create icon span element
    const iconSpan = document.createElement('span');
    iconSpan.innerHTML = '&#128100;'; // User/profile icon
    iconSpan.style.marginRight = '5px';
    iconSpan.style.fontSize = '16px';
    
    // Create text node
    const buttonText = document.createTextNode('Setup profiles');
    
    // Append icon and text to button
    settingsButton.appendChild(iconSpan);
    settingsButton.appendChild(buttonText);
    
    settingsButton.style.width = loginButton.offsetWidth + 'px';
    settingsButton.style.height = loginButton.offsetHeight + 'px';
    settingsButton.style.fontSize = window.getComputedStyle(loginButton).fontSize;
    settingsButton.style.padding = window.getComputedStyle(loginButton).padding;
    settingsButton.style.marginTop = '8px'; // Add some spacing between dropdown and settings button
    settingsButton.style.display = 'flex';
    settingsButton.style.alignItems = 'center';
    settingsButton.style.justifyContent = 'center';
    
    // Add click event to open options page
    settingsButton.addEventListener('click', () => {
      // Send a message to the background script to open the options page
      chrome.runtime.sendMessage({ action: 'openOptionsPage' });
    });

    // Append elements: 'Setup profiles', then dropdown, then 'Login with profile'
    loginProfilesContainer.appendChild(settingsButton);
    loginProfilesContainer.appendChild(profileSelect);
    loginProfilesContainer.appendChild(loginCaption);
    loginCaption.style.fontSize = window.getComputedStyle(loginButton).fontSize;
    profileSelect.style.fontSize = window.getComputedStyle(loginButton).fontSize;

    // Insert container into the login form
    const passwordFieldRow = document.querySelector('#passwordEdit-wrap').parentElement;
    passwordFieldRow.parentElement.appendChild(loginProfilesContainer);

    // Save selected profile on login button click
    loginButton.addEventListener('click', () => {
      const selectedUser = profileSelect.value;
      chrome.storage.sync.get({ lastLoginProfiles: {} }, (result) => {
        const map = result.lastLoginProfiles;
        // Instead of full href, use origin for storage key
        const key = window.location.origin;
        map[key] = selectedUser;
        chrome.storage.sync.set({ lastLoginProfiles: map });
      });
    });

    registerLoginEvents(loginCaption);

    console.log('Login form elements found and profile selector added');
  } else {
    // If elements aren't found yet, try again after a delay
    setTimeout(waitForLoginElements, 500);
  }
})();

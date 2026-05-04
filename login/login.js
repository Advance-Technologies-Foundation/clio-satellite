/**
 * Login page functionality for Creatio
 * This script adds a login profile selector dropdown to the login page
 */

// Function to wait for login form elements and add login profile selector
(function waitForLoginElements() {
  const EXCLUDED_DOMAINS = [
    "gitlab.com", "github.com", "bitbucket.org", "google.com",
    "mail.google.com", "youtube.com", "atlassian.net",
    "upsource.creatio.com", "work.creatio.com",
    "community.creatio.com", "academy.creatio.com",
    "www.creatio.com", "marketplace.creatio.com",
    "partners.creatio.com", "events.creatio.com", "blog.creatio.com"
  ];
  if (EXCLUDED_DOMAINS.some(d => window.location.hostname.includes(d))) return;

  function addOption(parent, value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    parent.appendChild(option);
  }

  const { usernameField, passwordField, loginButton } = getLoginElements();

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
      const currentUrl = window.location.origin;

      if (profiles.length === 0) {
        // If no profiles are found, add a default option
        addOption(profileSelect, '', 'Setup user in options');
      }
      
      // Filter profiles by URL: show profiles with matching URL or empty URL (default)
      const normalizeUrl = (url) => {
        try {
          const { hostname, pathname, port } = new URL(url);
          return `${hostname}${port ? ':' + port : ''}${pathname}`.replace(/\/$/, '').toLowerCase();
        } catch {
          return url.replace(/\/$/, '').toLowerCase();
        }
      };
      const availableProfiles = profiles.filter(profile => {
        if (!profile.url || profile.url.trim() === '') {
          return true; // Default profiles (no URL) show everywhere
        }
        // Normalize by stripping protocol — http:// and https:// both match
        const normalizedProfileUrl = normalizeUrl(profile.url);
        const normalizedHref = normalizeUrl(window.location.href);
        return normalizedHref.startsWith(normalizedProfileUrl);
      });
      
      // Add default option if no profiles available for this URL
      if (availableProfiles.length === 0) {
        addOption(profileSelect, '', 'No profiles for this URL');
      }
      
      availableProfiles.forEach(profile => {
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
        option.dataset.url = profile.url || '';
        option.dataset.autologin = profile.autologin ? 'true' : 'false';
        profileSelect.appendChild(option);
      });

      // Restore last used profile for this URL
      chrome.storage.sync.get({ lastLoginProfiles: {} }, (result) => {
        const map = result.lastLoginProfiles;
        // Instead of full href, use origin for storage key
        const key = window.location.origin;
        const entry = map[key];
        const lastUser = typeof entry === 'string' ? entry : entry?.username;
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
    const loginIconSpan = document.createElement('span');
    loginIconSpan.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    loginIconSpan.style.marginRight = '6px';
    loginIconSpan.style.lineHeight = '0';
    loginIconSpan.style.color = '#ffffff';
    loginCaption.appendChild(loginIconSpan);
    loginCaption.appendChild(document.createTextNode('Login with profile'));
    loginCaption.style.width = loginButton.offsetWidth + 'px';
    loginCaption.style.height = loginButton.offsetHeight + 'px';
    loginCaption.style.padding = '8px 16px';
    loginCaption.style.backgroundColor = 'rgb(255, 87, 34)'; // Orange color for "LOGIN WITH PROFILE" button
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
    iconSpan.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
    iconSpan.style.marginRight = '6px';
    iconSpan.style.lineHeight = '0';
    iconSpan.style.color = '#ffffff';
    
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
    
    settingsButton.addEventListener('click', () => {
      try {
        chrome.runtime.sendMessage({ action: 'openOptionsPage' });
      } catch {
        window.location.reload();
      }
    });

    // Environments button
    const envButton = document.createElement('button');
    envButton.classList.add('creatio-satelite');
    envButton.classList.add('auto-login-button');
    envButton.classList.add('environments-button');

    const envIconSpan = document.createElement('span');
    envIconSpan.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>';
    envIconSpan.style.marginRight = '6px';
    envIconSpan.style.lineHeight = '0';
    envIconSpan.style.color = '#ffffff';
    envButton.appendChild(envIconSpan);
    envButton.appendChild(document.createTextNode('Environments'));

    envButton.style.width = loginButton.offsetWidth + 'px';
    envButton.style.height = loginButton.offsetHeight + 'px';
    envButton.style.fontSize = window.getComputedStyle(loginButton).fontSize;
    envButton.style.padding = window.getComputedStyle(loginButton).padding;
    envButton.style.marginTop = '8px';
    envButton.style.display = 'flex';
    envButton.style.alignItems = 'center';
    envButton.style.justifyContent = 'center';

    envButton.addEventListener('click', () => {
      try {
        chrome.runtime.sendMessage({ action: 'openEnvironmentsPage' });
      } catch {
        window.location.reload();
      }
    });

    // Append elements: Environments, Setup profiles, dropdown, Login with profile
    loginProfilesContainer.appendChild(envButton);
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
        map[key] = { username: selectedUser, timestamp: Date.now() };
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

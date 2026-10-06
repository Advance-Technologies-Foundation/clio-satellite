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
    profileSelect.setAttribute('aria-label', 'Saved profile');

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

    // Duotone icons: outline in currentColor, accent in var(--csl-icon-accent)
    const ICONS = {
      login: '<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 1.75h3.25a1.5 1.5 0 0 1 1.5 1.5v9.5a1.5 1.5 0 0 1-1.5 1.5H9.5"/><path d="M1.75 8h7.5M6.75 5l3 3-3 3" stroke="var(--csl-icon-accent, #ff5722)"/></svg>',
      settings: '<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.38 3.54L6.76 1.62L9.24 1.62L9.62 3.54L10.01 3.70L11.63 2.61L13.39 4.37L12.30 5.99L12.46 6.38L14.38 6.76L14.38 9.24L12.46 9.62L12.30 10.01L13.39 11.63L11.63 13.39L10.01 12.30L9.62 12.46L9.24 14.38L6.76 14.38L6.38 12.46L5.99 12.30L4.37 13.39L2.61 11.63L3.70 10.01L3.54 9.62L1.62 9.24L1.62 6.76L3.54 6.38L3.70 5.99L2.61 4.37L4.37 2.61L5.99 3.70z"/><circle cx="8" cy="8" r="2" fill="var(--csl-icon-accent, #ff5722)" stroke="none"/></svg>',
    };

    // Icon-only button; the visible name comes from the tooltip and aria-label
    function createIconButton(classNames, iconKey, label) {
      const button = document.createElement('button');
      button.type = 'button';
      button.classList.add(...classNames);
      button.title = label;
      button.setAttribute('aria-label', label);
      const iconSpan = document.createElement('span');
      iconSpan.className = 'creatio-satelite-login-icon';
      iconSpan.setAttribute('aria-hidden', 'true');
      iconSpan.innerHTML = ICONS[iconKey];
      button.appendChild(iconSpan);
      return button;
    }

    function openExtensionPage(action) {
      try {
        chrome.runtime.sendMessage({ action });
      } catch {
        window.location.reload();
      }
    }

    // One compact row: extension settings, profile selector, log in with it.
    // The extension is an add-on to the login form, so it takes one form row, not a block.
    const loginCaption = createIconButton(
      ['creatio-satelite', 'auto-login-button', 'login-with-profile-button'],
      'login',
      'Login with profile'
    );

    // Settings opens the profiles page; Environments is one click away from its top bar
    const settingsButton = createIconButton(
      ['creatio-satelite', 'creatio-satelite-login-secondary', 'settings-button'],
      'settings',
      'Clio satellite settings'
    );
    settingsButton.addEventListener('click', () => openExtensionPage('openOptionsPage'));

    // Row width and height follow the native login button so it lines up with the form
    loginProfilesContainer.style.width = (loginButton.offsetWidth || 280) + 'px';
    loginProfilesContainer.style.setProperty('--csl-row-height', (loginButton.offsetHeight || 36) + 'px');
    // Settings first, so the selector and the button that uses it stay next to each other
    loginProfilesContainer.appendChild(settingsButton);
    loginProfilesContainer.appendChild(profileSelect);
    loginProfilesContainer.appendChild(loginCaption);

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

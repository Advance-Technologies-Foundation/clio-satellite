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

    // Menu entries at the end of the dropdown; picking one opens the page and keeps the profile selected
    const MENU_ACTIONS = {
      '__csl_manage_profiles__': { text: 'Manage profiles…', action: 'openOptionsPage' },
      '__csl_environments__': { text: 'Environments…', action: 'openEnvironmentsPage' },
    };
    let lastProfileValue = '';
    profileSelect.addEventListener('change', () => {
      const menuItem = MENU_ACTIONS[profileSelect.value];
      if (!menuItem) {
        lastProfileValue = profileSelect.value;
        return;
      }
      profileSelect.value = lastProfileValue;
      openExtensionPage(menuItem.action);
    });

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

      // Extension pages live in the same dropdown, below the profiles, instead of separate buttons
      const menuGroup = document.createElement('optgroup');
      menuGroup.label = 'Clio satellite';
      Object.entries(MENU_ACTIONS).forEach(([value, { text }]) => addOption(menuGroup, value, text));
      profileSelect.appendChild(menuGroup);
      lastProfileValue = profileSelect.value;

      // Restore last used profile for this URL
      chrome.storage.sync.get({ lastLoginProfiles: {} }, (result) => {
        const map = result.lastLoginProfiles;
        // Instead of full href, use origin for storage key
        const key = window.location.origin;
        const entry = map[key];
        const lastUser = typeof entry === 'string' ? entry : entry?.username;
        if (lastUser) {
          profileSelect.value = lastUser;
          lastProfileValue = profileSelect.value;

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

    // One compact row: profile selector (with the extension menu inside) and log in with it.
    // The extension is an add-on to the login form, so it takes one form row, not a block.
    const loginCaption = createIconButton(
      ['creatio-satelite', 'auto-login-button', 'login-with-profile-button'],
      'login',
      'Login with profile'
    );


    // Row width and height follow the native login button so it lines up with the form
    loginProfilesContainer.style.width = (loginButton.offsetWidth || 280) + 'px';
    loginProfilesContainer.style.setProperty('--csl-row-height', (loginButton.offsetHeight || 36) + 'px');
    loginProfilesContainer.appendChild(profileSelect);
    loginProfilesContainer.appendChild(loginCaption);

    // Insert container into the login form
    const passwordFieldRow = document.querySelector('#passwordEdit-wrap').parentElement;
    passwordFieldRow.parentElement.appendChild(loginProfilesContainer);

    // Save selected profile on login button click
    loginButton.addEventListener('click', () => {
      const selectedUser = MENU_ACTIONS[profileSelect.value] ? lastProfileValue : profileSelect.value;
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

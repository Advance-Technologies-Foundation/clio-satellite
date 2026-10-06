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

    const ICONS = {
      login: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      profiles: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
      environments: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>',
    };

    // Raster icons from icons/ui/; the inline SVG above is the fallback when the URL is unavailable
    const ICON_FILES = { login: 'login.png', profiles: 'profiles.png', environments: 'environments.png' };

    function renderIcon(container, key) {
      let url = null;
      try { url = chrome.runtime?.getURL ? chrome.runtime.getURL('icons/ui/' + ICON_FILES[key]) : null; } catch { url = null; }
      if (!url) { container.innerHTML = ICONS[key]; return; }
      const img = document.createElement('img');
      img.className = 'creatio-satelite-icon';
      img.src = url;
      img.alt = '';
      img.draggable = false;
      img.addEventListener('error', () => { container.innerHTML = ICONS[key]; }, { once: true });
      container.replaceChildren(img);
    }

    function createButton(classNames, iconKey, text) {
      const button = document.createElement('button');
      button.type = 'button';
      button.classList.add(...classNames);
      const iconSpan = document.createElement('span');
      iconSpan.className = 'creatio-satelite-login-icon';
      iconSpan.setAttribute('aria-hidden', 'true');
      renderIcon(iconSpan, iconKey);
      button.appendChild(iconSpan);
      button.appendChild(document.createTextNode(text));
      return button;
    }

    function openExtensionPage(action) {
      try {
        chrome.runtime.sendMessage({ action });
      } catch {
        window.location.reload();
      }
    }

    // Primary action: log in with the selected profile
    const loginCaption = createButton(
      ['creatio-satelite', 'auto-login-button', 'login-with-profile-button'],
      'login',
      'Login with profile'
    );
    loginCaption.style.height = (loginButton.offsetHeight || 36) + 'px';

    // Secondary actions: open extension pages
    const settingsButton = createButton(
      ['creatio-satelite', 'creatio-satelite-login-secondary', 'settings-button'],
      'profiles',
      'Profiles'
    );
    settingsButton.addEventListener('click', () => openExtensionPage('openOptionsPage'));

    const envButton = createButton(
      ['creatio-satelite', 'creatio-satelite-login-secondary', 'environments-button'],
      'environments',
      'Environments'
    );
    envButton.addEventListener('click', () => openExtensionPage('openEnvironmentsPage'));

    const header = document.createElement('div');
    header.className = 'creatio-satelite-login-header';
    header.textContent = 'Clio satellite';

    const secondaryRow = document.createElement('div');
    secondaryRow.className = 'creatio-satelite-login-secondary-row';
    secondaryRow.appendChild(envButton);
    secondaryRow.appendChild(settingsButton);

    // Panel width follows the native login button so the block lines up with the form
    loginProfilesContainer.style.width = (loginButton.offsetWidth || 280) + 'px';
    loginProfilesContainer.appendChild(header);
    loginProfilesContainer.appendChild(profileSelect);
    loginProfilesContainer.appendChild(loginCaption);
    loginProfilesContainer.appendChild(secondaryRow);

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

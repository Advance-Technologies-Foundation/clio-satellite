function getLoginElements() {
  return {
    usernameField: document.querySelector('#loginEdit-el') ||
                   document.querySelector('input[name*="username"]') ||
                   document.querySelector('input[name*="login"]') ||
                   document.querySelector('input[name*="email"]') ||
                   document.querySelector('input[name*="user"]') ||
                   document.querySelector('input[type="text"]') ||
                   document.querySelector('input[type="email"]'),
    passwordField: document.querySelector('#passwordEdit-el') ||
                   document.querySelector('input[type="password"]'),
    loginButton:   document.querySelector('.login-button-login') ||
                   document.querySelector('button[type="submit"]') ||
                   document.querySelector('input[type="submit"]'),
  };
}

// Local diagnostic log of login-page decisions, kept for "autologin did not work" reports.
// Stored only in chrome.storage.local (never synced, never sent anywhere); passwords are never logged.
const AUTOLOGIN_LOG_KEY = 'autologinLog';
const AUTOLOGIN_LOG_MAX = 100;

function autologinLog(event, details = {}) {
  // login.js also runs on other sites' login forms; their addresses are not recorded
  if (!document.querySelector('#loginEdit-el')) return;
  const entry = {
    time: new Date().toISOString(),
    origin: window.location.origin,
    event,
    readyState: document.readyState,
    visibility: document.visibilityState,
    hasFocus: document.hasFocus(),
    ...details,
  };
  console.info('[Clio Satellite] autologin:', event, entry);
  pendingAutologinLog.push(entry);
  writeAutologinLog();
}

// Storage calls are async: entries logged in the same tick would each read the same old list and
// the last write would drop the others, so one write at a time takes everything queued so far.
const pendingAutologinLog = [];
let autologinLogWriting = false;

function writeAutologinLog() {
  if (autologinLogWriting || pendingAutologinLog.length === 0) return;
  autologinLogWriting = true;
  const done = () => { autologinLogWriting = false; writeAutologinLog(); };
  try {
    chrome.storage.local.get({ [AUTOLOGIN_LOG_KEY]: [] }, (data) => {
      const log = Array.isArray(data && data[AUTOLOGIN_LOG_KEY]) ? data[AUTOLOGIN_LOG_KEY] : [];
      log.push(...pendingAutologinLog.splice(0));
      chrome.storage.local.set({ [AUTOLOGIN_LOG_KEY]: log.slice(-AUTOLOGIN_LOG_MAX) }, done);
    });
  } catch {
    // Extension context invalidated (extension reloaded): the console lines are all we can keep
    pendingAutologinLog.length = 0;
    autologinLogWriting = false;
  }
}

// Creatio copies a field's DOM value into its view model only on the field's blur event.
// focus() fires no focus/blur events while the window is not focused (a slow login page is
// exactly when the user switches away), so the model stayed empty and Creatio answered the
// click with "Enter a value". A dispatched blur updates the model whatever the window focus.
function fillLoginField(field, value) {
  field.focus();
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
  field.dispatchEvent(new FocusEvent('blur'));
  field.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
}

const LOGIN_RESULT_CHECK_MS = 8000;

// Visible validation or error messages on the login page, for the diagnostic log
function visibleLoginMessages() {
  return [...document.querySelectorAll('[class*="validation"], [class*="error"], [class*="info-message"]')]
    .filter(el => el.offsetParent !== null && el.children.length === 0)
    .map(el => el.textContent.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function loginWithSelectedProfile(trigger) {
  const profileSelect = document.querySelector('.creatio-satelite-login-profile-select');
  const selectedOption = profileSelect && profileSelect.options[profileSelect.selectedIndex];
  const username = selectedOption && selectedOption.dataset.username;
  const password = selectedOption && selectedOption.dataset.password;
  if (!username || !password) {
    autologinLog('login-skipped', { trigger, reason: 'selected profile has no username or password' });
    return;
  }
  const { usernameField, passwordField, loginButton } = getLoginElements();
  if (!usernameField || !passwordField || !loginButton) {
    autologinLog('login-skipped', {
      trigger, reason: 'login form elements missing',
      usernameField: !!usernameField, passwordField: !!passwordField, loginButton: !!loginButton,
    });
    return;
  }
  fillLoginField(usernameField, username);
  fillLoginField(passwordField, password);
  loginButton.click();
  autologinLog('login-clicked', { trigger, usernameFilled: usernameField.value === username });

  const loginPath = window.location.pathname;
  setTimeout(() => {
    if (window.location.pathname !== loginPath || !document.contains(usernameField)) return;
    autologinLog('still-on-login-page', {
      trigger, afterMs: LOGIN_RESULT_CHECK_MS, messages: visibleLoginMessages(),
    });
  }, LOGIN_RESULT_CHECK_MS);
}

function registerLoginEvents(loginCaption) {
  loginCaption.addEventListener('click', (event) => {
    loginWithSelectedProfile(event.isTrusted ? 'button' : 'autologin');
  });
}

import { debugLog, DEBUG } from './debug.js';
import { EXCLUDED_DOMAINS, SHELL_URL_PATTERNS } from './menuConfig.js';

export function getCreatioPageType() {
  const currentHost = window.location.hostname;
  const currentPath = window.location.pathname.toLowerCase();
  const currentUrl = window.location.href.toLowerCase();

  for (const domain of EXCLUDED_DOMAINS) {
    if (currentHost.includes(domain)) {
      debugLog(`Domain ${currentHost} is in the exclusion list. Skipping activation.`);
      return null;
    }
  }

  const loginIndicators = [
    currentPath.includes('/login'),
    currentPath.includes('/auth'),
    currentPath.includes('/signin'),
    currentPath.includes('/authentication'),
    currentUrl.includes('login'),
    currentUrl.includes('auth'),
    currentUrl.includes('signin'),
    document.querySelector('#loginEdit-el'),
    document.querySelector('#passwordEdit-el'),
    document.querySelector('.login-button-login'),
    document.querySelector('input[name*="username"]'),
    document.querySelector('input[name*="password"]'),
    document.querySelector('input[name*="login"]'),
    document.querySelector('form[action*="login"]'),
    document.querySelector('[class*="login"]'),
    document.querySelector('[id*="login"]'),
    document.querySelector('[class*="auth"]'),
    document.querySelector('[id*="auth"]'),
    document.body && document.body.textContent.toLowerCase().includes('sign in'),
    document.body && document.body.textContent.toLowerCase().includes('log in'),
    document.body && document.body.textContent.toLowerCase().includes('authentication'),
    document.title.toLowerCase().includes('login'),
    document.title.toLowerCase().includes('auth'),
    document.title.toLowerCase().includes('sign in'),
    document.querySelector('meta[name*="login"]'),
    document.querySelector('meta[content*="login"]'),
    document.querySelector('meta[content*="auth"]'),
  ];

  if (loginIndicators.some(Boolean)) {
    debugLog('LOGIN PAGE DETECTED - Navigation/Actions buttons will be blocked');
    return 'login';
  }

  if (document.querySelector('ts-workspace-section')) {
    debugLog('Configuration page detected');
    return 'configuration';
  }

  const urlMatchesShell = SHELL_URL_PATTERNS.some(p => currentUrl.includes(p.toLowerCase()));

  const shellSelectors = [
    document.getElementById('ShellContainerWithBackground'),
    document.querySelector('mainshell'),
    document.querySelector('crt-schema-outlet'),
    document.querySelector('[data-item-marker="AppToolbarGlobalSearch"]'),
    document.querySelector('crt-app-toolbar'),
    document.querySelector('.creatio-logo'),
    document.querySelector('[id*="Terrasoft"]'),
    document.querySelector('[class*="Terrasoft"]'),
    document.querySelector('script[src*="creatio"]'),
    document.querySelector('script[src*="terrasoft"]'),
    document.querySelector('link[href*="creatio"]'),
    document.querySelector('link[href*="terrasoft"]'),
    document.querySelector('crt-root'),
    document.querySelector('[class*="shell"]'),
    document.querySelector('[id*="shell"]'),
    document.querySelector('crt-page'),
    document.querySelector('crt-reusable-schema'),
  ];

  const foundCount = shellSelectors.filter(Boolean).length;
  const minRequired = urlMatchesShell ? 1 : 2;

  debugLog(`Shell detection: ${foundCount}/${minRequired} indicators, URL match: ${urlMatchesShell}`);

  if (DEBUG) {
    const names = [
      'ShellContainerWithBackground', 'mainshell', 'crt-schema-outlet',
      'AppToolbarGlobalSearch', 'crt-app-toolbar', 'creatio-logo',
      'Terrasoft ID', 'Terrasoft class', 'creatio script', 'terrasoft script',
      'creatio link', 'terrasoft link', 'crt-root', 'shell class',
      'shell ID', 'crt-page', 'crt-reusable-schema',
    ];
    shellSelectors.forEach((el, i) => { if (el) debugLog(`✓ Found: ${names[i]}`); });
    if (urlMatchesShell) debugLog('✓ URL pattern matches Shell page');
  }

  if (foundCount >= minRequired || urlMatchesShell) {
    debugLog(`Shell page detected: ${foundCount} indicators, URL match: ${urlMatchesShell}`);
    return 'shell';
  }

  debugLog(`Page not recognized (${foundCount}/${minRequired} indicators, URL match: ${urlMatchesShell})`);
  return null;
}

export function isShellPage() {
  const type = getCreatioPageType();
  return type === 'shell' || type === 'configuration';
}

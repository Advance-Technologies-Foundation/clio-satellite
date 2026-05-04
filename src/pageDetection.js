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
    document.querySelector('#loginEdit-el'),
    document.querySelector('#passwordEdit-el'),
    document.querySelector('.login-button-login'),
    currentPath === '/login' || currentPath.startsWith('/login/'),
    currentPath === '/auth' || currentPath.startsWith('/auth/'),
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
    document.querySelector('crt-root'),
    document.querySelector('crt-page'),
    document.querySelector('crt-reusable-schema'),
  ];

  const foundCount = shellSelectors.filter(Boolean).length;
  const minRequired = 1;

  debugLog(`Shell detection: ${foundCount}/${minRequired} indicators, URL match: ${urlMatchesShell}`);

  if (DEBUG) {
    const names = [
      'ShellContainerWithBackground', 'mainshell', 'crt-schema-outlet',
      'AppToolbarGlobalSearch', 'crt-app-toolbar', 'crt-root',
      'crt-page', 'crt-reusable-schema',
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

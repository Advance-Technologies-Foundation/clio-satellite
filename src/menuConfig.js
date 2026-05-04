export const SCRIPT_FILES = [
  'Features.js',
  'Application_Managment.js',
  'Lookups.js',
  'Process_library.js',
  'Process_log.js',
  'SysSettings.js',
  'Users.js',
  'Configuration.js',
  'Settings',
];

export const SCRIPT_DESCRIPTIONS = {
  'Features': 'Open system features management page',
  'Application_Managment': 'Application managment - App Hub',
  'Lookups': 'Open system lookups',
  'Process_library': 'Open process library',
  'Process_log': 'View process log',
  'SysSettings': 'System settings and parameters',
  'Users': 'Manage system users',
  'Configuration': 'Open system configuration',
  'Settings': 'Open plugin settings',
};

export const MENU_ICONS = {
  'Features': {
    svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.6477 3.7921C10.0849 3.98314 9.4883 4.26947 8.94174 4.69091C8.89082 4.73017 8.85784 4.78936 8.85784 4.85366V14.2763C8.85784 14.3201 8.90952 14.3396 8.93467 14.3038C9.31132 13.7685 10.03 13.3802 10.9124 13.1213C11.774 12.8685 12.6597 12.7776 13.1956 12.7466C13.6472 12.7204 14 12.3491 14 11.8998V4.25019C14 3.79737 13.6424 3.42414 13.187 3.40169L13.1839 3.40154L13.1785 3.40131L13.1631 3.40071C13.1509 3.40028 13.1346 3.39979 13.1146 3.39938C13.0747 3.39856 13.0196 3.39803 12.9514 3.39884C12.815 3.40044 12.6247 3.40734 12.3953 3.428C11.9394 3.46907 11.3143 3.56581 10.6477 3.7921Z" fill="currentColor"></path><path d="M7.06679 14.3046C7.09196 14.3403 7.14355 14.3208 7.14355 14.2771V4.85559C7.14355 4.79051 7.11013 4.73061 7.05859 4.69087C6.51205 4.26945 5.91539 3.98312 5.35259 3.7921C4.6859 3.5658 4.06074 3.46906 3.60478 3.428C3.37541 3.40734 3.18503 3.40044 3.04866 3.39884C2.98038 3.39803 2.92533 3.39856 2.88537 3.39938C2.86539 3.39979 2.84915 3.40028 2.83688 3.40071L2.82148 3.40131L2.81607 3.40154L2.81394 3.40164L2.8122 3.40173C2.35727 3.42415 2 3.79701 2 4.24937V11.8999C2 12.3484 2.35168 12.7194 2.80252 12.7464C3.3393 12.7786 4.22567 12.8705 5.08792 13.1237C5.97123 13.383 6.69031 13.7709 7.06679 14.3046Z" fill="currentColor"></path>`,
    name: 'online-help',
  },
  'Application_Managment': {
    svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2H14V15H2V2ZM3.333 3.333V13.333H12.667V3.333H3.333Z" fill="currentColor"/>`,
    name: 'application_management',
  },
  'Lookups': {
    svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="4" stroke="currentColor" stroke-width="2"/><path d="M11 11l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    name: 'lookups',
  },
  'Process_library': {
    svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="12" height="12" rx="2" fill="currentColor"/></svg>`,
    name: 'process_library',
  },
  'Process_log': {
    svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="10" height="10" rx="2" fill="currentColor"/><path d="M5 6h6M5 8h6M5 10h4" stroke="#fff" stroke-width="1.2"/></svg>`,
    name: 'process_log',
  },
  'SysSettings': {
    svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2"/><path d="M8 4v4l3 2" stroke="currentColor" stroke-width="2"/></svg>`,
    name: 'sys_settings',
  },
  'Users': {
    svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="6" r="3" stroke="currentColor" stroke-width="2"/><path d="M2 14c0-2.21 2.686-4 6-4s6 1.79 6 4" stroke="currentColor" stroke-width="2"/></svg>`,
    name: 'users',
  },
  'Configuration': {
    svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="10" height="10" rx="2" fill="currentColor"/></svg>`,
    name: 'configuration',
  },
  'Settings': {
    svg: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M12.7 6.4a1 1 0 0 0 .3-1.4l-.8-1.4a1 1 0 0 0-1.4-.3l-.5.3a6 6 0 0 0-1.6-.9V2a1 1 0 0 0-1-1H6.3a1 1 0 0 0-1 1v.7a6 6 0 0 0-1.6.9l-.5-.3a1 1 0 0 0-1.4.3l-.8 1.4a1 1 0 0 0 .3 1.4l.5.3v1.6l-.5.3a1 1 0 0 0-.3 1.4l.8 1.4a1 1 0 0 0 1.4.3l.5-.3a6 6 0 0 0 1.6.9V14a1 1 0 0 0 1 1h1.4a1 1 0 0 0 1-1v-.7a6 6 0 0 0 1.6-.9l.5.3a1 1 0 0 0 1.4-.3l.8-1.4a1 1 0 0 0-.3-1.4l-.5-.3V8l.5-.3z" stroke="currentColor" stroke-width="1" fill="none"/></svg>`,
    name: 'settings',
  },
};

export const ACTION_DETAILS = {
  'RestartApp': {
    file: 'RestartApp.js',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2v6l4 2" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2"/></svg>`,
    name: 'refresh',
    desc: 'Reload the Creatio application',
  },
  'FlushRedisDB': {
    file: 'FlushRedisDB.js',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="10" height="10" rx="2" fill="currentColor"/><path d="M5 6h6M5 8h6M5 10h4" stroke="#fff" stroke-width="1.2"/></svg>`,
    name: 'delete',
    desc: 'Clear Redis database',
  },
  'EnableAutologin': {
    file: null,
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2"/><path d="M5 8l2 2 4-4" stroke="#fff" stroke-width="2"/></svg>`,
    name: 'check',
    desc: 'Enable autologin for this site',
  },
  'DisableAutologin': {
    file: null,
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2"/><path d="M5 5l6 6M11 5l-6 6" stroke="#fff" stroke-width="2"/></svg>`,
    name: 'block',
    desc: 'Disable autologin for this site',
  },
  'Settings': {
    file: null,
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2"/><path d="M8 4v4l3 2" stroke="currentColor" stroke-width="2"/></svg>`,
    name: 'settings',
    desc: 'Open plugin settings',
  },
};

export const EXCLUDED_DOMAINS = [
  'gitlab.com',
  'github.com',
  'bitbucket.org',
  'google.com',
  'mail.google.com',
  'youtube.com',
  'atlassian.net',
  'upsource.creatio.com',
  'work.creatio.com',
  'community.creatio.com',
  'academy.creatio.com',
  'www.creatio.com',
  'marketplace.creatio.com',
  'partners.creatio.com',
  'events.creatio.com',
  'blog.creatio.com',
];

export const SHELL_URL_PATTERNS = [
  '/shell/',
  '/clientapp/',
  '#section',
  '#shell',
  'workspaceexplorer',
  'listpage',
  'cardpage',
  'dashboardmodule',
];

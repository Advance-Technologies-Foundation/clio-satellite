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

// Display captions that differ from the script file name (file names are kept for compatibility)
export const SCRIPT_LABELS = {
  'Application_Managment': 'Application management',
};

export const SCRIPT_DESCRIPTIONS = {
  'Features': 'Open system features management page',
  'Application_Managment': 'Application management - App Hub',
  'Lookups': 'Open system lookups',
  'Process_library': 'Open process library',
  'Process_log': 'View process log',
  'SysSettings': 'System settings and parameters',
  'Users': 'Manage system users',
  'Configuration': 'Open system configuration',
  'Settings': 'Open plugin settings',
};

// Duotone icons: outline in currentColor, one accent in var(--csl-icon-accent)
export const MENU_ICONS = {
  'Features': {
    svg: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1.75" y="1.75" width="12.5" height="5" rx="2.5" fill="var(--csl-icon-accent, #ff5722)" fill-opacity=".35"/><circle cx="11.75" cy="4.25" r="1.25" fill="var(--csl-icon-accent, #ff5722)" stroke="none"/><rect x="1.75" y="9.25" width="12.5" height="5" rx="2.5"/><circle cx="4.25" cy="11.75" r="1.25" fill="currentColor" stroke="none"/></svg>`,
    name: 'online-help',
  },
  'Application_Managment': {
    svg: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1.75" y="1.75" width="5" height="5" rx="1.25" fill="var(--csl-icon-accent, #ff5722)" stroke="var(--csl-icon-accent, #ff5722)"/><rect x="9.25" y="1.75" width="5" height="5" rx="1.25"/><rect x="1.75" y="9.25" width="5" height="5" rx="1.25"/><rect x="9.25" y="9.25" width="5" height="5" rx="1.25"/></svg>`,
    name: 'application_management',
  },
  'Lookups': {
    svg: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.75 3h12.5M1.75 7.5h4M1.75 12h3"/><circle cx="10.25" cy="10.25" r="3" fill="var(--csl-icon-accent, #ff5722)" fill-opacity=".35"/><path d="M12.5 12.5l1.75 1.75"/></svg>`,
    name: 'lookups',
  },
  'Process_library': {
    svg: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="1.75" width="6" height="3.75" rx="1" fill="var(--csl-icon-accent, #ff5722)" stroke="var(--csl-icon-accent, #ff5722)"/><path d="M8 5.5v2.75M4 10.5V8.25h8v2.25"/><rect x="1.75" y="10.5" width="4.5" height="3.75" rx="1"/><rect x="9.75" y="10.5" width="4.5" height="3.75" rx="1"/></svg>`,
    name: 'process_library',
  },
  'Process_log': {
    svg: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7.25 14.25H3.25a1 1 0 0 1-1-1V2.75a1 1 0 0 1 1-1h5l3.5 3.5v2"/><path d="M4.75 5.5h2.5M4.75 8.5h2.5"/><circle cx="11.25" cy="11.25" r="3" fill="var(--csl-icon-accent, #ff5722)" fill-opacity=".35"/><path d="M11.25 9.75v1.5l1 1"/></svg>`,
    name: 'process_log',
  },
  'SysSettings': {
    svg: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.75 4h6.25M12 4h2.25M1.75 8h1.25M7 8h7.25M1.75 12h7.25M13 12h1.25"/><g fill="var(--csl-icon-accent, #ff5722)" stroke="none"><circle cx="10" cy="4" r="2"/><circle cx="5" cy="8" r="2"/><circle cx="11" cy="12" r="2"/></g></svg>`,
    name: 'sys_settings',
  },
  'Users': {
    svg: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.25 2.75a2.5 2.5 0 0 1 0 4.5M12.25 9.6c1.2.55 2 1.85 2 3.65"/><circle cx="6" cy="5" r="2.5" fill="var(--csl-icon-accent, #ff5722)" fill-opacity=".35"/><path d="M1.75 13.25c0-2.35 1.9-4 4.25-4s4.25 1.65 4.25 4z" fill="var(--csl-icon-accent, #ff5722)" fill-opacity=".35"/></svg>`,
    name: 'users',
  },
  'Configuration': {
    svg: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1.75" y="1.75" width="12.5" height="12.5" rx="2.5"/><path d="M6 5.5L4 8l2 2.5M10 5.5l2 2.5-2 2.5M8.75 5l-1.5 6" stroke="var(--csl-icon-accent, #ff5722)"/></svg>`,
    name: 'configuration',
  },
  'Settings': {
    svg: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.38 3.54L6.76 1.62L9.24 1.62L9.62 3.54L10.01 3.70L11.63 2.61L13.39 4.37L12.30 5.99L12.46 6.38L14.38 6.76L14.38 9.24L12.46 9.62L12.30 10.01L13.39 11.63L11.63 13.39L10.01 12.30L9.62 12.46L9.24 14.38L6.76 14.38L6.38 12.46L5.99 12.30L4.37 13.39L2.61 11.63L3.70 10.01L3.54 9.62L1.62 9.24L1.62 6.76L3.54 6.38L3.70 5.99L2.61 4.37L4.37 2.61L5.99 3.70z"/><circle cx="8" cy="8" r="2" fill="var(--csl-icon-accent, #ff5722)" stroke="none"/></svg>`,
    name: 'settings',
  },
};

export const ACTION_DETAILS = {
  'RestartApp': {
    file: 'RestartApp.js',
    icon: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13.75 8A5.75 5.75 0 1 1 11.3 3.29"/><path d="M12.2 1.48l1.23 3.3-3.52-.02z" fill="var(--csl-icon-accent, #ff5722)" stroke="var(--csl-icon-accent, #ff5722)" stroke-width="1"/></svg>`,
    name: 'refresh',
    desc: 'Reload the Creatio application',
  },
  'FlushRedisDB': {
    file: 'FlushRedisDB.js',
    icon: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="5.75" cy="3.5" rx="4" ry="1.75" fill="var(--csl-icon-accent, #ff5722)" fill-opacity=".35"/><path d="M1.75 3.5v8.5c0 .97 1.8 1.75 4 1.75"/><path d="M1.75 7.75c0 .97 1.8 1.75 4 1.75.55 0 1.05-.04 1.5-.1"/><path d="M9.75 3.5v3"/><g transform="rotate(20 12.25 11)"><path d="M12.25 1.75v7.25"/><path d="M10.5 9.25h3.5l1.25 5h-6z" fill="var(--csl-icon-accent, #ff5722)" stroke="var(--csl-icon-accent, #ff5722)"/></g></svg>`,
    name: 'delete',
    desc: 'Clear Redis database',
  },
  'EnableAutologin': {
    file: null,
    icon: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="5.5" r="3"/><path d="M8.4 7.6L2 14M3.25 12.75l1.5 1.5M5 11l1.25 1.25"/><path d="M9.5 12.25l1.5 1.5 3.25-3.5" stroke="var(--csl-icon-accent, #ff5722)" stroke-width="1.75"/></svg>`,
    name: 'check',
    desc: 'Enable autologin for this site',
  },
  'DisableAutologin': {
    file: null,
    icon: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="5.5" r="3"/><path d="M8.4 7.6L2 14M3.25 12.75l1.5 1.5M5 11l1.25 1.25"/><path d="M10 10l3.75 3.75M13.75 10L10 13.75" stroke="var(--csl-icon-accent, #ff5722)" stroke-width="1.75"/></svg>`,
    name: 'block',
    desc: 'Disable autologin for this site',
  },
  'Settings': {
    file: null,
    icon: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.38 3.54L6.76 1.62L9.24 1.62L9.62 3.54L10.01 3.70L11.63 2.61L13.39 4.37L12.30 5.99L12.46 6.38L14.38 6.76L14.38 9.24L12.46 9.62L12.30 10.01L13.39 11.63L11.63 13.39L10.01 12.30L9.62 12.46L9.24 14.38L6.76 14.38L6.38 12.46L5.99 12.30L4.37 13.39L2.61 11.63L3.70 10.01L3.54 9.62L1.62 9.24L1.62 6.76L3.54 6.38L3.70 5.99L2.61 4.37L4.37 2.61L5.99 3.70z"/><circle cx="8" cy="8" r="2" fill="var(--csl-icon-accent, #ff5722)" stroke="none"/></svg>`,
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

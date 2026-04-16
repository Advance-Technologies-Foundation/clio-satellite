import { describe, it, expect } from 'vitest';
import {
  SCRIPT_FILES,
  SCRIPT_DESCRIPTIONS,
  MENU_ICONS,
  ACTION_DETAILS,
  EXCLUDED_DOMAINS,
  SHELL_URL_PATTERNS,
} from '../src/menuConfig.js';

describe('SCRIPT_FILES', () => {
  it('all scripts have descriptions', () => {
    SCRIPT_FILES.forEach(file => {
      const name = file.replace('.js', '');
      expect(SCRIPT_DESCRIPTIONS[name], `Missing description for "${name}"`).toBeTruthy();
    });
  });

  it('all scripts have icons', () => {
    SCRIPT_FILES.forEach(file => {
      const name = file.replace('.js', '');
      expect(MENU_ICONS[name], `Missing icon for "${name}"`).toBeTruthy();
    });
  });

  it('all icons have svg and name fields', () => {
    Object.entries(MENU_ICONS).forEach(([key, icon]) => {
      expect(icon.svg, `${key} icon missing svg`).toBeTruthy();
      expect(icon.name, `${key} icon missing name`).toBeTruthy();
    });
  });

  it('Settings is the last item (has divider before it)', () => {
    const last = SCRIPT_FILES[SCRIPT_FILES.length - 1];
    expect(last).toBe('Settings');
  });
});

describe('ACTION_DETAILS', () => {
  it('all actions have required fields', () => {
    Object.entries(ACTION_DETAILS).forEach(([name, detail]) => {
      expect(detail.icon, `${name} missing icon`).toBeTruthy();
      expect(detail.name, `${name} missing name`).toBeTruthy();
      expect(detail.desc, `${name} missing desc`).toBeTruthy();
    });
  });

  it('RestartApp and FlushRedisDB have file references', () => {
    expect(ACTION_DETAILS['RestartApp'].file).toBe('RestartApp.js');
    expect(ACTION_DETAILS['FlushRedisDB'].file).toBe('FlushRedisDB.js');
  });

  it('autologin actions have null file (handled in code)', () => {
    expect(ACTION_DETAILS['EnableAutologin'].file).toBeNull();
    expect(ACTION_DETAILS['DisableAutologin'].file).toBeNull();
  });
});

describe('EXCLUDED_DOMAINS', () => {
  it('includes known non-Creatio domains', () => {
    expect(EXCLUDED_DOMAINS).toContain('github.com');
    expect(EXCLUDED_DOMAINS).toContain('google.com');
    expect(EXCLUDED_DOMAINS).toContain('work.creatio.com');
  });
});

describe('SHELL_URL_PATTERNS', () => {
  it('includes /shell/ pattern', () => {
    expect(SHELL_URL_PATTERNS).toContain('/shell/');
  });
});

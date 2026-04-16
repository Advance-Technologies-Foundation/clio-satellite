import { describe, it, expect, beforeEach } from 'vitest';
import { getCreatioPageType, isShellPage } from '../src/pageDetection.js';

beforeEach(() => {
  document.title = '';
  document.head.innerHTML = '';
});

describe('getCreatioPageType', () => {
  describe('excluded domains', () => {
    it('returns null for github.com', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'github.com', pathname: '/', href: 'https://github.com/', origin: 'https://github.com' },
        writable: true,
        configurable: true,
      });
      expect(getCreatioPageType()).toBeNull();
    });

    it('returns null for work.creatio.com', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'work.creatio.com', pathname: '/', href: 'https://work.creatio.com/', origin: 'https://work.creatio.com' },
        writable: true,
        configurable: true,
      });
      expect(getCreatioPageType()).toBeNull();
    });
  });

  describe('login page detection', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'myapp.example.com', pathname: '/login', href: 'https://myapp.example.com/login', origin: 'https://myapp.example.com' },
        writable: true,
        configurable: true,
      });
    });

    it('returns "login" for /login URL', () => {
      expect(getCreatioPageType()).toBe('login');
    });

    it('returns "login" when login form input is present', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'myapp.example.com', pathname: '/app', href: 'https://myapp.example.com/app', origin: 'https://myapp.example.com' },
        writable: true,
        configurable: true,
      });
      document.body.innerHTML = '<input id="loginEdit-el" />';
      expect(getCreatioPageType()).toBe('login');
    });

    it('returns "login" when password input is present', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'myapp.example.com', pathname: '/app', href: 'https://myapp.example.com/app', origin: 'https://myapp.example.com' },
        writable: true,
        configurable: true,
      });
      document.body.innerHTML = '<input id="passwordEdit-el" />';
      expect(getCreatioPageType()).toBe('login');
    });
  });

  describe('configuration page detection', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'myapp.example.com', pathname: '/app', href: 'https://myapp.example.com/app', origin: 'https://myapp.example.com' },
        writable: true,
        configurable: true,
      });
    });

    it('returns "configuration" when ts-workspace-section is present', () => {
      document.body.innerHTML = '<ts-workspace-section></ts-workspace-section>';
      expect(getCreatioPageType()).toBe('configuration');
    });
  });

  describe('shell page detection', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'myapp.example.com', pathname: '/app', href: 'https://myapp.example.com/shell/', origin: 'https://myapp.example.com' },
        writable: true,
        configurable: true,
      });
    });

    it('returns "shell" when URL matches shell pattern', () => {
      document.body.innerHTML = '<crt-app-toolbar></crt-app-toolbar>';
      expect(getCreatioPageType()).toBe('shell');
    });

    it('returns "shell" when 2+ shell DOM indicators present', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'myapp.example.com', pathname: '/app', href: 'https://myapp.example.com/app', origin: 'https://myapp.example.com' },
        writable: true,
        configurable: true,
      });
      document.body.innerHTML = `
        <crt-app-toolbar></crt-app-toolbar>
        <crt-root></crt-root>
      `;
      expect(getCreatioPageType()).toBe('shell');
    });

    it('returns null when not enough indicators and no URL match', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'myapp.example.com', pathname: '/app', href: 'https://myapp.example.com/app', origin: 'https://myapp.example.com' },
        writable: true,
        configurable: true,
      });
      document.body.innerHTML = '<div>Random page</div>';
      expect(getCreatioPageType()).toBeNull();
    });
  });
});

describe('isShellPage', () => {
  it('returns true for shell page', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'myapp.example.com', pathname: '/app', href: 'https://myapp.example.com/shell/', origin: 'https://myapp.example.com' },
      writable: true,
      configurable: true,
    });
    document.body.innerHTML = '<crt-app-toolbar></crt-app-toolbar>';
    expect(isShellPage()).toBe(true);
  });

  it('returns true for configuration page', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'myapp.example.com', pathname: '/app', href: 'https://myapp.example.com/app', origin: 'https://myapp.example.com' },
      writable: true,
      configurable: true,
    });
    document.body.innerHTML = '<ts-workspace-section></ts-workspace-section>';
    expect(isShellPage()).toBe(true);
  });

  it('returns false for login page', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'myapp.example.com', pathname: '/login', href: 'https://myapp.example.com/login', origin: 'https://myapp.example.com' },
      writable: true,
      configurable: true,
    });
    expect(isShellPage()).toBe(false);
  });
});

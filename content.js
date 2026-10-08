(() => {
  // src/debug.js
  var DEBUG = false;
  function debugLog(message) {
    if (DEBUG) console.log("[Clio Satellite]:", message);
  }
  function getLastError() {
    try {
      return chrome.runtime.lastError || null;
    } catch (e) {
      return null;
    }
  }

  // src/menuConfig.js
  var SCRIPT_FILES = [
    "Features.js",
    "Application_Managment.js",
    "Lookups.js",
    "Process_library.js",
    "Process_log.js",
    "SysSettings.js",
    "Users.js",
    "Configuration.js",
    "Settings"
  ];
  var SCRIPT_LABELS = {
    "Application_Managment": "Application management"
  };
  var MENU_ICONS = {
    "Features": {
      svg: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1.75" y="1.75" width="12.5" height="5" rx="2.5" fill="var(--csl-icon-accent, #ff5722)" fill-opacity=".35"/><circle cx="11.75" cy="4.25" r="1.25" fill="var(--csl-icon-accent, #ff5722)" stroke="none"/><rect x="1.75" y="9.25" width="12.5" height="5" rx="2.5"/><circle cx="4.25" cy="11.75" r="1.25" fill="currentColor" stroke="none"/></svg>`,
      name: "online-help"
    },
    "Application_Managment": {
      svg: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1.75" y="1.75" width="5" height="5" rx="1.25" fill="var(--csl-icon-accent, #ff5722)" stroke="var(--csl-icon-accent, #ff5722)"/><rect x="9.25" y="1.75" width="5" height="5" rx="1.25"/><rect x="1.75" y="9.25" width="5" height="5" rx="1.25"/><rect x="9.25" y="9.25" width="5" height="5" rx="1.25"/></svg>`,
      name: "application_management"
    },
    "Lookups": {
      svg: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.75 3h12.5M1.75 7.5h4M1.75 12h3"/><circle cx="10.25" cy="10.25" r="3" fill="var(--csl-icon-accent, #ff5722)" fill-opacity=".35"/><path d="M12.5 12.5l1.75 1.75"/></svg>`,
      name: "lookups"
    },
    "Process_library": {
      svg: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="1.75" width="6" height="3.75" rx="1" fill="var(--csl-icon-accent, #ff5722)" stroke="var(--csl-icon-accent, #ff5722)"/><path d="M8 5.5v2.75M4 10.5V8.25h8v2.25"/><rect x="1.75" y="10.5" width="4.5" height="3.75" rx="1"/><rect x="9.75" y="10.5" width="4.5" height="3.75" rx="1"/></svg>`,
      name: "process_library"
    },
    "Process_log": {
      svg: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7.25 14.25H3.25a1 1 0 0 1-1-1V2.75a1 1 0 0 1 1-1h5l3.5 3.5v2"/><path d="M4.75 5.5h2.5M4.75 8.5h2.5"/><circle cx="11.25" cy="11.25" r="3" fill="var(--csl-icon-accent, #ff5722)" fill-opacity=".35"/><path d="M11.25 9.75v1.5l1 1"/></svg>`,
      name: "process_log"
    },
    "SysSettings": {
      svg: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.75 4h6.25M12 4h2.25M1.75 8h1.25M7 8h7.25M1.75 12h7.25M13 12h1.25"/><g fill="var(--csl-icon-accent, #ff5722)" stroke="none"><circle cx="10" cy="4" r="2"/><circle cx="5" cy="8" r="2"/><circle cx="11" cy="12" r="2"/></g></svg>`,
      name: "sys_settings"
    },
    "Users": {
      svg: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.25 2.75a2.5 2.5 0 0 1 0 4.5M12.25 9.6c1.2.55 2 1.85 2 3.65"/><circle cx="6" cy="5" r="2.5" fill="var(--csl-icon-accent, #ff5722)" fill-opacity=".35"/><path d="M1.75 13.25c0-2.35 1.9-4 4.25-4s4.25 1.65 4.25 4z" fill="var(--csl-icon-accent, #ff5722)" fill-opacity=".35"/></svg>`,
      name: "users"
    },
    "Configuration": {
      svg: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1.75" y="1.75" width="12.5" height="12.5" rx="2.5"/><path d="M6 5.5L4 8l2 2.5M10 5.5l2 2.5-2 2.5M8.75 5l-1.5 6" stroke="var(--csl-icon-accent, #ff5722)"/></svg>`,
      name: "configuration"
    },
    "Settings": {
      svg: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.38 3.54L6.76 1.62L9.24 1.62L9.62 3.54L10.01 3.70L11.63 2.61L13.39 4.37L12.30 5.99L12.46 6.38L14.38 6.76L14.38 9.24L12.46 9.62L12.30 10.01L13.39 11.63L11.63 13.39L10.01 12.30L9.62 12.46L9.24 14.38L6.76 14.38L6.38 12.46L5.99 12.30L4.37 13.39L2.61 11.63L3.70 10.01L3.54 9.62L1.62 9.24L1.62 6.76L3.54 6.38L3.70 5.99L2.61 4.37L4.37 2.61L5.99 3.70z"/><circle cx="8" cy="8" r="2" fill="var(--csl-icon-accent, #ff5722)" stroke="none"/></svg>`,
      name: "settings"
    }
  };
  var ACTION_DETAILS = {
    "RestartApp": {
      file: "RestartApp.js",
      icon: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13.75 8A5.75 5.75 0 1 1 11.3 3.29"/><path d="M12.2 1.48l1.23 3.3-3.52-.02z" fill="var(--csl-icon-accent, #ff5722)" stroke="var(--csl-icon-accent, #ff5722)" stroke-width="1"/></svg>`,
      name: "refresh",
      desc: "Reload the Creatio application"
    },
    "FlushRedisDB": {
      file: "FlushRedisDB.js",
      icon: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="5.75" cy="3.5" rx="4" ry="1.75" fill="var(--csl-icon-accent, #ff5722)" fill-opacity=".35"/><path d="M1.75 3.5v8.5c0 .97 1.8 1.75 4 1.75"/><path d="M1.75 7.75c0 .97 1.8 1.75 4 1.75.55 0 1.05-.04 1.5-.1"/><path d="M9.75 3.5v3"/><g transform="rotate(20 12.25 11)"><path d="M12.25 1.75v7.25"/><path d="M10.5 9.25h3.5l1.25 5h-6z" fill="var(--csl-icon-accent, #ff5722)" stroke="var(--csl-icon-accent, #ff5722)"/></g></svg>`,
      name: "delete",
      desc: "Clear Redis database"
    },
    "EnableAutologin": {
      file: null,
      icon: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="5.5" r="3"/><path d="M8.4 7.6L2 14M3.25 12.75l1.5 1.5M5 11l1.25 1.25"/><path d="M9.5 12.25l1.5 1.5 3.25-3.5" stroke="var(--csl-icon-accent, #ff5722)" stroke-width="1.75"/></svg>`,
      name: "check",
      desc: "Enable autologin for this site"
    },
    "DisableAutologin": {
      file: null,
      icon: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="5.5" r="3"/><path d="M8.4 7.6L2 14M3.25 12.75l1.5 1.5M5 11l1.25 1.25"/><path d="M10 10l3.75 3.75M13.75 10L10 13.75" stroke="var(--csl-icon-accent, #ff5722)" stroke-width="1.75"/></svg>`,
      name: "block",
      desc: "Disable autologin for this site"
    },
    "Settings": {
      file: null,
      icon: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.38 3.54L6.76 1.62L9.24 1.62L9.62 3.54L10.01 3.70L11.63 2.61L13.39 4.37L12.30 5.99L12.46 6.38L14.38 6.76L14.38 9.24L12.46 9.62L12.30 10.01L13.39 11.63L11.63 13.39L10.01 12.30L9.62 12.46L9.24 14.38L6.76 14.38L6.38 12.46L5.99 12.30L4.37 13.39L2.61 11.63L3.70 10.01L3.54 9.62L1.62 9.24L1.62 6.76L3.54 6.38L3.70 5.99L2.61 4.37L4.37 2.61L5.99 3.70z"/><circle cx="8" cy="8" r="2" fill="var(--csl-icon-accent, #ff5722)" stroke="none"/></svg>`,
      name: "settings",
      desc: "Open plugin settings"
    }
  };
  var EXCLUDED_DOMAINS = [
    "gitlab.com",
    "github.com",
    "bitbucket.org",
    "google.com",
    "mail.google.com",
    "youtube.com",
    "atlassian.net",
    "upsource.creatio.com",
    "work.creatio.com",
    "community.creatio.com",
    "academy.creatio.com",
    "www.creatio.com",
    "marketplace.creatio.com",
    "partners.creatio.com",
    "events.creatio.com",
    "blog.creatio.com"
  ];
  var SHELL_URL_PATTERNS = [
    "/shell/",
    "/clientapp/",
    "#section",
    "#shell",
    "workspaceexplorer",
    "listpage",
    "cardpage",
    "dashboardmodule"
  ];

  // src/pageDetection.js
  function getCreatioPageType() {
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
      document.querySelector("#loginEdit-el"),
      document.querySelector("#passwordEdit-el"),
      document.querySelector(".login-button-login"),
      currentPath === "/login" || currentPath.startsWith("/login/"),
      currentPath === "/auth" || currentPath.startsWith("/auth/")
    ];
    if (loginIndicators.some(Boolean)) {
      debugLog("LOGIN PAGE DETECTED - Navigation/Actions buttons will be blocked");
      return "login";
    }
    if (document.querySelector("ts-workspace-section")) {
      debugLog("Configuration page detected");
      return "configuration";
    }
    const urlMatchesShell = SHELL_URL_PATTERNS.some((p) => currentUrl.includes(p.toLowerCase()));
    const shellSelectors = [
      document.getElementById("ShellContainerWithBackground"),
      document.querySelector("mainshell"),
      document.querySelector("crt-schema-outlet"),
      document.querySelector('[data-item-marker="AppToolbarGlobalSearch"]'),
      document.querySelector("crt-app-toolbar"),
      document.querySelector("crt-root"),
      document.querySelector("crt-page"),
      document.querySelector("crt-reusable-schema")
    ];
    const foundCount = shellSelectors.filter(Boolean).length;
    const minRequired = 1;
    debugLog(`Shell detection: ${foundCount}/${minRequired} indicators, URL match: ${urlMatchesShell}`);
    if (DEBUG) {
      const names = [
        "ShellContainerWithBackground",
        "mainshell",
        "crt-schema-outlet",
        "AppToolbarGlobalSearch",
        "crt-app-toolbar",
        "crt-root",
        "crt-page",
        "crt-reusable-schema"
      ];
      shellSelectors.forEach((el5, i) => {
        if (el5) debugLog(`\u2713 Found: ${names[i]}`);
      });
      if (urlMatchesShell) debugLog("\u2713 URL pattern matches Shell page");
    }
    if (foundCount >= minRequired || urlMatchesShell) {
      debugLog(`Shell page detected: ${foundCount} indicators, URL match: ${urlMatchesShell}`);
      return "shell";
    }
    debugLog(`Page not recognized (${foundCount}/${minRequired} indicators, URL match: ${urlMatchesShell})`);
    return null;
  }

  // src/state.js
  var state = {
    menuCreated: false,
    actionsMenuCreated: false,
    menuCreating: false,
    // true while DOM is being built — guards monitorButtons from interfering
    clickAbortController: null
  };
  function resetState() {
    state.menuCreated = false;
    state.actionsMenuCreated = false;
    state.menuCreating = false;
    state.clickAbortController?.abort();
    state.clickAbortController = null;
  }

  // src/menuVisibility.js
  function hideMenuContainer(menuContainer) {
    if (menuContainer) {
      menuContainer.classList.remove("visible");
      menuContainer.classList.add("hidden");
    }
  }
  function showMenuContainer(menuContainer) {
    if (menuContainer) {
      menuContainer.classList.remove("hidden");
      menuContainer.classList.add("visible");
    }
  }
  function adjustMenuPosition(relatedContainer, container) {
    container.style.top = "";
    container.style.left = "";
    container.style.right = "";
    container.style.bottom = "";
    container.style.transform = "none";
    container.style.position = "fixed";
    container.style.zIndex = "9999";
    const floating = relatedContainer.closest(".creatio-satelite-floating");
    if (floating) {
      const btnRect = relatedContainer.getBoundingClientRect();
      const extensionContainer = document.querySelector(".creatio-satelite-extension-container");
      if (extensionContainer && container.parentNode !== extensionContainer) {
        extensionContainer.appendChild(container);
      }
      container.style.position = "fixed";
      container.style.zIndex = "9999";
      container.style.visibility = "hidden";
      container.style.top = btnRect.bottom + 8 + "px";
      container.style.left = btnRect.left + "px";
      container.style.minWidth = btnRect.width + "px";
      container.offsetHeight;
      const menuRect = container.getBoundingClientRect();
      let newLeft = btnRect.left;
      let newTop = btnRect.bottom + 8;
      if (menuRect.right > window.innerWidth) {
        newLeft = Math.max(0, btnRect.right - menuRect.width);
      }
      if (menuRect.bottom > window.innerHeight) {
        newTop = btnRect.top - menuRect.height - 8;
      }
      container.style.top = newTop + "px";
      container.style.left = newLeft + "px";
      container.style.visibility = "visible";
      return;
    }
    const rect = relatedContainer.getBoundingClientRect();
    container.style.top = `${rect.bottom + 8}px`;
    container.style.left = `${rect.left}px`;
  }

  // src/positionManager.js
  var STABLE_CHECK_MS = 120;
  var lastTargetRect = /* @__PURE__ */ new WeakMap();
  function positionFloatingContainerRelativeToSearch(floatingContainer = document.querySelector(".creatio-satelite-floating")) {
    if (!floatingContainer) {
      debugLog("Cannot position floating container - not found");
      return false;
    }
    if (floatingContainer.hasAttribute("data-user-positioned")) {
      debugLog("Container was manually positioned, skipping auto-positioning");
      return true;
    }
    let searchElement = document.querySelector("crt-global-search") || document.querySelector('[data-item-marker="GlobalSearch"]') || document.querySelector(".global-search") || document.querySelector('input[placeholder*="Search"], input[placeholder*="search"]');
    const actionButton = document.querySelector("button[mat-button].action-button");
    const targetElement = searchElement || actionButton;
    if (!targetElement) {
      if (floatingContainer.hasAttribute("data-auto-restored")) {
        debugLog("Anchor not ready, keeping restored position");
        return true;
      }
      const containerRect2 = floatingContainer.getBoundingClientRect();
      const centerX = (window.innerWidth - containerRect2.width) / 2;
      floatingContainer.style.left = centerX + "px";
      floatingContainer.style.top = "16px";
      floatingContainer.style.right = "auto";
      floatingContainer.setAttribute("data-fallback-position", "true");
      debugLog(`Fallback positioning: center horizontally (${centerX}px)`);
      return true;
    }
    floatingContainer.removeAttribute("data-fallback-position");
    const targetRect = targetElement.getBoundingClientRect();
    const containerRect = floatingContainer.getBoundingClientRect();
    if (targetRect.width < 20 || targetRect.height < 10) {
      debugLog(`Target element too small: ${targetRect.width}x${targetRect.height}`);
      return false;
    }
    const computed = window.getComputedStyle(targetElement);
    if (computed.display === "none" || computed.visibility === "hidden" || computed.opacity === "0") {
      debugLog("Target element not visible");
      return false;
    }
    if (targetRect.top < 0 || targetRect.left < 0 || targetRect.bottom > window.innerHeight || targetRect.right > window.innerWidth) {
      debugLog("Target element outside viewport");
      return false;
    }
    const rectKey = `${Math.round(targetRect.left)},${Math.round(targetRect.right)},${Math.round(targetRect.top)}`;
    const now = Date.now();
    const seen = lastTargetRect.get(floatingContainer);
    if (!seen || seen.key !== rectKey) {
      lastTargetRect.set(floatingContainer, { key: rectKey, since: now });
      setTimeout(() => positionFloatingContainerRelativeToSearch(floatingContainer), STABLE_CHECK_MS);
      debugLog("Target element still moving, retrying");
      return false;
    }
    if (now - seen.since < STABLE_CHECK_MS) {
      debugLog("Target element not stable long enough yet");
      return false;
    }
    const leftPosition = targetRect.right + 20;
    const topPosition = targetRect.top + (targetRect.height - containerRect.height) / 2 - 20;
    const finalLeft = Math.min(window.innerWidth - containerRect.width - 10, leftPosition);
    const finalTop = Math.max(10, Math.min(window.innerHeight - containerRect.height - 10, topPosition));
    floatingContainer.style.left = finalLeft + "px";
    floatingContainer.style.top = finalTop + "px";
    floatingContainer.style.right = "auto";
    floatingContainer.removeAttribute("data-auto-restored");
    saveAutoPosition(floatingContainer.getAttribute("data-page-type"), finalLeft, finalTop);
    debugLog(`Positioned container: left=${finalLeft}, top=${finalTop}`);
    return true;
  }
  var autoPositionKey = (pageType) => `menuAutoPosition_${pageType}_${window.location.origin}`;
  var lastSavedAuto = null;
  function saveAutoPosition(pageType, x, y) {
    if (!pageType) return;
    const key = autoPositionKey(pageType);
    const vw = window.innerWidth;
    if (lastSavedAuto && lastSavedAuto.key === key && lastSavedAuto.x === x && lastSavedAuto.y === y && lastSavedAuto.vw === vw) return;
    lastSavedAuto = { key, x, y, vw };
    chrome.storage.local.set({ [key]: { x, y, vw, timestamp: Date.now() } }, () => {
      const err = getLastError();
      if (err) console.error("[Clio Satellite] Failed to save auto position:", err.message);
    });
  }
  function loadAutoPosition(pageType, callback) {
    const key = autoPositionKey(pageType);
    chrome.storage.local.get([key], (result) => {
      const err = getLastError();
      const pos = err ? null : result[key];
      if (!pos || pos.vw !== window.innerWidth) {
        callback(null);
        return;
      }
      callback(pos);
    });
  }
  function applyAutoPosition(floatingContainer, pos) {
    const containerRect = floatingContainer.getBoundingClientRect();
    const x = Math.max(10, Math.min(window.innerWidth - containerRect.width - 10, pos.x));
    const y = Math.max(10, Math.min(window.innerHeight - containerRect.height - 10, pos.y));
    floatingContainer.style.left = x + "px";
    floatingContainer.style.top = y + "px";
    floatingContainer.style.right = "auto";
    floatingContainer.setAttribute("data-auto-restored", "true");
    debugLog(`Restored auto position: x=${x}, y=${y}`);
  }
  function saveMenuPosition(x, y, pageType) {
    const key = `menuPosition_${pageType}_${window.location.origin}`;
    chrome.storage.local.set({ [key]: { x, y, timestamp: Date.now() } }, () => {
      const err = getLastError();
      if (err) {
        console.error("[Clio Satellite] Failed to save position:", err.message);
        return;
      }
      debugLog(`Position saved for ${pageType}: x=${x}, y=${y}`);
    });
  }
  function loadMenuPosition(pageType, callback) {
    const key = `menuPosition_${pageType}_${window.location.origin}`;
    chrome.storage.local.get([key], (result) => {
      const err = getLastError();
      if (err) {
        console.error("[Clio Satellite] Failed to load position:", err.message);
        callback(null, null);
        return;
      }
      const position = result[key];
      if (position) {
        const thirtyDays = 30 * 24 * 60 * 60 * 1e3;
        if (Date.now() - position.timestamp < thirtyDays) {
          debugLog(`Position loaded for ${pageType}: x=${position.x}, y=${position.y}`);
          callback(position.x, position.y);
          return;
        }
        chrome.storage.local.remove([key], () => {
          const err2 = getLastError();
          if (err2) {
            console.error("[Clio Satellite] Failed to remove stale position:", err2.message);
          }
        });
      }
      callback(null, null);
    });
  }
  function applySavedPosition(floatingContainer, x, y) {
    const containerRect = floatingContainer.getBoundingClientRect();
    const maxX = window.innerWidth - containerRect.width - 10;
    const maxY = window.innerHeight - containerRect.height - 10;
    const finalX = Math.max(10, Math.min(maxX, x));
    const finalY = Math.max(10, Math.min(maxY, y));
    floatingContainer.style.left = finalX + "px";
    floatingContainer.style.top = finalY + "px";
    floatingContainer.style.right = "auto";
    floatingContainer.setAttribute("data-user-positioned", "true");
    debugLog(`Applied saved position: x=${finalX}, y=${finalY}`);
    return true;
  }

  // src/floatingContainer.js
  var resizeAbortController = null;
  function setupFloatingContainer(pageType, buttonWrapper, extensionContainer) {
    resizeAbortController?.abort();
    resizeAbortController = new AbortController();
    const isShell = pageType === "shell";
    const floatingContainer = document.createElement("div");
    floatingContainer.className = "creatio-satelite-floating";
    floatingContainer.setAttribute("data-page-type", pageType);
    floatingContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: row;
    gap: 8px;
    cursor: move;
    user-select: none;
    width: auto;
    height: auto;
    background: transparent;
    padding: 0;
    min-width: auto;
    max-width: none;
    box-sizing: border-box;
    pointer-events: auto;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
    let isDragging = false;
    let startX, startY, initialX, initialY;
    floatingContainer.addEventListener("mousedown", (e) => {
      if (e.target === floatingContainer || e.target.closest(".creatio-satelite")) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = floatingContainer.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        floatingContainer.style.cursor = "grabbing";
        e.preventDefault();
        const onMouseMove = (e2) => {
          const newX = Math.max(0, Math.min(window.innerWidth - floatingContainer.offsetWidth, initialX + e2.clientX - startX));
          const newY = Math.max(0, Math.min(window.innerHeight - floatingContainer.offsetHeight, initialY + e2.clientY - startY));
          floatingContainer.style.left = newX + "px";
          floatingContainer.style.top = newY + "px";
          floatingContainer.style.right = "auto";
        };
        const onMouseUp = () => {
          isDragging = false;
          floatingContainer.style.cursor = "move";
          floatingContainer.setAttribute("data-user-positioned", "true");
          const rect2 = floatingContainer.getBoundingClientRect();
          saveMenuPosition(rect2.left, rect2.top, pageType);
          debugLog(`${isShell ? "Shell" : "Configuration"} container manually positioned`);
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
        };
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      }
    });
    floatingContainer.appendChild(buttonWrapper);
    extensionContainer.appendChild(floatingContainer);
    buttonWrapper.classList.add(isShell ? "creatio-satelite-shell" : "creatio-satelite-configuration");
    buttonWrapper.style.flexDirection = "row";
    floatingContainer.addEventListener("dblclick", (e) => {
      if (e.target === floatingContainer || e.target.closest(".creatio-satelite")) {
        floatingContainer.removeAttribute("data-user-positioned");
        floatingContainer.removeAttribute("data-fallback-position");
        const key = `menuPosition_${pageType}_${window.location.origin}`;
        chrome.storage.local.remove([key], () => {
          const err = getLastError();
          if (err) {
            console.error("[Clio Satellite] Failed to clear position:", err.message);
            return;
          }
          debugLog(`${isShell ? "Shell" : "Configuration"} container: position cleared`);
        });
        setTimeout(() => positionFloatingContainerRelativeToSearch(floatingContainer), 10);
        e.preventDefault();
      }
    });
    loadMenuPosition(pageType, (savedX, savedY) => {
      if (savedX !== null && savedY !== null) {
        if (applySavedPosition(floatingContainer, savedX, savedY)) {
          setTimeout(() => {
            floatingContainer.style.opacity = "1";
          }, 50);
          debugLog(`${isShell ? "Shell" : "Configuration"} container positioned from saved coordinates`);
          return;
        }
      }
      let positionAttempted = false;
      const attemptPositioning = () => {
        if (positionAttempted) return;
        positionAttempted = true;
        positionFloatingContainerRelativeToSearch(floatingContainer);
        setTimeout(() => {
          floatingContainer.style.opacity = "1";
        }, 50);
      };
      loadAutoPosition(pageType, (pos) => {
        if (!pos || floatingContainer.hasAttribute("data-user-positioned")) return;
        applyAutoPosition(floatingContainer, pos);
        floatingContainer.style.opacity = "1";
      });
      setTimeout(attemptPositioning, isShell ? 100 : 200);
      if (isShell) {
        setTimeout(() => {
          if (!positionAttempted) floatingContainer.style.opacity = "1";
        }, 1e3);
        [300, 800, 1500, 2500].forEach(
          (ms) => setTimeout(() => positionFloatingContainerRelativeToSearch(floatingContainer), ms)
        );
      }
    });
    window.addEventListener("resize", () => {
      if (!isDragging && !floatingContainer.hasAttribute("data-user-positioned")) {
        positionFloatingContainerRelativeToSearch(floatingContainer);
      }
    }, { signal: resizeAbortController.signal });
    let positionCheckCount = 0;
    const maxPositionChecks = isShell ? 40 : 20;
    const positionCheckInterval = setInterval(() => {
      if (floatingContainer.hasAttribute("data-user-positioned")) {
        clearInterval(positionCheckInterval);
        return;
      }
      positionCheckCount++;
      const positioned = positionFloatingContainerRelativeToSearch(floatingContainer);
      if (positioned || positionCheckCount >= maxPositionChecks) {
        clearInterval(positionCheckInterval);
      }
    }, isShell ? 100 : 150);
    if (isShell) {
      const observer = new MutationObserver(() => {
        if (floatingContainer.hasAttribute("data-user-positioned")) {
          observer.disconnect();
          return;
        }
        const searchElement = document.querySelector("crt-global-search");
        if (searchElement && !floatingContainer.hasAttribute("data-positioned")) {
          if (positionFloatingContainerRelativeToSearch(floatingContainer)) {
            floatingContainer.setAttribute("data-positioned", "true");
            observer.disconnect();
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 1e4);
    }
    debugLog(`${isShell ? "Shell" : "Configuration"} floating container created`);
    return floatingContainer;
  }

  // src/news/newsCore.js
  var FEED_HOSTS = ["advance-technologies-foundation.github.io"];
  var MEDIA_HOSTS = [...FEED_HOSTS, "i.ytimg.com"];
  var CTA_HOSTS = [
    "github.com",
    "advance-technologies-foundation.github.io",
    "academy.creatio.com",
    "community.creatio.com",
    "www.youtube.com",
    "youtu.be"
  ];
  var ALL_AUDIENCES = ["admin", "developer", "other"];
  var TYPES = ["release", "tip", "event", "breaking"];
  var MAX_VISIBLE = 5;
  var TITLE_MAX = 60;
  var BODY_MAX = 140;
  var DOT_DECAY_DAYS = 7;
  var DOT_DECAY_LOADS = 10;
  var PEEK_GAP_MS = 24 * 60 * 60 * 1e3;
  var ONBOARDING_KEEP = 3;
  var ONBOARDING_WINDOW_DAYS = 30;
  var HOUR = 60 * 60 * 1e3;
  var VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
  function httpsUrlOnHosts(value, hosts) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && hosts.includes(url.hostname) ? url.href : null;
    } catch {
      return null;
    }
  }
  var isText = (v) => typeof v === "string" && v.trim().length > 0;
  var isDate = (v) => typeof v === "string" && !Number.isNaN(Date.parse(v));
  var clip = (s, max) => s.length > max ? `${s.slice(0, max - 1).trimEnd()}\u2026` : s;
  function cleanMedia(media) {
    if (!media || typeof media !== "object") return void 0;
    if (media.type === "image") {
      const url = httpsUrlOnHosts(media.url, MEDIA_HOSTS);
      return url && isText(media.alt) ? { type: "image", url, alt: media.alt } : void 0;
    }
    if (media.type === "youtube" && VIDEO_ID.test(media.videoId || "") && isText(media.title)) {
      const out = { type: "youtube", videoId: media.videoId, title: media.title, player: media.player === "link" ? "link" : "embed" };
      const poster = media.poster && httpsUrlOnHosts(media.poster, MEDIA_HOSTS);
      if (poster) out.poster = poster;
      if (Number.isInteger(media.start) && media.start > 0) out.start = media.start;
      return out;
    }
    return void 0;
  }
  function cleanTrending(trending) {
    if (!trending || typeof trending !== "object") return void 0;
    const out = {};
    if (Number.isInteger(trending.hours) && trending.hours >= 1 && trending.hours <= 720) out.hours = trending.hours;
    if (isDate(trending.until)) out.until = trending.until;
    return Object.keys(out).length ? out : void 0;
  }
  function validateFeed(feed) {
    const result = { items: [], refreshHours: void 0, movedTo: void 0 };
    if (!feed || feed.schemaVersion !== 1 || !Array.isArray(feed.items)) return result;
    if (Number.isInteger(feed.refreshHours) && feed.refreshHours >= 1 && feed.refreshHours <= 24) {
      result.refreshHours = feed.refreshHours;
    }
    result.movedTo = httpsUrlOnHosts(feed.movedTo, FEED_HOSTS) || void 0;
    for (const raw of feed.items) {
      if (!raw || !isText(raw.id) || !TYPES.includes(raw.type) || !isText(raw.title)) continue;
      if (!isDate(raw.publishedAt) || !isDate(raw.expiresAt)) continue;
      const item = {
        id: raw.id,
        type: raw.type,
        priority: raw.priority === "critical" ? "critical" : "normal",
        title: clip(raw.title.trim(), TITLE_MAX),
        publishedAt: raw.publishedAt,
        expiresAt: raw.expiresAt,
        audiences: Array.isArray(raw.audiences) && raw.audiences.length ? raw.audiences.filter((a) => ALL_AUDIENCES.includes(a)) : [...ALL_AUDIENCES],
        surfaces: Array.isArray(raw.surfaces) && raw.surfaces.length ? raw.surfaces : ["login", "shell"]
      };
      if (isText(raw.body)) item.body = clip(raw.body.trim(), BODY_MAX);
      if (raw.cta && isText(raw.cta.label)) {
        const url = httpsUrlOnHosts(raw.cta.url, CTA_HOSTS);
        if (url) item.cta = { label: raw.cta.label, url };
      }
      const trending = item.priority === "critical" ? void 0 : cleanTrending(raw.trending);
      if (trending) item.trending = trending;
      const media = cleanMedia(raw.media);
      if (media) item.media = media;
      if (typeof raw.minVersion === "string") item.minVersion = raw.minVersion;
      if (!item.audiences.length) continue;
      result.items.push(item);
    }
    return result;
  }
  function compareVersions(a, b) {
    const pa = String(a).split(".").map(Number);
    const pb = String(b).split(".").map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const d = (pa[i] || 0) - (pb[i] || 0);
      if (d) return Math.sign(d);
    }
    return 0;
  }
  function isUnreadSignal(item, { now, read = {}, firstShown = {} }) {
    if (read[item.id]) return false;
    if (!item.trending) return true;
    const ends = [];
    if (item.trending.until) ends.push(Date.parse(item.trending.until));
    if (item.trending.hours) ends.push((firstShown[item.id] ?? now) + item.trending.hours * HOUR);
    return now < Math.min(...ends);
  }
  function onboardingSkip(items, { now }) {
    const windowStart = now - ONBOARDING_WINDOW_DAYS * 24 * HOUR;
    const live = items.filter((i) => Date.parse(i.publishedAt) <= now && now < Date.parse(i.expiresAt)).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
    const keep = new Set(live.filter((i) => i.priority !== "critical" && Date.parse(i.publishedAt) >= windowStart).slice(0, ONBOARDING_KEEP).map((i) => i.id));
    return live.filter((i) => i.priority !== "critical" && !keep.has(i.id)).map((i) => i.id);
  }
  function selectVisible(items, { now, surface, audiences = ALL_AUDIENCES, extensionVersion: extensionVersion2, read = {}, firstShown = {}, skipped = {} }) {
    const chosen = new Set(audiences.length ? audiences : ALL_AUDIENCES);
    const visible = items.filter((item) => !skipped[item.id] && Date.parse(item.publishedAt) <= now && now < Date.parse(item.expiresAt) && item.surfaces.includes(surface) && (!item.minVersion || !extensionVersion2 || compareVersions(extensionVersion2, item.minVersion) >= 0) && (item.priority === "critical" || item.audiences.some((a) => chosen.has(a))));
    const trendingNow = (item) => Boolean(item.trending) && isUnreadSignal(item, { now, read: {}, firstShown });
    return visible.sort((a, b) => (b.priority === "critical") - (a.priority === "critical") || trendingNow(b) - trendingNow(a) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, MAX_VISIBLE);
  }
  function unreadItems(visible, state2) {
    return visible.filter((item) => isUnreadSignal(item, state2));
  }
  function isTrendingNow(item, { now, firstShown = {} }) {
    return Boolean(item.trending) && isUnreadSignal(item, { now, read: {}, firstShown });
  }
  function shouldShowDot(unread, { now, noticed = {} }) {
    return unread.some((item) => {
      const n = noticed[item.id];
      if (n?.noticedAt) return false;
      if (item.trending || !n) return true;
      return now - n.firstDotAt < DOT_DECAY_DAYS * 24 * HOUR && (n.shellLoads || 0) < DOT_DECAY_LOADS;
    });
  }
  function pickPeek(unread, { now, autoOpened = {}, lastPeekAt = 0, pageType }) {
    if (pageType !== "shell") return null;
    if (now - lastPeekAt < PEEK_GAP_MS) return null;
    return unread.find((item) => item.priority === "critical" && !autoOpened[item.id]) || null;
  }
  function pickAutoExpand(unread, { autoOpened = {} }) {
    return unread.find((item) => item.priority === "critical" && !autoOpened[item.id]) || null;
  }
  function youtubeEmbedUrl(media, origin) {
    const params = new URLSearchParams({ autoplay: "1", rel: "0", playsinline: "1", enablejsapi: "1" });
    if (origin) params.set("origin", origin);
    if (media.start) params.set("start", String(media.start));
    return `https://www.youtube-nocookie.com/embed/${media.videoId}?${params}`;
  }
  function youtubeWatchUrl(media) {
    return `https://www.youtube.com/watch?v=${media.videoId}${media.start ? `&t=${media.start}s` : ""}`;
  }
  function youtubePosterUrl(media) {
    return media.poster || `https://i.ytimg.com/vi/${media.videoId}/hqdefault.jpg`;
  }

  // src/news/newsStore.js
  var SYNC_DEFAULTS = {
    newsEnabled: true,
    newsAudiences: ["admin", "developer", "other"],
    newsRead: {},
    newsFirstShown: {},
    newsAutoOpened: {},
    newsSkipped: {},
    // items hidden at the first run (backlog of a new user)
    newsOnboardedAt: 0
    // when this browser profile first received the feed
  };
  var LOCAL_DEFAULTS = { newsNoticed: {} };
  var NEWS_KEYS = [...Object.keys(SYNC_DEFAULTS), ...Object.keys(LOCAL_DEFAULTS)];
  function alive() {
    try {
      return Boolean(chrome?.runtime?.id ?? chrome?.storage);
    } catch {
      return false;
    }
  }
  function syncGet(defaults) {
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.get(defaults, (data) => resolve(data || { ...defaults }));
      } catch {
        resolve({ ...defaults });
      }
    });
  }
  function localGet(defaults) {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(defaults, (data) => resolve({ ...defaults, ...data || {} }));
      } catch {
        resolve({ ...defaults });
      }
    });
  }
  function set(area, data) {
    return new Promise((resolve) => {
      try {
        chrome.storage[area].set(data, () => resolve());
      } catch {
        resolve();
      }
    });
  }
  async function loadState() {
    const [sync, local] = await Promise.all([syncGet(SYNC_DEFAULTS), localGet(LOCAL_DEFAULTS)]);
    return {
      enabled: sync.newsEnabled !== false,
      audiences: Array.isArray(sync.newsAudiences) && sync.newsAudiences.length ? sync.newsAudiences : SYNC_DEFAULTS.newsAudiences,
      read: sync.newsRead || {},
      firstShown: sync.newsFirstShown || {},
      autoOpened: sync.newsAutoOpened || {},
      lastPeekAt: sync.newsAutoOpened?.lastPeekAt || 0,
      noticed: local.newsNoticed || {},
      skipped: sync.newsSkipped || {},
      onboardedAt: sync.newsOnboardedAt || 0
    };
  }
  async function completeOnboarding(skipIds, now = Date.now()) {
    const skipped = Object.fromEntries(skipIds.map((id) => [id, now]));
    await set("sync", { newsSkipped: skipped, newsOnboardedAt: now });
    return skipped;
  }
  async function updateSync(key, change) {
    const data = await syncGet({ [key]: SYNC_DEFAULTS[key] });
    const next = change({ ...data[key] });
    if (next) await set("sync", { [key]: next });
  }
  async function updateLocal(key, change) {
    const data = await localGet({ [key]: LOCAL_DEFAULTS[key] });
    const next = change({ ...data[key] });
    if (next) await set("local", { [key]: next });
  }
  function markRead(ids, now = Date.now()) {
    if (!ids.length) return Promise.resolve();
    return updateSync("newsRead", (map) => {
      let changed = false;
      for (const id of ids) if (!map[id]) {
        map[id] = now;
        changed = true;
      }
      return changed ? map : null;
    });
  }
  function recordFirstShown(ids, now = Date.now()) {
    if (!ids.length) return Promise.resolve();
    return updateSync("newsFirstShown", (map) => {
      let changed = false;
      for (const id of ids) if (!map[id]) {
        map[id] = now;
        changed = true;
      }
      return changed ? map : null;
    });
  }
  function markAutoOpened(id, { peek = false, now = Date.now() } = {}) {
    return updateSync("newsAutoOpened", (map) => {
      map[id] = true;
      if (peek) map.lastPeekAt = now;
      return map;
    });
  }
  function recordDotShown(ids, now = Date.now()) {
    if (!ids.length) return Promise.resolve();
    return updateLocal("newsNoticed", (map) => {
      for (const id of ids) {
        const entry = map[id] || { firstDotAt: now, shellLoads: 0 };
        entry.shellLoads = (entry.shellLoads || 0) + 1;
        map[id] = entry;
      }
      return map;
    });
  }
  function markNoticed(ids, now = Date.now()) {
    if (!ids.length) return Promise.resolve();
    return updateLocal("newsNoticed", (map) => {
      for (const id of ids) map[id] = { ...map[id] || { firstDotAt: now, shellLoads: 0 }, noticedAt: now };
      return map;
    });
  }
  async function pruneTo(ids) {
    const keep = new Set(ids);
    const prune = (map) => {
      let changed = false;
      for (const id of Object.keys(map)) {
        if (id !== "lastPeekAt" && !keep.has(id)) {
          delete map[id];
          changed = true;
        }
      }
      return changed ? map : null;
    };
    await updateSync("newsRead", prune);
    await updateSync("newsFirstShown", prune);
    await updateSync("newsAutoOpened", prune);
    await updateSync("newsSkipped", prune);
    await updateLocal("newsNoticed", prune);
  }
  function onNewsStorageChange(callback) {
    try {
      chrome.storage.onChanged?.addListener((changes) => {
        if (Object.keys(changes).some((k) => NEWS_KEYS.includes(k))) callback();
      });
    } catch {
    }
  }
  function send(message) {
    return new Promise((resolve) => {
      if (!alive()) {
        resolve(null);
        return;
      }
      try {
        chrome.runtime.sendMessage(message, (response) => {
          try {
            void chrome.runtime.lastError;
          } catch {
          }
          resolve(response ?? null);
        });
      } catch {
        resolve(null);
      }
    });
  }
  async function requestFeed() {
    const response = await send({ action: "getNews" });
    if (!response?.ok || typeof response.raw !== "string") return null;
    try {
      return JSON.parse(response.raw);
    } catch {
      return null;
    }
  }
  async function requestMedia(url) {
    const response = await send({ action: "getNewsMedia", url });
    return response?.ok ? response.dataUrl : null;
  }
  function openOptions() {
    return send({ action: "openOptionsPage" });
  }

  // src/news/newsModel.js
  function extensionVersion() {
    try {
      return chrome.runtime.getManifest?.().version;
    } catch {
      return void 0;
    }
  }
  var pruned = false;
  async function loadSurface(surface, { now = Date.now() } = {}) {
    const state2 = await loadState();
    if (!state2.enabled) return null;
    const raw = await requestFeed();
    if (!raw) return null;
    const { items } = validateFeed(raw);
    if (!state2.onboardedAt) {
      state2.skipped = await completeOnboarding(onboardingSkip(items, { now }), now);
    }
    if (!pruned && items.length) {
      pruned = true;
      pruneTo(items.map((i) => i.id));
    }
    const visible = selectVisible(items, {
      now,
      surface,
      audiences: state2.audiences,
      extensionVersion: extensionVersion(),
      read: state2.read,
      firstShown: state2.firstShown,
      skipped: state2.skipped
    });
    if (!visible.length) return null;
    const ctx = { now, read: state2.read, firstShown: state2.firstShown };
    return { visible, unread: unreadItems(visible, ctx), ctx, state: state2 };
  }

  // src/news/videoDialog.js
  var EMBED_ORIGIN = "https://www.youtube-nocookie.com";
  var open = null;
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== void 0) node.textContent = text;
    return node;
  }
  function showFallback(screen, media) {
    screen.textContent = "";
    screen.classList.add("csl-news-video__screen--fallback");
    const msg = el("div", "csl-news-video__fallback");
    const link = el("a", "csl-news-video__watch", "Watch on YouTube \u2197");
    link.href = youtubeWatchUrl(media);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    msg.append(el("span", "", "This video can't play on this page."), link);
    screen.appendChild(msg);
  }
  function closeVideoDialog() {
    if (!open) return;
    const { backdrop, returnFocus, cleanup } = open;
    open = null;
    cleanup();
    backdrop.remove();
    returnFocus?.focus?.();
  }
  function openVideoDialog(media, { returnFocus } = {}) {
    closeVideoDialog();
    const backdrop = el("div", "csl-news-video");
    const dialog = el("div", "csl-news-video__dialog");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-label", media.title);
    const head = el("div", "csl-news-video__head");
    const close = el("button", "csl-news-video__close", "\xD7");
    close.type = "button";
    close.setAttribute("aria-label", "Close video");
    head.append(el("strong", "", media.title), close);
    const screen = el("div", "csl-news-video__screen");
    const iframe = document.createElement("iframe");
    const embedUrl = youtubeEmbedUrl(media, window.location.origin);
    iframe.src = embedUrl;
    iframe.title = media.title;
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    screen.appendChild(iframe);
    const foot = el("div", "csl-news-video__foot");
    const watch = el("a", "csl-news-video__link", "Watch on YouTube \u2197");
    watch.href = youtubeWatchUrl(media);
    watch.target = "_blank";
    watch.rel = "noopener noreferrer";
    foot.appendChild(watch);
    dialog.append(head, screen, foot);
    backdrop.appendChild(dialog);
    const onViolation = (event) => {
      if (String(event.blockedURI || "").startsWith(EMBED_ORIGIN)) showFallback(screen, media);
    };
    const onMessage = (event) => {
      if (event.origin !== EMBED_ORIGIN || event.source !== iframe.contentWindow) return;
      let data;
      try {
        data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (data?.event === "onError") showFallback(screen, media);
    };
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeVideoDialog();
        return;
      }
      if (event.key === "Tab") {
        const focusable = [...dialog.querySelectorAll("button, a[href], iframe")];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    iframe.addEventListener("load", () => {
      try {
        iframe.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), EMBED_ORIGIN);
      } catch {
      }
    });
    document.addEventListener("securitypolicyviolation", onViolation);
    window.addEventListener("message", onMessage);
    document.addEventListener("keydown", onKey, true);
    close.addEventListener("click", closeVideoDialog);
    backdrop.addEventListener("click", (event) => {
      event.stopPropagation();
      if (event.target === backdrop) closeVideoDialog();
    });
    open = {
      backdrop,
      returnFocus,
      cleanup: () => {
        document.removeEventListener("securitypolicyviolation", onViolation);
        window.removeEventListener("message", onMessage);
        document.removeEventListener("keydown", onKey, true);
      }
    };
    document.documentElement.appendChild(backdrop);
    close.focus();
    return backdrop;
  }

  // src/news/newsCards.js
  var TAGS = { release: "Release", tip: "Tip", event: "Event", breaking: "Breaking" };
  var TRENDING_ICON = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M1.5 8.5l3-3 2 2 4-4M7.5 3.5h3v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function formatDate(iso) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  }
  function el2(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== void 0) node.textContent = text;
    return node;
  }
  function externalLink(className, href, text) {
    const a = el2("a", className, text);
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return a;
  }
  function loadImage(img, url, container) {
    requestMedia(url).then((dataUrl) => {
      if (dataUrl) img.src = dataUrl;
      else container.remove();
    });
  }
  function renderMedia(item, { onVideoStart }) {
    const media = item.media;
    if (media.type === "image") {
      const box = el2("div", "csl-news-media csl-news-media--image");
      const img2 = el2("img");
      img2.alt = media.alt;
      img2.decoding = "async";
      box.appendChild(img2);
      loadImage(img2, media.url, box);
      return box;
    }
    const embed = media.player !== "link";
    const poster = embed ? el2("button", "csl-news-media csl-news-media--video") : externalLink("csl-news-media csl-news-media--video", youtubeWatchUrl(media));
    if (embed) poster.type = "button";
    poster.setAttribute("aria-label", `${embed ? "Play video" : "Watch on YouTube"}: ${media.title}`);
    const img = el2("img");
    img.alt = "";
    poster.append(img, el2("span", "csl-news-media__play"), el2("span", "csl-news-media__label", "YouTube"));
    loadImage(img, youtubePosterUrl(media), img);
    if (embed) {
      poster.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openVideoDialog(media, { returnFocus: poster });
        onVideoStart?.(item);
      });
    }
    return poster;
  }
  function renderCards(list, items, state2, { onVideoStart } = {}) {
    list.textContent = "";
    for (const item of items) {
      const unread = isUnreadSignal(item, state2);
      const card = el2("li", `csl-news-card${unread ? " csl-news-card--unread" : ""}${item.priority === "critical" ? " csl-news-card--critical" : ""}`);
      card.dataset.newsId = item.id;
      const dot = el2("span", "csl-news-card__dot");
      dot.setAttribute("aria-hidden", "true");
      const body = el2("div", "csl-news-card__body");
      const meta = el2("div", "csl-news-card__meta");
      meta.append(el2("span", `csl-news-tag csl-news-tag--${item.type}`, TAGS[item.type]), el2("span", "", formatDate(item.publishedAt)));
      if (isTrendingNow(item, state2)) {
        const trend = el2("span", "csl-news-trend");
        trend.innerHTML = TRENDING_ICON;
        trend.appendChild(document.createTextNode("Trending"));
        meta.appendChild(trend);
      }
      if (unread) meta.appendChild(el2("span", "csl-news-sr", "Unread"));
      body.append(meta, el2("h4", "csl-news-card__title", item.title));
      if (item.media) body.appendChild(renderMedia(item, { onVideoStart }));
      if (item.body) body.appendChild(el2("p", "csl-news-card__text", item.body));
      if (item.cta) body.appendChild(externalLink("csl-news-card__cta", item.cta.url, `${item.cta.label} \u2192`));
      card.append(dot, body);
      list.appendChild(card);
    }
  }
  function newsIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h13v14H6a2 2 0 0 1-2-2V5z"/><path d="M17 9h3v8a2 2 0 0 1-2 2"/><path d="M8 9h5"/><path d="M8 13h5"/><path d="M8 16h3"/></svg>';
  }
  var ARCHIVE_URL = "https://advance-technologies-foundation.github.io/clio-news-feed/";

  // src/news/shellIndicator.js
  var RERENDER_MS = 10 * 60 * 1e3;
  var PEEK_MS = 1e4;
  var PEEK_AFTER_HOVER_MS = 3e3;
  var FLYOUT_WIDTH = 320;
  var ui = {
    menuButton: null,
    menuContainer: null,
    buttonWrapper: null,
    pageType: "shell",
    dot: null,
    row: null,
    rowSep: null,
    pill: null,
    preview: null,
    flyout: null,
    list: null,
    peek: null,
    model: null,
    flyoutOpen: false,
    loadCounted: false,
    peekChecked: false,
    subscribed: false,
    observer: null,
    peekTimer: null
  };
  function el3(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== void 0) node.textContent = text;
    return node;
  }
  function buildRow() {
    const row = el3("button", "csl-news-row");
    row.type = "button";
    row.setAttribute("role", "menuitem");
    row.setAttribute("aria-haspopup", "true");
    row.setAttribute("aria-expanded", "false");
    const icon = el3("span", "csl-news-row__icon");
    icon.innerHTML = newsIcon();
    const text = el3("span", "csl-news-row__text");
    const title = el3("span", "csl-news-row__title", "What's new");
    const pill = el3("span", "csl-news-pill");
    title.appendChild(pill);
    const preview = el3("span", "csl-news-row__preview");
    text.append(title, preview);
    const chevron = el3("span", "csl-news-row__chevron");
    chevron.innerHTML = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M4.5 3l3 3-3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    row.append(icon, text, chevron);
    row.addEventListener("click", (event) => {
      event.stopPropagation();
      setFlyout(!ui.flyoutOpen);
    });
    return { row, pill, preview };
  }
  function buildFlyout() {
    const flyout = el3("div", "csl-news csl-news--dark csl-news-flyout");
    flyout.setAttribute("role", "region");
    flyout.setAttribute("aria-label", "Developer news");
    flyout.hidden = true;
    const head = el3("div", "csl-news-panel__head");
    const markAll = el3("button", "csl-news-linkbtn", "Mark all as read");
    markAll.type = "button";
    head.append(el3("strong", "", "Dev tools news"), markAll);
    const list = el3("ul", "csl-news-list");
    const foot = el3("div", "csl-news-panel__foot");
    const all = el3("a", "", "All news \u2192");
    all.href = ARCHIVE_URL;
    all.target = "_blank";
    all.rel = "noopener noreferrer";
    const topics = el3("button", "csl-news-linkbtn", "Choose topics");
    topics.type = "button";
    foot.append(all, topics);
    flyout.append(head, list, foot);
    flyout.addEventListener("click", (event) => event.stopPropagation());
    markAll.addEventListener("click", () => {
      if (ui.model) markRead(ui.model.visible.map((i) => i.id)).then(render);
    });
    topics.addEventListener("click", () => openOptions());
    return { flyout, list };
  }
  function placeFlyout() {
    const rect = ui.menuContainer.getBoundingClientRect();
    const roomRight = window.innerWidth - rect.right;
    ui.flyout.classList.toggle("csl-news-flyout--left", roomRight < FLYOUT_WIDTH + 16);
  }
  async function setFlyout(open2) {
    if (!ui.flyout) return;
    const wasOpen = ui.flyoutOpen;
    ui.flyoutOpen = open2;
    ui.flyout.hidden = !open2;
    ui.row?.setAttribute("aria-expanded", String(open2));
    if (open2) {
      placeFlyout();
      if (ui.model) recordFirstShown(ui.model.visible.map((i) => i.id));
    } else if (wasOpen && ui.model) {
      await markRead(ui.model.visible.map((i) => i.id));
    }
    return render();
  }
  function hidePeek() {
    clearTimeout(ui.peekTimer);
    ui.peek?.remove();
    ui.peek = null;
  }
  function showPeek(item) {
    hidePeek();
    const host = document.querySelector(".creatio-satelite-extension-container");
    if (!host || !ui.buttonWrapper) return;
    const peek = el3("div", "csl-news csl-news--dark csl-news-peek");
    peek.setAttribute("role", "status");
    peek.setAttribute("aria-live", "polite");
    const meta = el3("div", "csl-news-card__meta");
    meta.appendChild(el3("span", "csl-news-tag csl-news-tag--breaking", "Breaking"));
    const actions = el3("div", "csl-news-peek__actions");
    const read = el3("button", "csl-news-peek__read", "Read");
    read.type = "button";
    const dismiss = el3("button", "csl-news-linkbtn", "Dismiss");
    dismiss.type = "button";
    actions.append(read, dismiss);
    peek.append(meta, el3("h4", "csl-news-card__title", item.title));
    if (item.body) peek.appendChild(el3("p", "csl-news-card__text", item.body));
    peek.appendChild(actions);
    const rect = ui.buttonWrapper.getBoundingClientRect();
    peek.style.top = `${rect.bottom + 8}px`;
    peek.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 316))}px`;
    host.appendChild(peek);
    ui.peek = peek;
    const arm = (ms) => {
      clearTimeout(ui.peekTimer);
      ui.peekTimer = setTimeout(hidePeek, ms);
    };
    arm(PEEK_MS);
    peek.addEventListener("mouseenter", () => clearTimeout(ui.peekTimer));
    peek.addEventListener("mouseleave", () => arm(PEEK_AFTER_HOVER_MS));
    dismiss.addEventListener("click", (event) => {
      event.stopPropagation();
      hidePeek();
    });
    read.addEventListener("click", (event) => {
      event.stopPropagation();
      hidePeek();
      if (!ui.menuContainer.classList.contains("visible")) ui.menuButton.click();
      setFlyout(true);
    });
  }
  function onMenuVisibility() {
    const visible = ui.menuContainer.classList.contains("visible");
    if (visible) {
      hidePeek();
      if (ui.model?.unread.length) markNoticed(ui.model.unread.map((i) => i.id)).then(render);
    } else if (ui.flyoutOpen) {
      setFlyout(false);
    }
  }
  var rendering = null;
  var pending = false;
  async function render() {
    if (!ui.menuButton) return;
    if (rendering) {
      pending = true;
      return rendering;
    }
    rendering = (async () => {
      const model = await loadSurface("shell");
      ui.model = model;
      const unread = model?.unread || [];
      const hasCritical = unread.some((i) => i.priority === "critical");
      const showDot = Boolean(model) && shouldShowDot(unread, { now: model.ctx.now, noticed: model.state.noticed });
      ui.dot.hidden = !showDot;
      ui.dot.classList.toggle("csl-news-dot--critical", hasCritical);
      if (showDot) {
        if (!ui.loadCounted) {
          ui.loadCounted = true;
          recordDotShown(unread.filter((i) => !model.state.noticed[i.id]?.noticedAt).map((i) => i.id));
        }
        const btn = ui.menuButton;
        ui.dot.style.left = `${btn.offsetLeft + btn.offsetWidth - 7}px`;
      }
      ui.menuButton.setAttribute("aria-label", showDot ? `Clio satellite, ${unread.length} unread news` : "Clio satellite");
      ui.row.hidden = unread.length === 0;
      ui.rowSep.hidden = unread.length === 0;
      ui.pill.textContent = String(unread.length);
      ui.pill.classList.toggle("csl-news-pill--critical", hasCritical);
      ui.preview.textContent = unread[0]?.title || "";
      if (!model && ui.flyoutOpen) {
        ui.flyoutOpen = false;
        ui.flyout.hidden = true;
      }
      if (model && ui.flyoutOpen) {
        renderCards(ui.list, model.visible, model.ctx, { onVideoStart: (item) => markRead([item.id]).then(render) });
      }
      if (model && !ui.peekChecked) {
        ui.peekChecked = true;
        const critical = pickPeek(unread, { now: model.ctx.now, autoOpened: model.state.autoOpened, lastPeekAt: model.state.lastPeekAt, pageType: ui.pageType });
        if (critical) {
          markAutoOpened(critical.id, { peek: true });
          showPeek(critical);
        }
      }
    })();
    try {
      await rendering;
    } finally {
      rendering = null;
      if (pending) {
        pending = false;
        render();
      }
    }
  }
  function attachShellNews({ menuButton, menuContainer, buttonWrapper, pageType }) {
    ui.observer?.disconnect();
    hidePeek();
    Object.assign(ui, { menuButton, menuContainer, buttonWrapper, pageType, flyoutOpen: false });
    const dot = el3("span", "csl-news-dot");
    dot.setAttribute("aria-hidden", "true");
    dot.hidden = true;
    buttonWrapper.appendChild(dot);
    const { row, pill, preview } = buildRow();
    row.hidden = true;
    const rowSep = el3("div", "csl-news-row-sep");
    rowSep.hidden = true;
    menuContainer.prepend(row, rowSep);
    const { flyout, list } = buildFlyout();
    menuContainer.appendChild(flyout);
    Object.assign(ui, { dot, row, rowSep, pill, preview, flyout, list });
    ui.observer = new MutationObserver(onMenuVisibility);
    ui.observer.observe(menuContainer, { attributes: true, attributeFilter: ["class"] });
    if (!ui.subscribed) {
      ui.subscribed = true;
      onNewsStorageChange(() => render());
      setInterval(render, RERENDER_MS);
    }
    return render();
  }

  // src/menuBuilder.js
  function safeSendMessage(message) {
    try {
      if (!chrome.runtime?.id) return;
      chrome.runtime.sendMessage(message);
    } catch (_) {
    }
  }
  function createMatButton(color, extraClass, title) {
    const btn = document.createElement("button");
    btn.setAttribute("mat-flat-button", "");
    btn.setAttribute("color", color);
    btn.className = `mat-focus-indicator ${extraClass} mat-flat-button mat-button-base mat-${color}`;
    if (title) btn.title = title;
    btn.setAttribute("aria-haspopup", "menu");
    btn.setAttribute("aria-expanded", "false");
    btn.style.setProperty("padding-right", "8px", "important");
    const wrapper = document.createElement("span");
    wrapper.className = "mat-button-wrapper";
    btn.appendChild(wrapper);
    const ripple = document.createElement("span");
    ripple.setAttribute("matripple", "");
    ripple.className = "mat-ripple mat-button-ripple";
    btn.appendChild(ripple);
    const overlay = document.createElement("span");
    overlay.className = "mat-button-focus-overlay";
    btn.appendChild(overlay);
    return { btn, wrapper };
  }
  function createArrowWrapper() {
    const wrapper = document.createElement("div");
    wrapper.className = "mat-select-arrow-wrapper";
    wrapper.style.cssText = "margin-left: 4px; padding-right: 2px;";
    const arrow = document.createElement("div");
    arrow.className = "mat-select-arrow";
    wrapper.appendChild(arrow);
    return wrapper;
  }
  function createMenuItem(scriptName) {
    const iconData = MENU_ICONS[scriptName] || { svg: "", name: "" };
    const menuItem = document.createElement("div");
    menuItem.className = "crt-menu-item-container mat-menu-item";
    menuItem.setAttribute("mat-menu-item", "");
    menuItem.setAttribute("aria-disabled", "false");
    menuItem.setAttribute("role", "menuitem");
    menuItem.setAttribute("tabindex", "0");
    const button = document.createElement("button");
    button.setAttribute("mat-flat-button", "");
    button.className = "crt-menu-item mat-flat-button";
    button.setAttribute("data-item-marker", scriptName);
    button.setAttribute("aria-haspopup", "false");
    button.setAttribute("aria-expanded", "false");
    const matIcon = document.createElement("mat-icon");
    matIcon.setAttribute("role", "img");
    matIcon.className = "mat-icon notranslate mat-icon-no-color ng-star-inserted";
    matIcon.setAttribute("aria-hidden", "true");
    matIcon.setAttribute("data-mat-icon-type", "svg");
    if (iconData.name) matIcon.setAttribute("data-mat-icon-name", iconData.name);
    matIcon.innerHTML = iconData.svg;
    const caption = document.createElement("span");
    caption.className = "caption";
    caption.setAttribute("crttextoverflowtitle", "");
    caption.textContent = " " + (SCRIPT_LABELS[scriptName] || scriptName.replace(/_/g, " "));
    button.appendChild(matIcon);
    button.appendChild(caption);
    menuItem.appendChild(button);
    return menuItem;
  }
  function buildNavMenu() {
    const menuContainer = document.createElement("div");
    menuContainer.classList.add("scripts-menu-container");
    hideMenuContainer(menuContainer);
    SCRIPT_FILES.forEach((scriptFile) => {
      const scriptName = scriptFile.replace(".js", "");
      if (scriptName === "Settings") {
        const dividerContainer = document.createElement("div");
        dividerContainer.className = "ng-star-inserted";
        dividerContainer.setAttribute("crt-menu-view-element-item", "settings-divider");
        dividerContainer.style.cssText = "display: block; margin: 4px 0; opacity: 1; visibility: visible;";
        const crtDivider = document.createElement("crt-menu-divider");
        crtDivider.className = "ng-star-inserted";
        crtDivider.style.cssText = "display: block; margin: 0;";
        const matDivider = document.createElement("mat-divider");
        matDivider.setAttribute("role", "separator");
        matDivider.className = "mat-divider mat-divider-horizontal";
        matDivider.setAttribute("aria-orientation", "horizontal");
        matDivider.style.cssText = "display: block !important; height: 1px !important; background-color: rgba(255, 255, 255, 0.1) !important; border: none !important; margin: 0 8px !important;";
        crtDivider.appendChild(matDivider);
        dividerContainer.appendChild(crtDivider);
        menuContainer.appendChild(dividerContainer);
      }
      const menuItem = createMenuItem(scriptName);
      menuItem.addEventListener("click", () => {
        if (scriptName === "Settings") {
          safeSendMessage({ action: "openOptionsPage" });
        } else {
          safeSendMessage({ action: "executeScript", scriptPath: `navigation/${scriptFile}` });
        }
        hideMenuContainer(menuContainer);
      });
      menuContainer.appendChild(menuItem);
    });
    return menuContainer;
  }
  function buildActionsMenu(actionsMenuContainer) {
    actionsMenuContainer.innerHTML = "";
    chrome.storage.sync.get({ lastLoginProfiles: {}, userProfiles: [] }, (data) => {
      const err = getLastError();
      if (err) {
        console.error("[Clio Satellite] Failed to load profiles:", err.message);
        return;
      }
      if (!actionsMenuContainer.isConnected) return;
      const origin = window.location.origin;
      const rawEntry = data.lastLoginProfiles[origin];
      const lastUser = typeof rawEntry === "string" ? rawEntry : rawEntry?.username;
      const profile = data.userProfiles.find((p) => p.username === lastUser);
      const autologinEnabled = profile ? profile.autologin : false;
      const actionsList = ["RestartApp", "FlushRedisDB"];
      if (lastUser) actionsList.push(autologinEnabled ? "DisableAutologin" : "EnableAutologin");
      actionsList.forEach((name) => {
        const detail = ACTION_DETAILS[name];
        const menuItem = document.createElement("div");
        menuItem.className = "crt-menu-item-container mat-menu-item";
        menuItem.setAttribute("mat-menu-item", "");
        menuItem.setAttribute("aria-disabled", "false");
        menuItem.setAttribute("role", "menuitem");
        menuItem.setAttribute("tabindex", "0");
        const menuButtonEl = document.createElement("button");
        menuButtonEl.className = "crt-menu-item mat-flat-button";
        menuButtonEl.setAttribute("mat-flat-button", "");
        menuButtonEl.setAttribute("data-item-marker", name);
        const iconWrap = document.createElement("mat-icon");
        iconWrap.setAttribute("role", "img");
        iconWrap.className = "mat-icon notranslate mat-icon-no-color";
        iconWrap.setAttribute("aria-hidden", "true");
        iconWrap.setAttribute("data-mat-icon-type", "svg");
        iconWrap.setAttribute("data-mat-icon-name", detail.name || "help");
        iconWrap.innerHTML = detail.icon || "";
        const caption = document.createElement("span");
        caption.className = "caption";
        caption.setAttribute("crttextoverflowtitle", "");
        caption.textContent = name.replace("Autologin", " autologin").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Z])([A-Z][a-z])/g, "$1 $2").trim();
        menuButtonEl.appendChild(iconWrap);
        menuButtonEl.appendChild(caption);
        menuItem.appendChild(menuButtonEl);
        menuItem.addEventListener("click", () => {
          if (name === "EnableAutologin") {
            chrome.storage.sync.get({ userProfiles: [], lastLoginProfiles: {} }, (ds) => {
              const err2 = getLastError();
              if (err2) {
                console.error("[Clio Satellite] Failed to load profiles for autologin:", err2.message);
                return;
              }
              const profiles = ds.userProfiles.map(
                (p) => p.username === lastUser ? { ...p, autologin: true } : p
              );
              chrome.storage.sync.set({ userProfiles: profiles }, () => {
                const err3 = getLastError();
                if (err3) {
                  console.error("[Clio Satellite] Failed to save autologin setting:", err3.message);
                }
              });
            });
          } else if (name === "DisableAutologin") {
            safeSendMessage({ action: "disableAutologin" });
          } else {
            safeSendMessage({ action: "executeScript", scriptPath: "actions/" + detail.file });
          }
          hideMenuContainer(actionsMenuContainer);
        });
        actionsMenuContainer.appendChild(menuItem);
      });
    });
  }
  function createScriptsMenu() {
    debugLog("Creating scripts menu");
    if (state.menuCreated || document.querySelector(".creatio-satelite-extension-container .scripts-menu-button")) {
      debugLog("Menu already exists, skipping");
      return false;
    }
    const pageType = getCreatioPageType();
    if (!pageType || pageType === "login" || pageType !== "shell" && pageType !== "configuration") {
      debugLog(`Page type "${pageType}" not supported for menu creation`);
      return false;
    }
    state.menuCreated = true;
    state.menuCreating = true;
    const extensionContainer = document.createElement("div");
    extensionContainer.className = "creatio-satelite-extension-container";
    extensionContainer.style.cssText = `
    position: fixed !important;
    z-index: 999999 !important;
    pointer-events: none !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    overflow: visible !important;
  `;
    const buttonWrapper = document.createElement("div");
    buttonWrapper.className = "creatio-satelite";
    buttonWrapper.style.cssText = "pointer-events: auto !important; position: absolute !important;";
    const { btn: menuButton, wrapper: menuButtonWrapper } = createMatButton("primary", "scripts-menu-button", "Clio satellite");
    const navCaption = document.createElement("div");
    navCaption.className = "compile-button-caption";
    const navIcon = document.createElement("span");
    navIcon.className = "creatio-satelite-button-icon";
    navIcon.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="2.6" fill="var(--csl-icon-accent, #ff5722)" stroke="none"/><path d="M13.6 6.2A6 6 0 1 1 9.8 2.3"/><circle cx="12.6" cy="3.4" r="1.6" fill="currentColor" stroke="none"/></svg>`;
    navCaption.appendChild(navIcon);
    navCaption.appendChild(document.createTextNode("Clio satellite"));
    menuButtonWrapper.appendChild(navCaption);
    menuButtonWrapper.appendChild(createArrowWrapper());
    const { btn: actionsButton, wrapper: actionsButtonWrapper } = createMatButton("accent", "actions-button", "Quick actions");
    actionsButton.setAttribute("aria-label", "Quick actions");
    const actionsCaption = document.createElement("div");
    actionsCaption.className = "compile-button-caption";
    const actionsIcon = document.createElement("span");
    actionsIcon.className = "creatio-satelite-button-icon";
    actionsIcon.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.25 1.75L3.25 9.25h4.5l-1 5 6-7.5h-4.5z" fill="var(--csl-icon-accent, #ff5722)"/></svg>`;
    actionsCaption.appendChild(actionsIcon);
    actionsButtonWrapper.appendChild(actionsCaption);
    actionsButtonWrapper.appendChild(createArrowWrapper());
    buttonWrapper.appendChild(menuButton);
    buttonWrapper.appendChild(actionsButton);
    const menuContainer = buildNavMenu();
    const actionsMenuContainer = document.createElement("div");
    actionsMenuContainer.classList.add("actions-menu-container");
    hideMenuContainer(actionsMenuContainer);
    actionsButton.addEventListener("click", (event) => {
      event.stopPropagation();
      if (actionsMenuContainer.classList.contains("visible")) {
        hideMenuContainer(actionsMenuContainer);
        return;
      }
      hideMenuContainer(menuContainer);
      buildActionsMenu(actionsMenuContainer);
      showMenuContainer(actionsMenuContainer);
      adjustMenuPosition(actionsButton, actionsMenuContainer);
    });
    menuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      if (menuContainer.classList.contains("visible")) {
        hideMenuContainer(menuContainer);
        return;
      }
      hideMenuContainer(actionsMenuContainer);
      showMenuContainer(menuContainer);
      adjustMenuPosition(menuButton, menuContainer);
    });
    state.clickAbortController?.abort();
    state.clickAbortController = new AbortController();
    document.addEventListener("click", (event) => {
      const ec = document.querySelector(".creatio-satelite-extension-container");
      if (!ec) return;
      const mb = ec.querySelector(".scripts-menu-button");
      const ab = ec.querySelector(".actions-button");
      const mc = ec.querySelector(".scripts-menu-container");
      const amc = ec.querySelector(".actions-menu-container");
      if (mb && mc && !mb.contains(event.target) && !mc.contains(event.target)) hideMenuContainer(mc);
      if (ab && amc && !ab.contains(event.target) && !amc.contains(event.target)) hideMenuContainer(amc);
    }, { capture: true, signal: state.clickAbortController.signal });
    try {
      setupFloatingContainer(pageType, buttonWrapper, extensionContainer);
      const rootMenuContainer = document.createElement("div");
      rootMenuContainer.classList.add("creatio-satelite-menu-container");
      rootMenuContainer.appendChild(menuContainer);
      rootMenuContainer.appendChild(actionsMenuContainer);
      extensionContainer.appendChild(rootMenuContainer);
      document.documentElement.appendChild(extensionContainer);
      state.actionsMenuCreated = true;
      state.menuCreating = false;
      attachShellNews({ menuButton, menuContainer, buttonWrapper, pageType });
      debugLog("Scripts menu created successfully");
      return true;
    } catch (error) {
      console.error("[Clio Satellite] Error creating menu:", error);
      state.menuCreated = false;
      state.actionsMenuCreated = false;
      state.menuCreating = false;
      return false;
    }
  }

  // src/observer.js
  function checkCreatioPageAndCreateMenu() {
    debugLog("Checking for Creatio page");
    const pageType = getCreatioPageType();
    if (pageType === "login") {
      debugLog("Login page detected - menu creation blocked");
      return false;
    }
    if (pageType && !state.menuCreated && (pageType === "shell" || pageType === "configuration")) {
      debugLog(`${pageType} page detected, creating menu`);
      return createScriptsMenu();
    }
    return false;
  }
  function monitorButtons() {
    const pageType = getCreatioPageType();
    if (pageType !== "shell" && pageType !== "configuration") return;
    if (state.menuCreating) return;
    const ec = document.querySelector(".creatio-satelite-extension-container");
    const navBtn = ec ? ec.querySelector(".scripts-menu-button") : null;
    const actBtn = ec ? ec.querySelector(".actions-button") : null;
    const floatingContainer = ec ? ec.querySelector(".creatio-satelite-floating") : null;
    if (!ec || !navBtn || !actBtn || !floatingContainer) {
      debugLog("Extension elements missing, attempting restore...");
      document.querySelectorAll(".creatio-satelite-extension-container").forEach((el5) => el5.remove());
      resetState();
      createScriptsMenu();
      return;
    }
    if (pageType === "shell" && floatingContainer) {
      const searchElement = document.querySelector("crt-global-search");
      if (!searchElement) {
        positionFloatingContainerRelativeToSearch(floatingContainer);
        return;
      }
      const searchRect = searchElement.getBoundingClientRect();
      if (searchRect.width < 50 || searchRect.height < 20) {
        positionFloatingContainerRelativeToSearch(floatingContainer);
        return;
      }
      const containerRect = floatingContainer.getBoundingClientRect();
      const expectedLeft = searchRect.right + 20;
      if (Math.abs(containerRect.left - expectedLeft) > 50) {
        positionFloatingContainerRelativeToSearch(floatingContainer);
      }
    }
  }
  function setupObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      let hasLeftContainer = false;
      let hasSearchElement = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          if (mutation.addedNodes.length > 2) shouldCheck = true;
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== 1) continue;
            if (node.classList?.contains("left-container") || node.querySelector?.(".left-container")) {
              hasLeftContainer = true;
              shouldCheck = true;
            }
            if (node.tagName === "CRT-GLOBAL-SEARCH" || node.querySelector?.("crt-global-search")) {
              hasSearchElement = true;
              shouldCheck = true;
            }
          }
        }
      }
      const pageType = getCreatioPageType();
      if (pageType === "login" || !pageType) return;
      if (shouldCheck && !state.menuCreated) {
        checkCreatioPageAndCreateMenu();
      } else if (hasSearchElement && pageType === "shell") {
        const fc = document.querySelector(".creatio-satelite-floating");
        setTimeout(() => positionFloatingContainerRelativeToSearch(fc), 50);
        setTimeout(() => positionFloatingContainerRelativeToSearch(fc), 200);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return observer;
  }
  function initDebugHelper() {
    window.creatioSatelliteDebug = function() {
      const pageType = getCreatioPageType();
      console.log("=== Creatio Satellite Debug Info ===");
      console.log("Page Type:", pageType);
      console.log("Menu Created:", state.menuCreated);
      console.log("Current URL:", window.location.href);
      return { pageType, menuCreated: state.menuCreated, url: window.location.href };
    };
  }

  // src/news/loginStrip.js
  var ROW_SELECTOR = ".creatio-satelite-login-profiles-container";
  var RERENDER_MS2 = 10 * 60 * 1e3;
  var ui2 = { root: null, open: false, model: null, autoChecked: false, pulsed: false, rendering: null, pending: false };
  function el4(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== void 0) node.textContent = text;
    return node;
  }
  function waitFor(selector, timeoutMs) {
    return new Promise((resolve) => {
      const found = document.querySelector(selector);
      if (found) {
        resolve(found);
        return;
      }
      const observer = new MutationObserver(() => {
        const node = document.querySelector(selector);
        if (node) {
          observer.disconnect();
          resolve(node);
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeoutMs);
    });
  }
  function build(row) {
    const root = el4("div", "csl-news csl-news--light");
    root.hidden = true;
    if (row.style.width) root.style.width = row.style.width;
    const strip = el4("button", "csl-news-strip");
    strip.type = "button";
    strip.setAttribute("aria-expanded", "false");
    strip.setAttribute("aria-controls", "csl-news-panel");
    const icon = el4("span", "csl-news-strip__icon");
    icon.innerHTML = newsIcon();
    const count = el4("span", "csl-news-strip__count");
    const headline = el4("span", "csl-news-strip__headline");
    const chevron = el4("span", "csl-news-strip__chevron");
    chevron.innerHTML = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    strip.append(icon, count, headline, chevron);
    const panel = el4("div", "csl-news-panel");
    panel.id = "csl-news-panel";
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Developer news");
    panel.hidden = true;
    const head = el4("div", "csl-news-panel__head");
    const markAll = el4("button", "csl-news-linkbtn", "Mark all as read");
    markAll.type = "button";
    head.append(el4("strong", "", "Dev tools news"), markAll);
    const list = el4("ul", "csl-news-list");
    const foot = el4("div", "csl-news-panel__foot");
    const all = el4("a", "", "All news \u2192");
    all.href = ARCHIVE_URL;
    all.target = "_blank";
    all.rel = "noopener noreferrer";
    const topics = el4("button", "csl-news-linkbtn", "Choose topics");
    topics.type = "button";
    foot.append(all, topics);
    panel.append(head, list, foot);
    root.append(strip, panel);
    strip.addEventListener("click", () => setOpen(!ui2.open));
    markAll.addEventListener("click", () => {
      if (!ui2.model) return;
      ui2.open = false;
      markRead(ui2.model.visible.map((i) => i.id)).then(render2);
    });
    topics.addEventListener("click", () => openOptions());
    Object.assign(ui2, { root, strip, count, headline, panel, list });
    return root;
  }
  async function setOpen(open2) {
    const wasOpen = ui2.open;
    ui2.open = open2;
    if (wasOpen && !open2 && ui2.model) await markRead(ui2.model.visible.map((i) => i.id));
    return render2();
  }
  async function render2() {
    if (ui2.rendering) {
      ui2.pending = true;
      return ui2.rendering;
    }
    ui2.rendering = (async () => {
      const model = await loadSurface("login");
      ui2.model = model;
      const { root } = ui2;
      if (!model) {
        root.hidden = true;
        return;
      }
      const { visible, unread, ctx, state: state2 } = model;
      if (!ui2.autoChecked) {
        ui2.autoChecked = true;
        const critical = pickAutoExpand(unread, state2);
        if (critical) {
          ui2.open = true;
          markAutoOpened(critical.id);
        }
      }
      if (!unread.length && !ui2.open) {
        root.hidden = true;
        ui2.panel.hidden = true;
        return;
      }
      const lead = unread[0] || visible[0];
      root.hidden = false;
      root.classList.toggle("csl-news--unread", unread.length > 0);
      root.classList.toggle("csl-news--critical", unread.some((i) => i.priority === "critical"));
      root.classList.toggle("csl-news--open", ui2.open);
      if (unread.length && !ui2.pulsed) {
        ui2.pulsed = true;
        root.classList.add("csl-news--pulse");
      }
      ui2.count.textContent = unread.length ? `${unread.length} new` : "";
      ui2.headline.textContent = unread.length ? lead.title : `What's new \xB7 ${lead.title}`;
      ui2.strip.setAttribute("aria-expanded", String(ui2.open));
      ui2.strip.setAttribute("aria-label", `Developer news${unread.length ? `, ${unread.length} new` : ""}: ${lead.title}`);
      ui2.panel.hidden = !ui2.open;
      const shown = ui2.open ? visible.map((i) => i.id) : [lead.id];
      recordFirstShown(shown);
      if (ui2.open) {
        renderCards(ui2.list, visible, ctx, { onVideoStart: (item) => markRead([item.id]).then(render2) });
      }
    })();
    try {
      await ui2.rendering;
    } finally {
      ui2.rendering = null;
      if (ui2.pending) {
        ui2.pending = false;
        render2();
      }
    }
  }
  async function initLoginNews() {
    const row = await waitFor(ROW_SELECTOR, 3e4);
    if (!row || document.querySelector(".csl-news")) return;
    row.insertAdjacentElement("afterend", build(row));
    await render2();
    onNewsStorageChange(() => render2());
    setInterval(render2, RERENDER_MS2);
  }

  // src/index.js
  var initialType = getCreatioPageType();
  if (initialType === "login") {
    initLoginNews();
  } else {
    setTimeout(() => checkCreatioPageAndCreateMenu(), 1e3);
    document.addEventListener("DOMContentLoaded", () => {
      debugLog("DOMContentLoaded");
      checkCreatioPageAndCreateMenu();
    });
    window.addEventListener("load", () => {
      debugLog("Window load");
      checkCreatioPageAndCreateMenu();
    });
    let checkCount = 0;
    const checkInterval = setInterval(() => {
      checkCount++;
      const done = checkCreatioPageAndCreateMenu();
      if (done || checkCount >= 20) clearInterval(checkInterval);
    }, 1e3);
    setupObserver();
    setInterval(monitorButtons, 2e3);
    initDebugHelper();
  }
})();

(() => {
  // src/debug.js
  var DEBUG = false;
  function debugLog(message) {
    if (DEBUG) console.log("[Clio Satellite]:", message);
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
  var MENU_ICONS = {
    "Features": {
      svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.6477 3.7921C10.0849 3.98314 9.4883 4.26947 8.94174 4.69091C8.89082 4.73017 8.85784 4.78936 8.85784 4.85366V14.2763C8.85784 14.3201 8.90952 14.3396 8.93467 14.3038C9.31132 13.7685 10.03 13.3802 10.9124 13.1213C11.774 12.8685 12.6597 12.7776 13.1956 12.7466C13.6472 12.7204 14 12.3491 14 11.8998V4.25019C14 3.79737 13.6424 3.42414 13.187 3.40169L13.1839 3.40154L13.1785 3.40131L13.1631 3.40071C13.1509 3.40028 13.1346 3.39979 13.1146 3.39938C13.0747 3.39856 13.0196 3.39803 12.9514 3.39884C12.815 3.40044 12.6247 3.40734 12.3953 3.428C11.9394 3.46907 11.3143 3.56581 10.6477 3.7921Z" fill="currentColor"></path><path d="M7.06679 14.3046C7.09196 14.3403 7.14355 14.3208 7.14355 14.2771V4.85559C7.14355 4.79051 7.11013 4.73061 7.05859 4.69087C6.51205 4.26945 5.91539 3.98312 5.35259 3.7921C4.6859 3.5658 4.06074 3.46906 3.60478 3.428C3.37541 3.40734 3.18503 3.40044 3.04866 3.39884C2.98038 3.39803 2.92533 3.39856 2.88537 3.39938C2.86539 3.39979 2.84915 3.40028 2.83688 3.40071L2.82148 3.40131L2.81607 3.40154L2.81394 3.40164L2.8122 3.40173C2.35727 3.42415 2 3.79701 2 4.24937V11.8999C2 12.3484 2.35168 12.7194 2.80252 12.7464C3.3393 12.7786 4.22567 12.8705 5.08792 13.1237C5.97123 13.383 6.69031 13.7709 7.06679 14.3046Z" fill="currentColor"></path>`,
      name: "online-help"
    },
    "Application_Managment": {
      svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2H14V15H2V2ZM3.333 3.333V13.333H12.667V3.333H3.333Z" fill="currentColor"/>`,
      name: "application_management"
    },
    "Lookups": {
      svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="4" stroke="currentColor" stroke-width="2"/><path d="M11 11l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
      name: "lookups"
    },
    "Process_library": {
      svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="12" height="12" rx="2" fill="currentColor"/></svg>`,
      name: "process_library"
    },
    "Process_log": {
      svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="10" height="10" rx="2" fill="currentColor"/><path d="M5 6h6M5 8h6M5 10h4" stroke="#fff" stroke-width="1.2"/></svg>`,
      name: "process_log"
    },
    "SysSettings": {
      svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2"/><path d="M8 4v4l3 2" stroke="currentColor" stroke-width="2"/></svg>`,
      name: "sys_settings"
    },
    "Users": {
      svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="6" r="3" stroke="currentColor" stroke-width="2"/><path d="M2 14c0-2.21 2.686-4 6-4s6 1.79 6 4" stroke="currentColor" stroke-width="2"/></svg>`,
      name: "users"
    },
    "Configuration": {
      svg: `<svg width="100%" height="100%" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="10" height="10" rx="2" fill="currentColor"/></svg>`,
      name: "configuration"
    },
    "Settings": {
      svg: `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M12.7 6.4a1 1 0 0 0 .3-1.4l-.8-1.4a1 1 0 0 0-1.4-.3l-.5.3a6 6 0 0 0-1.6-.9V2a1 1 0 0 0-1-1H6.3a1 1 0 0 0-1 1v.7a6 6 0 0 0-1.6.9l-.5-.3a1 1 0 0 0-1.4.3l-.8 1.4a1 1 0 0 0 .3 1.4l.5.3v1.6l-.5.3a1 1 0 0 0-.3 1.4l.8 1.4a1 1 0 0 0 1.4.3l.5-.3a6 6 0 0 0 1.6.9V14a1 1 0 0 0 1 1h1.4a1 1 0 0 0 1-1v-.7a6 6 0 0 0 1.6-.9l.5.3a1 1 0 0 0 1.4-.3l.8-1.4a1 1 0 0 0-.3-1.4l-.5-.3V8l.5-.3z" stroke="currentColor" stroke-width="1" fill="none"/></svg>`,
      name: "settings"
    }
  };
  var ACTION_DETAILS = {
    "RestartApp": {
      file: "RestartApp.js",
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2v6l4 2" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2"/></svg>`,
      name: "refresh",
      desc: "Reload the Creatio application"
    },
    "FlushRedisDB": {
      file: "FlushRedisDB.js",
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="10" height="10" rx="2" fill="currentColor"/><path d="M5 6h6M5 8h6M5 10h4" stroke="#fff" stroke-width="1.2"/></svg>`,
      name: "delete",
      desc: "Clear Redis database"
    },
    "EnableAutologin": {
      file: null,
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2"/><path d="M5 8l2 2 4-4" stroke="#fff" stroke-width="2"/></svg>`,
      name: "check",
      desc: "Enable autologin for this site"
    },
    "DisableAutologin": {
      file: null,
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2"/><path d="M5 5l6 6M11 5l-6 6" stroke="#fff" stroke-width="2"/></svg>`,
      name: "block",
      desc: "Disable autologin for this site"
    },
    "Settings": {
      file: null,
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2"/><path d="M8 4v4l3 2" stroke="currentColor" stroke-width="2"/></svg>`,
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
    "academy.creatio.com"
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
      currentPath.includes("/login"),
      currentPath.includes("/auth/"),
      currentPath === "/auth",
      currentPath.includes("/signin"),
      currentPath.includes("/authentication"),
      currentUrl.includes("login"),
      currentUrl.includes("/signin"),
      document.querySelector("#loginEdit-el"),
      document.querySelector("#passwordEdit-el"),
      document.querySelector(".login-button-login"),
      document.querySelector('input[name*="username"]'),
      document.querySelector('input[name*="password"]'),
      document.querySelector('input[name*="login"]'),
      document.querySelector('form[action*="login"]'),
      document.querySelector('[class*="login"]'),
      document.querySelector('[id*="login"]'),
      document.title.toLowerCase().includes("login"),
      document.title.toLowerCase().includes("sign in"),
      document.querySelector('meta[name*="login"]'),
      document.querySelector('meta[content*="login"]')
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
      document.querySelector(".creatio-logo"),
      document.querySelector('[id*="Terrasoft"]'),
      document.querySelector('[class*="Terrasoft"]'),
      document.querySelector('script[src*="creatio"]'),
      document.querySelector('script[src*="terrasoft"]'),
      document.querySelector('link[href*="creatio"]'),
      document.querySelector('link[href*="terrasoft"]'),
      document.querySelector("crt-root"),
      document.querySelector('[class*="shell"]'),
      document.querySelector('[id*="shell"]'),
      document.querySelector("crt-page"),
      document.querySelector("crt-reusable-schema")
    ];
    const foundCount = shellSelectors.filter(Boolean).length;
    const minRequired = urlMatchesShell ? 1 : 2;
    debugLog(`Shell detection: ${foundCount}/${minRequired} indicators, URL match: ${urlMatchesShell}`);
    if (DEBUG) {
      const names = [
        "ShellContainerWithBackground",
        "mainshell",
        "crt-schema-outlet",
        "AppToolbarGlobalSearch",
        "crt-app-toolbar",
        "creatio-logo",
        "Terrasoft ID",
        "Terrasoft class",
        "creatio script",
        "terrasoft script",
        "creatio link",
        "terrasoft link",
        "crt-root",
        "shell class",
        "shell ID",
        "crt-page",
        "crt-reusable-schema"
      ];
      shellSelectors.forEach((el, i) => {
        if (el) debugLog(`\u2713 Found: ${names[i]}`);
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
    const leftPosition = targetRect.right + 20;
    const topPosition = targetRect.top + (targetRect.height - containerRect.height) / 2 - 20;
    const finalLeft = Math.min(window.innerWidth - containerRect.width - 10, leftPosition);
    const finalTop = Math.max(10, Math.min(window.innerHeight - containerRect.height - 10, topPosition));
    floatingContainer.style.left = finalLeft + "px";
    floatingContainer.style.top = finalTop + "px";
    floatingContainer.style.right = "auto";
    debugLog(`Positioned container: left=${finalLeft}, top=${finalTop}`);
    return true;
  }
  function saveMenuPosition(x, y, pageType) {
    const key = `menuPosition_${pageType}_${window.location.origin}`;
    chrome.storage.local.set({ [key]: { x, y, timestamp: Date.now() } }, () => {
      if (chrome.runtime.lastError) {
        console.error("[Clio Satellite] Failed to save position:", chrome.runtime.lastError.message);
        return;
      }
      debugLog(`Position saved for ${pageType}: x=${x}, y=${y}`);
    });
  }
  function loadMenuPosition(pageType, callback) {
    const key = `menuPosition_${pageType}_${window.location.origin}`;
    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime.lastError) {
        console.error("[Clio Satellite] Failed to load position:", chrome.runtime.lastError.message);
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
          if (chrome.runtime.lastError) {
            console.error("[Clio Satellite] Failed to remove stale position:", chrome.runtime.lastError.message);
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
    transition: opacity ${isShell ? "3s" : "0.3s"} ease;
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
          if (chrome.runtime.lastError) {
            console.error("[Clio Satellite] Failed to clear position:", chrome.runtime.lastError.message);
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

  // src/menuBuilder.js
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
    caption.textContent = " " + scriptName.replace(/_/g, " ");
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
        dividerContainer.style.cssText = "display: block; margin: 8px 0; opacity: 1; visibility: visible;";
        const crtDivider = document.createElement("crt-menu-divider");
        crtDivider.className = "ng-star-inserted";
        crtDivider.style.cssText = "display: block; margin: 8px 0;";
        const matDivider = document.createElement("mat-divider");
        matDivider.setAttribute("role", "separator");
        matDivider.className = "mat-divider mat-divider-horizontal";
        matDivider.setAttribute("aria-orientation", "horizontal");
        matDivider.style.cssText = "display: block !important; height: 1px !important; background-color: #e0e0e0 !important; border: none !important; margin: 0 16px !important;";
        crtDivider.appendChild(matDivider);
        dividerContainer.appendChild(crtDivider);
        menuContainer.appendChild(dividerContainer);
      }
      const menuItem = createMenuItem(scriptName);
      menuItem.addEventListener("click", () => {
        if (scriptName === "Settings") {
          chrome.runtime.sendMessage({ action: "openOptionsPage" });
        } else {
          chrome.runtime.sendMessage({ action: "executeScript", scriptPath: `navigation/${scriptFile}` });
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
      if (chrome.runtime.lastError) {
        console.error("[Clio Satellite] Failed to load profiles:", chrome.runtime.lastError.message);
        return;
      }
      if (!actionsMenuContainer.isConnected) return;
      const origin = window.location.origin;
      const lastUser = data.lastLoginProfiles[origin];
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
              if (chrome.runtime.lastError) {
                console.error("[Clio Satellite] Failed to load profiles for autologin:", chrome.runtime.lastError.message);
                return;
              }
              const profiles = ds.userProfiles.map(
                (p) => p.username === lastUser ? { ...p, autologin: true } : p
              );
              chrome.storage.sync.set({ userProfiles: profiles }, () => {
                if (chrome.runtime.lastError) {
                  console.error("[Clio Satellite] Failed to save autologin setting:", chrome.runtime.lastError.message);
                }
              });
            });
          } else if (name === "DisableAutologin") {
            chrome.runtime.sendMessage({ action: "disableAutologin" });
          } else {
            chrome.runtime.sendMessage({ action: "executeScript", scriptPath: "actions/" + detail.file });
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
    navIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
    <path d="M8.109 1.023c.133-.133.35-.133.482 0l6.276 6.276c.133.133.133.35 0 .482l-6.276 6.276c-.133.133-.35.133-.482 0L1.833 7.781c-.133-.133-.133-.35 0-.482L8.109 1.023z" fill="currentColor"/>
    <path d="M10.5 6.5L9 5l-1 1 1.5 1.5L10.5 6.5z" fill="white"/>
    <path d="M13.5 3.5L12 2l-1 1 1.5 1.5L13.5 3.5z" fill="white"/>
    <path d="M4.5 12.5L3 11l-1 1 1.5 1.5L4.5 12.5z" fill="white"/>
    <path d="M2 13l1-1 1 1-1 1-1-1z" fill="white"/>
  </svg>`;
    navCaption.appendChild(navIcon);
    navCaption.appendChild(document.createTextNode("Clio satellite"));
    menuButtonWrapper.appendChild(navCaption);
    menuButtonWrapper.appendChild(createArrowWrapper());
    const { btn: actionsButton, wrapper: actionsButtonWrapper } = createMatButton("accent", "actions-button");
    const actionsCaption = document.createElement("div");
    actionsCaption.className = "compile-button-caption";
    const actionsIcon = document.createElement("span");
    actionsIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.5 1L2 7h4l-1 8L11 9H7l1.5-8z" fill="currentColor"/>
  </svg>`;
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
      document.body.appendChild(extensionContainer);
      state.actionsMenuCreated = true;
      state.menuCreating = false;
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
      document.querySelectorAll(".creatio-satelite-extension-container").forEach((el) => el.remove());
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

  // src/index.js
  var initialType = getCreatioPageType();
  if (initialType !== "login") {
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

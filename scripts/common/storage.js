// Common storage utilities
// Wrappers for chrome.storage and localStorage

/**
 * Get a value from localStorage
 * @param {string} key
 * @returns {string|null}
 */
export function getLocal(key) {
  return localStorage.getItem(key);
}

/**
 * Save a value to localStorage
 * @param {string} key
 * @param {string} value
 */
export function setLocal(key, value) {
  localStorage.setItem(key, value);
}

/**
 * Get a value from chrome.storage.local
 * @param {string} key
 * @returns {Promise<any>}
 */
export function getChromeStorage(key) {
  return new Promise(resolve => {
    chrome.storage.local.get([key], result => resolve(result[key]));
  });
}

/**
 * Save a value to chrome.storage.local
 * @param {string} key
 * @param {any} value
 * @returns {Promise<void>}
 */
export function setChromeStorage(key, value) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

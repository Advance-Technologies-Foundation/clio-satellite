// Общие функции для работы с хранилищем
// Для работы с chrome.storage и localStorage

/**
 * Получить значение из localStorage
 * @param {string} key
 * @returns {string|null}
 */
export function getLocal(key) {
  return localStorage.getItem(key);
}

/**
 * Сохранить значение в localStorage
 * @param {string} key
 * @param {string} value
 */
export function setLocal(key, value) {
  localStorage.setItem(key, value);
}

/**
 * Получить значение из chrome.storage.local
 * @param {string} key
 * @returns {Promise<any>}
 */
export function getChromeStorage(key) {
  return new Promise(resolve => {
    chrome.storage.local.get([key], result => resolve(result[key]));
  });
}

/**
 * Сохранить значение в chrome.storage.local
 * @param {string} key
 * @param {any} value
 * @returns {Promise<void>}
 */
export function setChromeStorage(key, value) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

// Общие функции для работы с DOM
// Используйте эти функции для поиска и создания элементов

/**
 * Находит элемент по селектору
 * @param {string} selector
 * @returns {Element|null}
 */
export function $(selector) {
  return document.querySelector(selector);
}

/**
 * Создаёт элемент с классами и атрибутами
 * @param {string} tag
 * @param {Object} options
 * @returns {Element}
 */
export function createElement(tag, options = {}) {
  const el = document.createElement(tag);
  if (options.className) el.className = options.className;
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([k, v]) => el.setAttribute(k, v));
  }
  return el;
}

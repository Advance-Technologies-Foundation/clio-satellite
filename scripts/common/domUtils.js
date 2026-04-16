// Common DOM utilities
// Use these functions to find and create elements

/**
 * Find an element by selector
 * @param {string} selector
 * @returns {Element|null}
 */
export function $(selector) {
  return document.querySelector(selector);
}

/**
 * Create an element with classes and attributes
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

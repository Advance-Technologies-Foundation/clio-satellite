// Common API utilities
// Use fetchApi for server requests

/**
 * Performs a fetch request
 * @param {string} url
 * @param {Object} options
 * @returns {Promise<any>}
 */
export async function fetchApi(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error('Network error');
  return response.json();
}

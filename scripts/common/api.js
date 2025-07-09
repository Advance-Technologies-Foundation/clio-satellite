// Общие функции для работы с API
// Используйте fetchApi для запросов к серверу

/**
 * Выполняет fetch-запрос
 * @param {string} url
 * @param {Object} options
 * @returns {Promise<any>}
 */
export async function fetchApi(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error('Network error');
  return response.json();
}

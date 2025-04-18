/**
 * Модуль для проверки исключенных доменов
 * Содержит единый список исключенных доменов и функцию для их проверки
 */

/**
 * Список доменов, на которых расширение не должно активироваться
 */
const excludedDomains = [
  'gitlab.com', 
  'github.com',
  'bitbucket.org',
  'google.com',
  'mail.google.com',
  'youtube.com',
  'atlassian.net',
  'upsource.creatio.com',
  'work.creatio.com',
  'creatio.workplace.com',
  'community.creatio.com',
  'studio.creatio.com',
  'academy.creatio.com',
  'tscore-git.creatio.com'
];

/**
 * Функция проверяет, входит ли текущий домен в список исключений
 * @returns {boolean} True если домен в списке исключений, иначе False
 */
function isExcludedDomain() {
  const currentHost = window.location.hostname;

  for (const domain of excludedDomains) {
    if (currentHost.includes(domain)) {
      console.log(`Domain ${currentHost} is in the exclusion list. Skipping activation.`);
      return true;
    }
  }
  
  console.log(`Domain ${currentHost} is NOT in the exclusion list.`);
  return false;
}

// Экспорт функции для использования в других файлах
window.isExcludedDomain = isExcludedDomain;
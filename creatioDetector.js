/**
 * Модуль для определения страниц Creatio
 * Содержит функции для проверки признаков Creatio на странице
 */

/**
 * Список индикаторов, указывающих на то, что страница относится к Creatio
 * @returns {Array} Массив найденных элементов-индикаторов Creatio
 */
function getCreatioIndicators() {
  return [
    document.getElementById('ShellContainerWithBackground'),
    document.querySelector('mainshell'),
    document.querySelector('crt-schema-outlet'),
    document.querySelector('[data-item-marker="AppToolbarGlobalSearch"]'),
    document.querySelector('crt-app-toolbar'),
    document.querySelector('.creatio-logo'),
    document.querySelector('[id*="Terrasoft"]'),
    document.querySelector('[class*="Terrasoft"]'),
    document.querySelector('script[src*="creatio"]'),
    document.querySelector('script[src*="terrasoft"]'),
    document.querySelector('link[href*="creatio"]'),
    document.querySelector('link[href*="terrasoft"]')
  ];
}

/**
 * Функция проверки наличия минимального количества признаков Creatio на странице
 * @returns {boolean} True если страница относится к Creatio, иначе False
 */
function isCreatioPage() {
  // Сначала проверяем, исключен ли домен
  if (typeof isExcludedDomain === 'function' && isExcludedDomain()) {
    return false;
  }

  const creatioIndicators = getCreatioIndicators();
  const MIN_INDICATORS = 2;

  const foundIndicators = creatioIndicators.filter(indicator => indicator);
  const isCreatio = foundIndicators.length >= MIN_INDICATORS;

  if (!isCreatio) {
    console.log(`Not enough Creatio indicators found (${foundIndicators.length}/${MIN_INDICATORS}). Skipping activation.`);
  } else {
    console.log(`Found ${foundIndicators.length} Creatio indicators. Activating plugin.`);
  }

  return isCreatio;
}

/**
 * Функция проверки является ли страница Shell-страницей Creatio
 * Shell страница - основной интерфейс системы с тулбаром и меню
 * @returns {boolean} True если страница является Shell-страницей Creatio, иначе False
 */
function isShellPage() {
  // Проверяем признаки Creatio
  if (!isCreatioPage()) {
    return false;
  }

  // Дополнительно проверяем наличие элементов Shell
  const shellSpecificIndicators = [
    document.querySelector('crt-app-toolbar'),
    document.getElementById('ShellContainerWithBackground'),
    document.querySelector('mainshell')
  ];

  const hasShellIndicator = shellSpecificIndicators.some(indicator => indicator);
  
  if (hasShellIndicator) {
    console.log("Shell page indicators found");
  } else {
    console.log("This is a Creatio page, but not a Shell page");
  }
  
  return hasShellIndicator;
}

// Экспорт функций для использования в других файлах
window.isCreatioPage = isCreatioPage;
window.isShellPage = isShellPage;
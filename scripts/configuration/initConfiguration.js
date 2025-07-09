// Инициализация страницы конфигурации
// Импортируйте общие функции при необходимости

import { $ } from '../common/domUtils.js';

export function initConfigurationPage() {
  // Пример: инициализация формы конфигурации
  const configForm = $('#config-form');
  if (configForm) {
    // ... логика инициализации формы ...
  }

  // Скрытие меню при клике вне его
  document.addEventListener('click', function(event) {
    const menu = document.querySelector('.scripts-menu-container.visible, .actions-menu-container.visible');
    if (menu && !menu.contains(event.target)) {
      menu.classList.remove('visible');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initConfigurationPage);
} else {
  initConfigurationPage();
}

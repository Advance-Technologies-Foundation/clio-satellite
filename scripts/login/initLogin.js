// Инициализация страницы логина
// Импортируйте общие функции при необходимости

import { $ } from '../common/domUtils.js';

// Основная функция инициализации
export function initLoginPage() {
  // Пример: найти форму логина и добавить обработчик
  const form = $('#login-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      // ... логика авторизации ...
    });
  }
}

// Вызов инициализации при загрузке страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoginPage);
} else {
  initLoginPage();
}

// Инициализация страницы шелла
// Импортируйте общие функции при необходимости

import { $ } from '../common/domUtils.js';

export function initShellPage() {
  // Пример: инициализация панели команд
  const panel = $('#shell-panel');
  if (panel) {
    // ... логика инициализации панели ...
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShellPage);
} else {
  initShellPage();
}

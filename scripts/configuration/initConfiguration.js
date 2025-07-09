// Configuration page initialization
// Import common functions as needed

import { $ } from '../common/domUtils.js';

export function initConfigurationPage() {
  // Example: configuration form initialization
  const configForm = $('#config-form');
  if (configForm) {
    // ... form initialization logic ...
  }

  // Hide menu when clicking outside of it
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

// Shell page initialization

import { $ } from '../common/domUtils.js';

export function initShellPage() {
  // Example: initialize the command panel
  const panel = $('#shell-panel');
  if (panel) {
    // ... panel initialization logic ...
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShellPage);
} else {
  initShellPage();
}

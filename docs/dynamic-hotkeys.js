// Dynamic README generator that adapts to user's operating system
document.addEventListener('DOMContentLoaded', function() {
  // Detect operating system
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? 'Opt' : 'Ctrl';
  
  // Function to get hotkey string with proper modifier
  function getHotkeyString(letter) {
    return `${modifierKey}+Shift+${letter.toUpperCase()}`;
  }
  
  // Update all hotkey references in the page
  const hotkeyElements = document.querySelectorAll('[data-hotkey]');
  hotkeyElements.forEach(element => {
    const letter = element.getAttribute('data-hotkey');
    element.textContent = getHotkeyString(letter);
  });
  
  // Update main controls section
  const mainControlsSection = document.querySelector('#main-controls');
  if (mainControlsSection) {
    mainControlsSection.innerHTML = `
      <li><strong>${getHotkeyString('N')}</strong>: Toggle Navigation Menu</li>
      <li><strong>${getHotkeyString('A')}</strong>: Toggle Actions Menu</li>
    `;
  }
  
  // Update quick actions section
  const quickActionsSection = document.querySelector('#quick-actions');
  if (quickActionsSection) {
    quickActionsSection.innerHTML = `
      <li><strong>${getHotkeyString('R')}</strong>: Restart Application</li>
      <li><strong>${getHotkeyString('F')}</strong>: Flush Redis Database</li>
      <li><strong>${getHotkeyString('S')}</strong>: Open Plugin Settings</li>
    `;
  }
  
  // Update direct navigation section
  const directNavSection = document.querySelector('#direct-navigation');
  if (directNavSection) {
    directNavSection.innerHTML = `
      <li><strong>E</strong>: Features • <strong>M</strong>: App Management • <strong>L</strong>: Lookups</li>
      <li><strong>P</strong>: Process Library • <strong>G</strong>: Process Log • <strong>Y</strong>: System Settings</li>
      <li><strong>U</strong>: Users • <strong>C</strong>: Configuration • <strong>T</strong>: TIDE</li>
      <li><em>All with ${modifierKey}+Shift+Letter combination</em></li>
    `;
  }
});

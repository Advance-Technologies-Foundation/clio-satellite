// Simple test script to verify extension functionality
console.log('🧪 Starting extension test...');

// Wait for DOM to be ready
function waitForDOM() {
  return new Promise(resolve => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });
}

// Test the extension functions
async function testExtension() {
  await waitForDOM();
  
  console.log('📊 Testing extension detection...');
  
  // Test page type detection
  if (typeof getCreatioPageType === 'function') {
    const pageType = getCreatioPageType();
    console.log('🎯 Page type detected:', pageType);
    
    if (pageType === 'configuration') {
      console.log('✅ Configuration page detected successfully');
      
      // Check for left container
      const leftContainer = document.querySelector('.left-container');
      if (leftContainer) {
        console.log('✅ Left container found');
      } else {
        console.log('❌ Left container NOT found');
      }
      
      // Check for extension buttons
      const extensionButtons = document.querySelector('.creatio-satelite');
      if (extensionButtons) {
        console.log('✅ Extension buttons found');
        console.log('📍 Buttons parent:', extensionButtons.parentElement);
      } else {
        console.log('❌ Extension buttons NOT found');
      }
    } else {
      console.log('ℹ️ Page type:', pageType || 'unknown');
    }
  } else {
    console.log('❌ getCreatioPageType function not found');
  }
  
  // Test menu creation
  if (typeof createScriptsMenu === 'function') {
    console.log('🔧 createScriptsMenu function available');
  } else {
    console.log('❌ createScriptsMenu function not found');
  }
  
  // Test debugLog
  if (typeof debugLog === 'function') {
    debugLog('🧪 Test debug message');
  }
}

// Run tests
testExtension();

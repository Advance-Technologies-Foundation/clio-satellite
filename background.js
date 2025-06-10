// This is the background script for the Chrome extension

// Define default profile
const defaultProfiles = [
    { username: 'Supervisor', password: 'Supervisor', alias: '' }
];

chrome.runtime.onInstalled.addListener(() => {
    console.log("Background script is running");
    
    // Initialize default profile if none exist
    chrome.storage.sync.get({ userProfiles: [] }, (data) => {
        let profiles = data.userProfiles;
        
        if (!profiles || profiles.length === 0) {
            chrome.storage.sync.set({ userProfiles: defaultProfiles }, () => {
                console.log('Default profiles initialized successfully.');
            });
        } else {
            // Check if existing profiles need to be updated with alias field
            let needsUpdate = false;
            profiles = profiles.map(profile => {
                if (!profile.hasOwnProperty('alias')) {
                    profile.alias = '';
                    needsUpdate = true;
                }
                return profile;
            });
            
            if (needsUpdate) {
                chrome.storage.sync.set({ userProfiles: profiles }, () => {
                    console.log('Profiles updated with alias field.');
                });
            }
        }
    });
    // Create context menu item under extension action for opening settings
    chrome.contextMenus.create({
      id: 'openSettings',
      title: 'Plugin Settings',
      contexts: ['action']
    });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'disableAutologin') {
        // Determine URL key (origin) for this request
        let urlKey = message.url;
        if (!urlKey && sender.tab && sender.tab.url) {
            try {
                urlKey = new URL(sender.tab.url).origin;
            } catch (e) {
                console.error('Invalid sender.tab.url for disableAutologin:', sender.tab.url);
            }
        }
        if (!urlKey) {
            sendResponse({ success: false, error: 'No URL key available' });
            return;
        }
        // Get storage and disable autologin
        chrome.storage.sync.get({ userProfiles: [], lastLoginProfiles: {} }, (data) => {
            const lastMap = data.lastLoginProfiles;
            const usernameToDisable = lastMap[urlKey];
            // Clear last login mapping
            delete lastMap[urlKey];
            // Update profiles
            const profiles = data.userProfiles.map(profile => {
                if (profile.username === usernameToDisable) {
                    profile.autologin = false;
                }
                return profile;
            });
            // Save updates
            chrome.storage.sync.set({ userProfiles: profiles, lastLoginProfiles: lastMap }, () => {
                console.log(`Autologin disabled for ${usernameToDisable} on ${urlKey}`);
                sendResponse({ success: true });
            });
        });
        return true; // indicate async sendResponse
    }
    else if (message.action === 'openOptionsPage') {
        // Attempt to open the options page
        chrome.runtime.openOptionsPage(() => {
            if (chrome.runtime.lastError) {
                // Fallback for browsers where openOptionsPage might not work (e.g., Edge)
                chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
            }
        });
        sendResponse({ success: true });
        return true; // Keep the message channel open for asynchronous response
    }
    else if (message.action === 'executeScript') {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const activeTabId = tabs[0].id;
            const scriptPath = `scripts/${message.scriptPath}`;
            // Inject extension script file directly, preserving extension APIs
            chrome.scripting.executeScript({
                target: { tabId: activeTabId },
                world: 'MAIN',  // run in page context to access page globals
                files: [scriptPath]
              }).then(() => {
                console.log(`Script ${scriptPath} injected successfully`);
                sendResponse({ success: true });
            }).catch(error => {
                console.error(`Error injecting script ${scriptPath}:`, error);
                sendResponse({ success: false, error: error.message });
            });
        });
        return true; // Keep the message channel open for asynchronous response
    }
});

// Handle action button context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'openSettings') {
    chrome.runtime.openOptionsPage();
  }
});
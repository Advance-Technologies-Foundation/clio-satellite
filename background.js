// This is the background script for the Chrome extension

// Developer news: feed and media fetching (see docs/architecture/news.md)
importScripts('news/newsFetcher.js');
const newsFetcher = self.ClioNewsFetcher.createNewsFetcher({
    fetchFn: (url, init) => fetch(url, init),
    storage: {
        get: (defaults) => chrome.storage.local.get(defaults),
        set: (data) => chrome.storage.local.set(data),
    },
    syncGet: (defaults) => chrome.storage.sync.get(defaults),
});

// Anonymous usage statistics, on by default with a switch in Options (see docs/architecture/analytics.md)
importScripts('analytics/config.js');
importScripts('analytics/analytics.js');
const analytics = self.ClioAnalytics.createAnalytics({
    fetchFn: (url, init) => fetch(url, init),
    local: {
        get: (defaults) => chrome.storage.local.get(defaults),
        set: (data) => chrome.storage.local.set(data),
    },
    syncGet: (defaults) => chrome.storage.sync.get(defaults),
    config: self.ClioAnalyticsConfig,
    version: chrome.runtime.getManifest().version,
});

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
            const rawEntry = lastMap[urlKey];
            const usernameToDisable = typeof rawEntry === 'string' ? rawEntry : rawEntry?.username;
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
    else if (message.action === 'getNews') {
        newsFetcher.getNews().then(sendResponse, () => sendResponse({ ok: false }));
        return true;
    }
    else if (message.action === 'getNewsMedia') {
        newsFetcher.getNewsMedia(message.url).then(sendResponse, () => sendResponse({ ok: false }));
        return true;
    }
    else if (message.action === 'trackEvent') {
        analytics.track(message.name, message.params).then(sendResponse, () => sendResponse({ ok: false }));
        return true;
    }
    else if (message.action === 'openNewsArchive') {
        // All published news live on the public feed site, outside the extension
        chrome.tabs.create({ url: self.ClioNewsFetcher.ARCHIVE_URL });
        sendResponse({ success: true });
        return true;
    }
    else if (message.action === 'openOptionsPage') {
        // Open the options page using runtime API
        chrome.runtime.openOptionsPage();
        sendResponse({ success: true });
        return true; // Keep the message channel open for asynchronous response
    }
    else if (message.action === 'openEnvironmentsPage') {
        chrome.tabs.create({ url: chrome.runtime.getURL('environments.html') });
        sendResponse({ success: true });
        return true;
    }
    else if (message.action === 'executeScript') {
        // Use sender.tab.id instead of querying tabs
        const activeTabId = sender.tab.id;
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
        return true; // Keep the message channel open for asynchronous response
    }
});

// Handle action button context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'openSettings') {
    chrome.runtime.openOptionsPage();
  }
});
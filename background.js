// This is the background script for the Chrome extension

// Define default profile
const defaultProfiles = [
    { username: 'Supervisor', password: 'Supervisor' }
];

chrome.runtime.onInstalled.addListener(() => {
    console.log("Background script is running");
    
    // Initialize default profile if none exist
    chrome.storage.sync.get({ userProfiles: [] }, (data) => {
        if (!data.userProfiles || data.userProfiles.length === 0) {
            chrome.storage.sync.set({ userProfiles: defaultProfiles }, () => {
                console.log('Default profiles initialized successfully.');
            });
        }
    });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openOptionsPage') {
        // Open the options page
        chrome.runtime.openOptionsPage();
        sendResponse({ success: true });
        return true; // Keep the message channel open for asynchronous response
    }
    else if (message.action === 'executeScript') {
        // Execute the selected script in the current tab
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const activeTab = tabs[0];
            
            // Handle both script path formats
            let scriptPath;
            if (message.scriptPath) {
                // If scriptPath is provided, use it directly (for actions scripts)
                scriptPath = `scripts/${message.scriptPath}`;
            } else {
                // For backward compatibility with navigation scripts
                scriptPath = `scripts/navigation/${message.scriptName}`;
            }
            
            // Instead of executing the script in the extension context,
            // fetch the script content and inject it into the page context
            fetch(chrome.runtime.getURL(scriptPath))
                .then(response => response.text())
                .then(scriptContent => {
                    // Execute script by injecting it into the page context
                    chrome.scripting.executeScript({
                        target: {tabId: activeTab.id},
                        world: "MAIN", // This is crucial - run in the same context as the page
                        func: injectAndRunScript,
                        args: [scriptContent]
                    })
                    .then(() => {
                        console.log(`Script ${scriptPath} executed successfully in page context`);
                        sendResponse({ success: true });
                    })
                    .catch(error => {
                        console.error(`Error executing script ${scriptPath}:`, error);
                        sendResponse({ success: false, error: error.message });
                    });
                })
                .catch(error => {
                    console.error(`Error fetching script ${scriptPath}:`, error);
                    sendResponse({ success: false, error: error.message });
                });
        });
        
        return true; // Keep the message channel open for asynchronous response
    }
});

// Function to inject and run script in page context
function injectAndRunScript(scriptContent) {
    try {
        // Create a script element
        const scriptElement = document.createElement('script');
        scriptElement.textContent = scriptContent;
        // Append to document to execute it in page context
        document.head.appendChild(scriptElement);
        // Remove after execution to keep the DOM clean
        scriptElement.remove();
        return true;
    } catch (error) {
        console.error('Error injecting script:', error);
        return false;
    }
}
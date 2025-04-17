// This is the background script for the Chrome extension
chrome.runtime.onInstalled.addListener(() => {
    console.log("Background script is running");
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'executeScript') {
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
            
            chrome.scripting.executeScript({
                target: {tabId: activeTab.id},
                files: [scriptPath]
            })
            .then(() => {
                console.log(`Script ${scriptPath} executed successfully`);
                sendResponse({ success: true });
            })
            .catch(error => {
                console.error(`Error executing script ${scriptPath}:`, error);
                sendResponse({ success: false, error: error.message });
            });
        });
        
        return true; // Keep the message channel open for asynchronous response
    }
});
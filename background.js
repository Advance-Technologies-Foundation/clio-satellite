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
            
            chrome.scripting.executeScript({
                target: {tabId: activeTab.id},
                files: [`scripts/navigation/${message.scriptName}`]
            })
            .then(() => {
                console.log(`Script ${message.scriptName} executed successfully`);
            })
            .catch(error => {
                console.error(`Error executing script ${message.scriptName}:`, error);
            });
        });
    }
    
    return true; // Keep the message channel open for asynchronous response
});
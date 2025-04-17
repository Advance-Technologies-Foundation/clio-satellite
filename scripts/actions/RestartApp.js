// RestartApp.js
// Script to restart the Creatio application

(function() {
    // Get the current window location
    var currentUrl = window.location.href;
    
    // Log for debugging
    console.log("Restarting application from URL: " + currentUrl);
    
    // Show notification to user if Terrasoft is available, otherwise use standard browser alert
    if (window.Terrasoft && typeof Terrasoft.showInformation === 'function') {
        Terrasoft.showInformation("Restarting application...");
    } else {
        // Fallback to a more generic notification if Terrasoft is not available
        console.log("Terrasoft not available, using fallback notification");
        // Create a simple notification on the page
        var notification = document.createElement('div');
        notification.textContent = 'Restarting application...';
        notification.style.position = 'fixed';
        notification.style.top = '10px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = '#4CAF50';
        notification.style.color = 'white';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '10000';
        notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        document.body.appendChild(notification);
    }
    
    // Add a small delay before restarting to allow the notification to be seen
    setTimeout(function() {
        // Force reload the page with no cache
        window.location.reload(true);
    }, 1000);
    
    // Log the action completion
    console.log("Restart command executed");
})();
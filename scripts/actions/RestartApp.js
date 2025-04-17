// RestartApp.js
// Script to restart the Creatio application

(function() {
    // Get the current window location
    var currentUrl = window.location.href;
    
    // Log for debugging
    console.log("Restarting application from URL: " + currentUrl);
    
    try {
        // Show notification to user if Terrasoft is available, otherwise use standard browser alert
        if (window.Terrasoft && typeof Terrasoft.showInformation === 'function') {
            Terrasoft.showInformation("Restarting application...");
        } else {
            // Fallback to a more generic notification if Terrasoft is not available
            console.log("Terrasoft not available or showInformation method not found, using fallback notification");
            
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
            
            // Remove after delay
            setTimeout(function() {
                notification.remove();
            }, 800); // Shorter time since page will reload
        }
        
        // Try to use Terrasoft-specific restart methods if available
        var terraRestarted = false;
        
        if (window.Terrasoft) {
            // Method 1: Try to use Terrasoft's core reload method if available
            if (typeof Terrasoft.coreReload === 'function') {
                console.log("Using Terrasoft.coreReload() method");
                setTimeout(function() {
                    Terrasoft.coreReload();
                }, 1000);
                terraRestarted = true;
            }
            // Method 2: Try to use sandbox reload if available
            else if (Terrasoft.sandbox && typeof Terrasoft.sandbox.reload === 'function') {
                console.log("Using Terrasoft.sandbox.reload() method");
                setTimeout(function() {
                    Terrasoft.sandbox.reload();
                }, 1000);
                terraRestarted = true;
            }
        }
        
        // Fallback to standard page reload if Terrasoft methods are not available
        if (!terraRestarted) {
            console.log("Using standard window.location.reload() method");
            // Add a small delay before restarting to allow the notification to be seen
            setTimeout(function() {
                // Force reload the page with no cache
                window.location.reload(true);
            }, 1000);
        }
        
        // Log the action completion
        console.log("Restart command executed");
    } catch (error) {
        console.error("Error during application restart:", error);
        
        // Show error notification
        var errorNotification = document.createElement('div');
        errorNotification.textContent = 'Error during restart: ' + error.message;
        errorNotification.style.position = 'fixed';
        errorNotification.style.top = '10px';
        errorNotification.style.left = '50%';
        errorNotification.style.transform = 'translateX(-50%)';
        errorNotification.style.backgroundColor = '#f44336';
        errorNotification.style.color = 'white';
        errorNotification.style.padding = '10px 20px';
        errorNotification.style.borderRadius = '4px';
        errorNotification.style.zIndex = '10000';
        errorNotification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        document.body.appendChild(errorNotification);
        
        // Remove after delay
        setTimeout(function() {
            errorNotification.remove();
        }, 5000);
    }
})();
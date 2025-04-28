/**
 * RestartApp.js
 * Script to restart the Creatio application by unloading the app domain
 * 
 * This script triggers a restart of the Creatio application instance by calling
 * the UnloadAppDomain method, which clears application cache and refreshes the app.
 */

(function() {
    /**
     * Self-executing function that performs application restart
     * Uses a direct API call approach that doesn't depend on Terrasoft object
     */
    
    try {
        // Show notification to user
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
        
        // Store the notification element for later removal
        var notificationElement = notification;
        
        /**
         * Reloads the page after successful operation
         * This ensures the application restarts with a fresh instance
         */
        function reloadPage() {
            console.log("Reloading page...");
            setTimeout(function() {
                window.location.reload(true);
            }, 1000);
        }
        
        /**
         * Direct API method using fetch API
         * Used as the primary method without Terrasoft dependency
         */
        var baseUrl = window.location.protocol + '//' + window.location.host;
        var unloadAppDomainUrl = baseUrl + "/ServiceModel/AppInstallerService.svc/UnloadAppDomain";
        
        console.log("Using fetch API to restart app at URL: " + unloadAppDomainUrl);
        
        fetch(unloadAppDomainUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({}), // Empty JSON object
            credentials: 'include' // Include cookies for authentication
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data && data.success) {
                // Operation succeeded
                console.log("UnloadAppDomain successful, reloading page");
                if (notificationElement) {
                    notificationElement.textContent = 'Restart successful, reloading page...';
                }
                reloadPage();
            } else {
                // Operation failed
                var errorMessage = (data && data.errorInfo) ? 
                    data.errorInfo : "Unknown error occurred";
                
                if (notificationElement) {
                    notificationElement.textContent = 'Failed to restart application: ' + errorMessage;
                    notificationElement.style.backgroundColor = '#f44336';
                    setTimeout(function() {
                        notificationElement.remove();
                    }, 3000);
                }
                console.error("Restart operation failed:", errorMessage);
                
                // Try fallback reload method
                reloadPage();
            }
        })
        .catch(function(error) {
            if (notificationElement) {
                notificationElement.textContent = 'Error executing restart: ' + error.message;
                notificationElement.style.backgroundColor = '#f44336';
                setTimeout(function() {
                    notificationElement.remove();
                }, 3000);
            }
            console.error("Restart operation error:", error);
            
            // Try fallback reload method
            reloadPage();
        });
        
    } catch (error) {
        console.error("Exception in RestartApp script:", error);
        
        // Display error notification
        var errorNotification = document.createElement('div');
        errorNotification.textContent = 'Error in restart operation: ' + error.message;
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
        
        // Remove the notification after a few seconds
        setTimeout(function() {
            errorNotification.remove();
        }, 3000);
        
        // Try fallback reload method
        setTimeout(function() {
            window.location.reload(true);
        }, 1500);
    }
})();
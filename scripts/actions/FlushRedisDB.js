// FlushRedisDB.js
// Script to flush Redis database in Creatio

(function() {
    // Safety check to ensure we're in the correct context
    if (typeof Terrasoft === 'undefined') {
        console.error("Terrasoft object not found in the page context");
        
        // Create a notification to inform the user
        var notification = document.createElement('div');
        notification.textContent = 'Error: Terrasoft object not available. Redis flush failed.';
        notification.style.position = 'fixed';
        notification.style.top = '10px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = '#f44336';
        notification.style.color = 'white';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '10000';
        notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        document.body.appendChild(notification);
        
        // Remove the notification after a few seconds
        setTimeout(function() {
            notification.remove();
        }, 5000);
        
        return;
    }
    
    try {
        // Function to reload the page after successful operation
        function reloadPage() {
            console.log("Reloading page after Redis flush...");
            setTimeout(function() {
                window.location.reload(true);
            }, 1500);
        }
        
        // Show notification to user
        if (typeof Terrasoft.showInformation === 'function') {
            Terrasoft.showInformation("Flushing Redis database...");
        } else {
            console.log("Terrasoft.showInformation not available, using fallback notification");
            
            // Fallback notification
            var notification = document.createElement('div');
            notification.textContent = 'Flushing Redis database...';
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
        }

        // Use the Terrasoft.ServiceProvider approach which is more reliable
        if (Terrasoft.ServiceProvider && typeof Terrasoft.ServiceProvider.callService === 'function') {
            // Using Terrasoft's native service provider
            console.log("Using Terrasoft.ServiceProvider to flush Redis");
            
            Terrasoft.ServiceProvider.callService({
                serviceName: "AppInstallerService",
                methodName: "ClearRedisDb",
                data: {},
                callback: function(response) {
                    if (response && response.success) {
                        // Operation succeeded
                        if (typeof Terrasoft.showInformation === 'function') {
                            Terrasoft.showInformation("Redis database successfully flushed. Reloading page...");
                        } else if (notificationElement) {
                            notificationElement.textContent = 'Redis database successfully flushed. Reloading page...';
                            notificationElement.style.backgroundColor = '#4CAF50';
                            setTimeout(function() {
                                notificationElement.remove();
                            }, 3000);
                        }
                        console.log("Redis flush operation completed successfully");
                        
                        // Reload the page after successful Redis flush
                        
                    } else {
                        // Operation failed
                        var errorMessage = (response && response.errorInfo) ? 
                            response.errorInfo : "Unknown error occurred";
                        
                        if (typeof Terrasoft.showError === 'function') {
                            Terrasoft.showError("Failed to flush Redis database: " + errorMessage);
                        } else if (notificationElement) {
                            notificationElement.textContent = 'Failed to flush Redis database: ' + errorMessage;
                            notificationElement.style.backgroundColor = '#f44336';
                            setTimeout(function() {
                                notificationElement.remove();
                            }, 5000);
                        }
                        console.error("Redis flush operation failed:", errorMessage);
                    }
                    reloadPage();
                }
            });
        } else if (Terrasoft.AjaxProvider && typeof Terrasoft.AjaxProvider.request === 'function') {
            // Get the base URL in a more reliable way
            var baseUrl = '';
            
            // Method 1: Try to get from workspaceBaseUrl or configuration
            if (Terrasoft.workspaceBaseUrl) {
                baseUrl = Terrasoft.workspaceBaseUrl;
            } else if (Terrasoft.configuration && Terrasoft.configuration.serviceUrl) {
                baseUrl = Terrasoft.configuration.serviceUrl;
            } else {
                // Method 2: Build from window.location
                var loc = window.location;
                baseUrl = loc.protocol + '//' + loc.host;
            }
            
            // Define the URL for Redis flushing operation
            var redisFlushUrl = baseUrl + "/ServiceModel/AppInstallerService.svc/ClearRedisDb";
            console.log("Using Terrasoft.AjaxProvider to flush Redis at URL: " + redisFlushUrl);
            
            // Try with application/json content type
            Terrasoft.AjaxProvider.request({
                url: redisFlushUrl,
                method: "POST",
                data: JSON.stringify({}), // Empty JSON object as data
                headers: {
                    "Content-Type": "application/json"
                },
                callback: function(response) {
                    if (response && response.success) {
                        // Operation succeeded
                        if (typeof Terrasoft.showInformation === 'function') {
                            Terrasoft.showInformation("Redis database successfully flushed. Reloading page...");
                        } else if (notificationElement) {
                            notificationElement.textContent = 'Redis database successfully flushed. Reloading page...';
                            notificationElement.style.backgroundColor = '#4CAF50';
                            setTimeout(function() {
                                notificationElement.remove();
                            }, 3000);
                        }
                        console.log("Redis flush operation completed successfully");
                    } else {
                        // Operation failed
                        var errorMessage = (response && response.errorInfo) ? 
                            response.errorInfo : "Unknown error occurred";
                        
                        if (typeof Terrasoft.showError === 'function') {
                            Terrasoft.showError("Failed to flush Redis database: " + errorMessage);
                        } else if (notificationElement) {
                            notificationElement.textContent = 'Failed to flush Redis database: ' + errorMessage;
                            notificationElement.style.backgroundColor = '#f44336';
                            setTimeout(function() {
                                notificationElement.remove();
                            }, 5000);
                        }
                        console.error("Redis flush operation failed:", errorMessage);
                    }
                    reloadPage();
                }
            });
        } else {
            // Fallback using standard fetch if Terrasoft methods are not available
            console.warn("Terrasoft service methods not available, using fetch fallback");
            
            var baseUrl = window.location.protocol + '//' + window.location.host;
            var redisFlushUrl = baseUrl + "/ServiceModel/AppInstallerService.svc/ClearRedisDb";
            
            fetch(redisFlushUrl, {
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
                    if (notificationElement) {
                        notificationElement.textContent = 'Redis database successfully flushed. Reloading page...';
                        notificationElement.style.backgroundColor = '#4CAF50';
                        setTimeout(function() {
                            notificationElement.remove();
                        }, 3000);
                    }
                    console.log("Redis flush operation completed successfully");                    
                } else {
                    // Operation failed
                    var errorMessage = (data && data.errorInfo) ? 
                        data.errorInfo : "Unknown error occurred";
                    
                    if (notificationElement) {
                        notificationElement.textContent = 'Failed to flush Redis database: ' + errorMessage;
                        notificationElement.style.backgroundColor = '#f44336';
                        setTimeout(function() {
                            notificationElement.remove();
                        }, 5000);
                    }
                    console.error("Redis flush operation failed:", errorMessage);
                }
                reloadPage();
            })
            .catch(function(error) {
                if (notificationElement) {
                    notificationElement.textContent = 'Error executing Redis flush: ' + error.message;
                    notificationElement.style.backgroundColor = '#f44336';
                    setTimeout(function() {
                        notificationElement.remove();
                    }, 5000);
                }
                console.error("Redis flush operation error:", error);
            });
        }
    } catch (error) {
        console.error("Exception in FlushRedisDB script:", error);
        
        // Display error notification
        var errorNotification = document.createElement('div');
        errorNotification.textContent = 'Error in Redis flush operation: ' + error.message;
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
        }, 5000);
    }
})();
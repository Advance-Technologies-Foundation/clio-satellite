// RestartApp.js
// Script to restart the Creatio application by unloading the app domain

(function() {
    // Safety check to ensure we're in the correct context
    if (typeof Terrasoft === 'undefined') {
        console.error("Terrasoft object not found in the page context");
        
        // Create a notification to inform the user
        var notification = document.createElement('div');
        notification.textContent = 'Error: Terrasoft object not available. App restart failed.';
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
        
        // Изменено, чтобы сделать текст элемента notification моргающим.
        notification.style.animation = 'restartAnimation 1.5s infinite';
        
        // Remove the notification after a few seconds
        setTimeout(function() {
            notification.remove();
        }, 5000);
        
        return;
    }
    
    try {
        // Show notification to user
        if (typeof Terrasoft.showInformation === 'function') {
            Terrasoft.showInformation("Restarting application...");
        } else {
            console.log("Terrasoft.showInformation not available, using fallback notification");
            
            // Fallback notification
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
            
            // Изменено, чтобы сделать текст элемента notification моргающим.
            notification.style.animation = 'restartAnimation 1.5s infinite';
            
            // Store the notification element for later removal
            var notificationElement = notification;
        }
        
        // Function to reload the page after successful operation
        function reloadPage() {
            console.log("Reloading page...");
            setTimeout(function() {
                window.location.reload(true);
            }, 1000);
        }
        
        // Use the Terrasoft.ServiceProvider approach which is more reliable
        if (Terrasoft.ServiceProvider && typeof Terrasoft.ServiceProvider.callService === 'function') {
            // Using Terrasoft's native service provider
            console.log("Using Terrasoft.ServiceProvider to unload app domain");
            
            Terrasoft.ServiceProvider.callService({
                serviceName: "AppInstallerService",
                methodName: "UnloadAppDomain",
                data: {},
                callback: function(response) {
                    if (response && response.success) {
                        // Operation succeeded - perform page reload
                        console.log("UnloadAppDomain successful, reloading page");
                        reloadPage();
                    } else {
                        // Operation failed
                        var errorMessage = (response && response.errorInfo) ? 
                            response.errorInfo : "Unknown error occurred";
                        
                        if (typeof Terrasoft.showError === 'function') {
                            Terrasoft.showError("Failed to restart application: " + errorMessage);
                        } else if (notificationElement) {
                            notificationElement.textContent = 'Failed to restart application: ' + errorMessage;
                            notificationElement.style.backgroundColor = '#f44336';
                            setTimeout(function() {
                                notificationElement.remove();
                            }, 5000);
                        }
                        console.error("Restart operation failed:", errorMessage);
                        
                        // Try fallback reload method
                        console.log("Attempting fallback restart method");
                        reloadPage();
                    }
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
            
            // Define the URL for app domain unloading
            var unloadAppDomainUrl = baseUrl + "/ServiceModel/AppInstallerService.svc/UnloadAppDomain";
            console.log("Using Terrasoft.AjaxProvider to restart app at URL: " + unloadAppDomainUrl);
            
            // Execute the restart operation
            Terrasoft.AjaxProvider.request({
                url: unloadAppDomainUrl,
                method: "POST",
                data: JSON.stringify({}), // Empty JSON object as data
                headers: {
                    "Content-Type": "application/json"
                },
                callback: function(response) {
                    if (response && response.success) {
                        // Operation succeeded - perform page reload
                        console.log("UnloadAppDomain successful, reloading page");
                        reloadPage();
                    } else {
                        // Operation failed
                        var errorMessage = (response && response.errorInfo) ? 
                            response.errorInfo : "Unknown error occurred";
                        
                        if (typeof Terrasoft.showError === 'function') {
                            Terrasoft.showError("Failed to restart application: " + errorMessage);
                        } else if (notificationElement) {
                            notificationElement.textContent = 'Failed to restart application: ' + errorMessage;
                            notificationElement.style.backgroundColor = '#f44336';
                            setTimeout(function() {
                                notificationElement.remove();
                            }, 5000);
                        }
                        console.error("Restart operation failed:", errorMessage);
                        
                        // Try fallback reload method
                        console.log("Attempting fallback restart method");
                        reloadPage();
                    }
                }
            });
        } else {
            // Fallback using standard fetch if Terrasoft.AjaxProvider is not available
            //console.warn("Terrasoft service methods not available, using fetch fallback");
            
            var baseUrl = window.location.protocol + '//' + window.location.host;
            var unloadAppDomainUrl = baseUrl.endsWith('/0')
              ? baseUrl + '/ServiceModel/AppInstallerService.svc/UnloadAppDomain'
              : baseUrl + '/0/ServiceModel/AppInstallerService.svc/UnloadAppDomain';
            
            console.log('Using fetch to restart app at URL: ' + unloadAppDomainUrl);
            
            // exclude BPMCSRF token
            function getCookieValue(cookieName) {
              const cookies = document.cookie.split(';');
              for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === cookieName) {
                  return value;
                }
              }
              return null;
            }
            
            const bpmCsrfToken = getCookieValue('BPMCSRF');
            if (!bpmCsrfToken) {
              console.error('BPMCSRF cookie not found. Request may fail.');
            }
            
            fetch(unloadAppDomainUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'BPMCSRF': bpmCsrfToken || ''
                },
                body: JSON.stringify({}),
                credentials: 'include'
            })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (data && data.success) {
                    console.log('UnloadAppDomain successful, reloading page');
                    reloadPage();
                } else {
                    const errorMessage = (data && data.errorInfo) ? data.errorInfo : 'Unknown error occurred';
                    console.error('Restart operation failed:', errorMessage);
                    reloadPage();
                }
            })
            .catch(function(error) {
                console.error('Error executing restart:', error);
                reloadPage();
            });
        }
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
    
    // To invisible actions menu and make header text blinking
    const actionsMenuContainer = document.querySelector('.actions-menu-container');
    if (actionsMenuContainer) {
      actionsMenuContainer.style.visibility = 'hidden';
    }
    
    // To invisible actions menu and make header text blinking
    const header = document.querySelector('.header');
    if (header) {
      header.style.animation = 'restartAnimation 1.5s infinite';
    }
    
    // Adding styles for animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes restartAnimation {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      div[style*="fixed"] {
        animation: restartAnimation 1.5s infinite;
      }
    `;
    document.head.appendChild(style);
})();
// FlushRedisDB.js
// Script to flush Redis database in Creatio

(function() {
    // Define the URL for Redis flushing operation
    // This assumes Creatio has an API endpoint for Redis operations
    var redisFlushUrl = Terrasoft.getApplicationPath() + "/ServiceModel/AppInstallerService.svc/ClearRedisDb";
    
    // Log for debugging
    console.log("Attempting to flush Redis DB");
    
    // Show notification to user
    Terrasoft.showInformation("Flushing Redis database...");
    
    // Execute the Redis flush operation
    Terrasoft.AjaxProvider.request({
        url: redisFlushUrl,
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        callback: function(response) {
            if (response && response.success) {
                // Operation succeeded
                Terrasoft.showInformation("Redis database successfully flushed");
                console.log("Redis flush operation completed successfully");
            } else {
                // Operation failed
                var errorMessage = (response && response.errorInfo) ? 
                    response.errorInfo : "Unknown error occurred";
                Terrasoft.showError("Failed to flush Redis database: " + errorMessage);
                console.error("Redis flush operation failed:", errorMessage);
            }
        }
    });
})();
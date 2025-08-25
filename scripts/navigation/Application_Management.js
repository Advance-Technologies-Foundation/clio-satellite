// Wrapper to avoid variable name conflicts
(function() {
  // Open Application Management in a new tab based on current URL structure
  var currentUrl = window.location.href;
  var aspxMatch = currentUrl.match(/(.*)\/.+\.aspx.*/);
  var newPath = [];

  if (aspxMatch !== null) {
    newPath.push(aspxMatch[1]);
  } else {
    var frameworkMatch = currentUrl.match(/(.*\/[0-9]{1})\/.+/);
    if (frameworkMatch !== null) {
      newPath.push(frameworkMatch[1]);
    } else {
      newPath.push(window.location.origin);
    }
    newPath.push('ClientApp');
  }

  newPath.push('#');
  newPath.push('ApplicationManagement');
  window.open(newPath.join('/'), '_blank');
})();

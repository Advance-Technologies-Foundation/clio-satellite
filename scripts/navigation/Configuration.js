// Wrapper to avoid variable name conflicts
(function() {
  let currentUrl = window.location.href;
  var aspxMatch = currentUrl.match(/(.*)\/.+\.aspx.*/);
  var newPath = [];

  if (aspxMatch !== null) {
    newPath.push(aspxMatch[1]);
  } else {
    var frameworkMath = currentUrl.match(/(.*\/[0-9]{1})\/.+/);
    if (frameworkMath !== null) {
      newPath.push(frameworkMath[1]);
    } else {
      newPath.push(window.location.origin);
    }
  }

  // Remove /Nui from the path if it exists
  let basePath = newPath[0];
  if (basePath && basePath.includes('/Nui')) {
    basePath = basePath.replace(/\/Nui/g, '');
    newPath[0] = basePath;
  }

  // Fixed the syntax error in the original script
  newPath.push("dev");
  window.open(newPath.join('/'), '_blank');
})();

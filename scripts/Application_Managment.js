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
    newPath.push("ClientApp");
  }

  newPath.push("#");
  newPath.push("ApplicationManagement");
  window.open(newPath.join('/'), '_blank');
})();

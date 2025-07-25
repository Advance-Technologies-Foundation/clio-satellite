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
  
    newPath.push("SHELL/#Section/AtfTIDE_ListPage");
    window.open(newPath.join('/'), '_blank');
  })();
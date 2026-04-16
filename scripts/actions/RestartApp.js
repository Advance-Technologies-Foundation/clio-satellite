(function () {
    if (typeof Terrasoft === 'undefined') {
        showToast('Terrasoft not available — restart failed', '#f44336');
        return;
    }

    var UNLOAD_PATH = '/0/ServiceModel/AppInstallerService.svc/UnloadAppDomain';

    function reloadPage() {
        setTimeout(function () { window.location.reload(true); }, 1500);
    }

    function showToast(text, color) {
        var el = document.createElement('div');
        el.textContent = text;
        el.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);' +
            'background:' + color + ';color:#fff;padding:10px 20px;border-radius:4px;' +
            'z-index:10000;box-shadow:0 2px 5px rgba(0,0,0,.3)';
        document.body.appendChild(el);
        setTimeout(function () { el.remove(); }, 5000);
    }

    function onComplete(success) {
        if (success) {
            console.log('[RestartApp] UnloadAppDomain OK, reloading');
        } else {
            // UnloadAppDomain drops the connection immediately on success —
            // a non-success response is expected and does not indicate failure.
            console.log('[RestartApp] UnloadAppDomain — reloading');
        }
        reloadPage();
    }

    // Hide actions menu while restarting
    var menu = document.querySelector('.actions-menu-container');
    if (menu) menu.style.visibility = 'hidden';

    if (typeof Terrasoft.showInformation === 'function') {
        Terrasoft.showInformation('Restarting application…');
    } else {
        showToast('Restarting application…', '#4CAF50');
    }

    // Use ServiceProvider if available (Freedom UI / newer Creatio)
    if (Terrasoft.ServiceProvider && typeof Terrasoft.ServiceProvider.callService === 'function') {
        Terrasoft.ServiceProvider.callService({
            serviceName: 'AppInstallerService',
            methodName: 'UnloadAppDomain',
            data: {},
            callback: function (response) {
                onComplete(response && response.success);
            }
        });
        return;
    }

    // AjaxProvider (classic Creatio) — callback is (request, success, response)
    if (Terrasoft.AjaxProvider && typeof Terrasoft.AjaxProvider.request === 'function') {
        var baseUrl = Terrasoft.workspaceBaseUrl ||
            (window.location.protocol + '//' + window.location.host);

        Terrasoft.AjaxProvider.request({
            url: baseUrl + UNLOAD_PATH,
            method: 'POST',
            data: '{}',
            headers: { 'Content-Type': 'application/json' },
            callback: function (_request, success) {
                onComplete(success);
            }
        });
        return;
    }

    // Fallback: plain fetch
    function getCsrf() {
        var match = document.cookie.match(/(?:^|;\s*)BPMCSRF=([^;]*)/);
        return match ? match[1] : '';
    }

    var url = window.location.protocol + '//' + window.location.host + UNLOAD_PATH;
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'BPMCSRF': getCsrf() },
        body: '{}',
        credentials: 'include'
    })
    .then(function (r) { return r.json(); })
    .then(function (data) { onComplete(data && data.success); })
    .catch(function () { onComplete(false); });
})();

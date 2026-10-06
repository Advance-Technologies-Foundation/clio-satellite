(function () {
    var MARKETPLACE_URL = 'https://marketplace.creatio.com/app/telemetry-log-creatio';
    var base = window.location.protocol + '//' + window.location.host;
    var REALOG_URL = base + '/0/Shell/#BaseSchemaModuleV2/Realog';

    function getCsrf() {
        var match = document.cookie.match(/(?:^|;\s*)BPMCSRF=([^;]*)/);
        return match ? match[1] : '';
    }

    function showToast(text, color) {
        var el = document.createElement('div');
        el.textContent = text;
        el.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);' +
            'background:' + color + ';color:#fff;padding:10px 20px;border-radius:4px;' +
            'z-index:10000;box-shadow:0 2px 5px rgba(0,0,0,.3)';
        document.body.appendChild(el);
        setTimeout(function () { el.remove(); }, 4000);
    }

    var checkUrl = base + '/0/DataService/json/SyncReply/SelectQuery';
    var requestBody = JSON.stringify({
        rootSchemaName: 'SysPackage',
        operationType: 0,
        columns: {
            items: {
                Name: { expression: { expressionType: 0, columnPath: 'Name' } }
            }
        },
        filters: {
            logicalOperation: 0,
            isEnabled: true,
            filterType: 6,
            items: {
                NameFilter: {
                    filterType: 1,
                    comparisonType: 3,
                    isEnabled: true,
                    leftExpression: { expressionType: 0, columnPath: 'Name' },
                    rightExpression: {
                        expressionType: 2,
                        parameter: { dataValueType: 1, value: 'Telemetry' }
                    }
                }
            }
        }
    });

    fetch(checkUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'BPMCSRF': getCsrf()
        },
        credentials: 'include',
        body: requestBody
    })
    .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
    })
    .then(function (data) {
        var found = data && data.rows && data.rows.length > 0;
        if (found) {
            window.open(REALOG_URL, '_blank');
        } else {
            window.open(MARKETPLACE_URL, '_blank');
        }
    })
    .catch(function () {
        showToast('Could not check Telemetry package — check your connection', '#f44336');
    });
})();

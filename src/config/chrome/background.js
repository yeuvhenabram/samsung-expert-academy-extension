chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'loading') {
        return;
    }

    chrome.tabs.executeScript(
        tabId, {
            code: 'var injected = window.samsungextInjected; window.samsungextInjected = true; injected;',
            runAt: 'document_start'
        },
        (res) => {
            // If page isn't in the permission list (lastError is set) or injected is true, do nothing
            if (chrome.runtime.lastError || res[0]) {
                return;
            }

            const cssFiles = ['samsungext.css'];

            const jsFiles = [
                'jquery.js',
                'jquery-ui.js',
                'clipboard.min.js',
                'keymaster.js',
                'samsungext.js'
            ];

            eachTask([
                (cb) => eachItem(cssFiles, inject('insertCSS'), cb),
                (cb) => eachItem(jsFiles, inject('executeScript'), cb)
            ]);

            function inject(fn) {
                return (file, cb) => {
                    chrome.tabs[fn](tabId, {file: file, runAt: 'document_start'}, cb);
                };
            }
        }
    );
});

chrome.runtime.onMessage.addListener((req, sender, sendRes) => {
    const handler = {
        requestPermissions: () => {
            const urls = (req.urls || []).filter((url) => url.trim() !== '').map((url) => {
                if (url.slice(-2) === '/*') {
                    return url;
                }
                if (url.slice(-1) === '/') {
                    return url + '*';
                }
                return url + '/*';
            });

            if (urls.length === 0) {
                sendRes(true);
                removeUnnecessaryPermissions();
            } else {
                chrome.permissions.request({origins: urls}, (granted) => {
                    sendRes(granted);
                    removeUnnecessaryPermissions();
                });
            }
            return true;

            function removeUnnecessaryPermissions() {
                const whitelist = urls.concat(['https://www.swexpertacademy.com/*']);
                chrome.permissions.getAll((permissions) => {
                    const toBeRemovedUrls = permissions.origins.filter((url) => {
                        return !~whitelist.indexOf(url);
                    });

                    if (toBeRemovedUrls.length) {
                        chrome.permissions.remove({origins: toBeRemovedUrls});
                    }
                });
            }
        }
    };

    return handler[req.type]();
});

function eachTask(tasks, done) {
    (function next(index = 0) {
        if (index === tasks.length) {
            done && done();
        } else {
            tasks[index](() => next(++index));
        }
    })();
}

function eachItem(arr, iter, done) {
    const tasks = arr.map((item) => {
        return (cb) => iter(item, cb);
    });
    return eachTask(tasks, done);
}
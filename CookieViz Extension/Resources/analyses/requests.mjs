import('../js/psl.js');

const tabEventListener = {}

// Requests tables forms
const requests_table_column = {
    //Standard request fields
    request_table: ['page', 'url', 'referer', 'cookie', 'timestamp']
}

// Crawler analyses
function getBaseDomain(full_url) {
    if (full_url == null) return null;
    return psl.parse(full_url).domain;
}

function extractCookies(cookies) {
    if (!cookies) return {};
    return cookies.split(/; */).reduce((obj, str) => {
        if (str === "") return obj;
        const eq = str.indexOf('=');
        const key = eq > 0 ? str.slice(0, eq) : str;
        let val = eq > 0 ? str.slice(eq + 1) : null;
        if (val != null) try {
            val = decodeURIComponent(val);
        } catch (ex) {
            //console.log(ex); 
        }
        obj[key] = val;
        return obj;
    }, {});
}

// Parsing cookie header
function parseCookies(cookie_header_strs) {
    const cookies = {};

    if (Array.isArray(cookie_header_strs)) {
        for (const cookie_header_str of cookie_header_strs) {
            Object.assign(cookies, extractCookies(cookie_header_str));
        }
        return cookies;
    }
    return extractCookies(cookie_header_strs);
}



function parseHeader(table, headerdetails) {
    const results = {};

    for (var i = 0; i < headerdetails.length; i++) {
        const header = headerdetails[i];
        const name = header.name.toLowerCase();
        if (!table.includes(name)) {
            continue;
        }
        if (name in results) {
            if (!Array.isArray(results[name])) {
                // Transform this place into an array
                results[name] = [results[name]];
            }

            results[name].push(header.value);
        } else {
            results[name] = header.value;
        }
    }
    return results;
}

function processRequest(requestdetails) {
    let current_page = tabEventListener[requestdetails.tabId].current_page;

    if (!current_page) return;

    const headers = parseHeader(['set-cookie', 'referer'], requestdetails.responseHeaders);

    const referer = 'referer' in headers ? new URL(headers['referer']).hostname : null;

    WriteToDb("request_table", { page: current_page, url: new URL(requestdetails.url).hostname, referer: referer, cookie: headers['set-cookie'], timestamp: requestdetails.timeStamp });
}

const CSS = "body { border: 5px solid #fa4564; }";

function initRequestsCrawler(id, url) {
    tabEventListener[id] = {
        current_page: new URL(url),
        new_page: null,
        analysis: function (requestdetails) {
            processRequest(requestdetails);
        }, updated: function (tabId, changeInfo, tabInfo) {            
            if (changeInfo.status == "loading" && changeInfo.url) {
                let full_url = new URL(changeInfo.url);
                let host = psl.parse(full_url.hostname).domain;

                tabEventListener[tabId].current_page = host;
                browser.tabs.insertCSS({code: CSS});
                browser.browserAction.setIcon({
                    path: "icons/record.svg",
                    tabId: tabId
                });
            }
        }, delete: function (tabId) { 
            browser.tabs.removeCSS({code: CSS});
        }
    };

    browser.tabs.insertCSS({code: CSS});

    // Read cookie
    nwjsBrowser.onHeadersReceived.addListener(tabEventListener[id].analysis, {
        urls: ["*://*/*"],
        tabId: id
        //}, ['requestHeaders', 'extraHeaders'] chrome
    }, ['requestHeaders']
    );

    browser.tabs.onUpdated.addListener(tabEventListener[id].updated, {
        tabId: id
        //}, ['requestHeaders', 'extraHeaders'] chrome
    });
}

function deleteRequestsCrawler(id) {
    if (tabEventListener[id]) {
        tabEventListener[id].delete(id);
        nwjsBrowser.onBeforeSendHeaders.removeListener(tabEventListener[id].analysis);
        browser.tabs.onUpdated.removeListener(tabEventListener[id].updated);
        delete tabEventListener[id];
    }
}

function statusRequestsCrawler(id) {
    return id in tabEventListener;
}

function getNodes(table, index) {
    return new Promise((resolve, reject) => {
        if (!db) resolve([]);

        let txn = db.transaction([table], 'readonly');

        function get_requested() {
            return new Promise((resolve, reject) => {
                const objectStore = txn.objectStore(table);

                if (index) {
                    objectStore = objectStore.index(index);
                }

                let visited = new Set();
                let requested = new Set();

                objectStore.openCursor().onsuccess = function (event) {
                    const cursor = event.target.result;
                    if (cursor) {
                        const page = getBaseDomain(cursor.value.page);
                        const referer = getBaseDomain(cursor.value.page);
                        const url = getBaseDomain(cursor.value.url);

                        visited.add(page);
                        requested.add(page);
                        requested.add(url);
                        cursor.continue();
                    } else {
                        resolve([Array.from(visited), Array.from(requested)]);
                    }
                }
            });
        }

        get_requested().then((values) => {
            const visited = values[0];
            resolve([...new Set(values.flat())]
                .filter(x => x)
                .map(x => ({ 'id': x, 'visited': visited.includes(x) ? 1 : 0 })));
        });
    });
}

function getAllNodes(table, index, with_cookies, filter) {
    return new Promise((resolve, reject) => {

        if (!db) resolve([]);

        let txn = db.transaction([table], 'readonly');
        let objectStore = txn.objectStore(table);

        let pageIndex = objectStore.index('page');
        let getRequest = pageIndex.getAll(filter);
        let visited = new Set();
        let nodes = new Set();

        getRequest.onsuccess = function () {
            let result = getRequest.result;
            if (with_cookies) {
                result = result.filter(x => x.cookie);
            }

            result.forEach(x => {
                index.forEach(i => nodes.add(x[i]));
                visited.add(x[index[0]]);
            });

            visited = Array.from(visited);
            nodes = Array.from(nodes)
                .filter(x => x)
                .map(x => getBaseDomain(x));

            resolve([...new Set(nodes)]
                .map(x => ({ 'id': x, 'visited': visited.includes(x) ? 1 : 0 })));
        };
    });
}
function getAllNodesByTimestamp(table, index, with_cookies, timestamps, filter) {
    return new Promise((resolve, reject) => {
        if (!db) resolve([]);

        let keyRangeValue = IDBKeyRange.lowerBound(Number(timestamps));
        let txn = db.transaction([table], 'readonly');
        let objectStore = txn.objectStore(table).index("timestamp");


        let nodes = new Set();
        objectStore.openCursor(keyRangeValue).onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {

                if (with_cookies && !cursor.value.cookie) {
                    cursor.continue();
                    return;
                }

                const url = getBaseDomain(cursor.value.url);
                if (cursor.value.page != filter) {
                    resolve(Array.from(nodes));
                    return;
                }

                if (url != filter) nodes.add(url);

                cursor.continue();
            } else {
                resolve(Array.from(nodes));
            }
        };
    });

}

function getLinks(table, index, filter) {
    return new Promise((resolve, reject) => {

        if (!db) resolve([]);

        let txn = db.transaction([table], 'readonly');
        let objectStore = txn.objectStore(table);

        let pageIndex = objectStore.index('page');
        let getRequest = pageIndex.getAll(filter);

        getRequest.onsuccess = function () {
            let links = [];

            let filtered_links = [...new Set(getRequest.result
                .filter(x => x.cookie && x.url && x.page)
                .map(x => JSON.stringify(x)))].map(x => JSON.parse(x));

            filtered_links
                .forEach(x => {
                    const source = getBaseDomain(x.page);
                    const target = getBaseDomain(x.url);
                    if (source == target) return;

                    const link = links.find(x => x.source == source && x.target == target);
                    const cookies = parseCookies(x.cookie);

                    if (link) {
                        Object.assign(link.cookie, cookies);
                    } else {
                        links.push({ source: source, target: target, cookie: cookies });
                    }
                })
            resolve(links);
        }
    });
}

function distrib(table, index) {
    return new Promise((resolve, reject) => {
        const reverse_map = {};

        let txn = db.transaction([table], 'readonly');
        const objectStore = txn.objectStore(table).index(index);

        objectStore.openCursor().onsuccess = function (event) {
            const cursor = event.target.result;

            if (cursor) {

                const page = getBaseDomain(cursor.value.page);
                const url = getBaseDomain(cursor.value.url);

                if (!(url in reverse_map)) {
                    reverse_map[url] = new Set();
                }

                reverse_map[url].add(page);

                cursor.continue();
            } else {
                resolve(Object.keys(reverse_map)
                    .map((x) => ({ site: x, value: reverse_map[x].size }))
                    .sort((a, b) => b.value - a.value)
                );
            }
        }
    });
}

// Entry point of the analyzes
const requests = {
    name: "requests",
    description: "This plugins analyzes requests and stores cookies",
    author: "linc",
    init: initRequestsCrawler,
    delete: deleteRequestsCrawler,
    status: statusRequestsCrawler,
    tables: requests_table_column,
    data: {
        "link_requests": getLinks.bind(null, "request_table"),
        "nodes_requests": getAllNodes.bind(null, "request_table", ["page", "page", "url"], false),
        "nodes_requests_with_cookies": getAllNodes.bind(null, "request_table", ["page", "page", "url"], true),
        "nodes_requests_with_cookies_ordered_by_timestamp": getAllNodesByTimestamp.bind(null, "request_table", ["page", "url"], true),
        "link_requests_with_cookies": getLinks.bind(null, "request_table", "cookie"),
        "distrib": distrib.bind(null, "request_table", "cookie"),
    }
}

export function plugins() {
    return requests;
}

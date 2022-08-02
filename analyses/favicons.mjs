import "../js/psl.js";
import { Favicon } from '../js/favicon.js';
import { getFromDB, WriteToDb } from "../core/database.js"
import { initDb } from "../core/database.js"

var nwjsBrowser = chrome.webRequest;

const tabFaviconListener = {};

const favicons_table_column = {
    "favicons": [
        "website"
    ]
}

var favicons_stored = [];

const favicon_crawler = new Favicon('./icons/empty_favicon.png');

function extractHostname(url, keep_protocol) {
    let hostname;

    if (!url) return "";

    //find & remove protocol (http, ftp, etc.) and get hostname
    if (url.indexOf("//") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return hostname;
}


function processFaviconRequest(requestdetails) {
    //Parsing all cookies
    let request_url = psl.get(extractHostname(requestdetails.url));

    async function checkFavicon(request) {
        favicons_stored.push(request);
        var index = await getFromDB(plugins_favicon, "favicons", 'website');

        index.get(request).onsuccess = function (event) {
            var cursor = event.target.result;
            if (cursor) {
                return;
            } else {
                if (!requestdetails.url) return;
                try {
                    favicon_crawler.get(requestdetails.url, url => {
                        WriteToDb(plugins_favicon, "favicons", { website: request, favicon: url });
                    });
                } catch (e) {
                    WriteToDb(plugins_favicon, "favicons", { website: request, favicon: null });
                    return;
                }
            }
        };
    }

    if (request_url && !favicons_stored.includes(request_url)) checkFavicon(request_url);
}

function initFaviconCrawler(id, url) {
    tabFaviconListener[id] = {
        analysis: function (requestdetails) {
            //processFaviconRequest(requestdetails)
        }
    };

    // Read cookie
    nwjsBrowser.onBeforeSendHeaders.addListener(tabFaviconListener[id].analysis, {
        urls: ["*://*/*"],
        tabId: id
    });
}

function deleteFaviconCrawler(id) {
    if (tabFaviconListener[id]) {
        chrome.tabs.onUpdated.removeListener(tabFaviconListener[id].analysis);
        delete tabFaviconListener[id];
    }
    favicons_stored = [];
}


function statusFaviconCrawler(id) {
    return id in tabFaviconListener;
}


async function get_all_favicons() {
    return new Promise(async (resolve, reject) => {
        const favicons = {};
        const objectStore = await getFromDB(plugins_favicon, "favicons");
        objectStore.openCursor().onsuccess = function (event) {
            var cursor = event.target.result;
            if (cursor) {
                favicons[cursor.value.website] = cursor.value.favicon;
                cursor.continue();
            } else {
                resolve(favicons);
            }
        }
    });
}


// Template for plugins
const plugins_favicon = {
    name: "favicons",
    description: "This plugins stores favicons of every website that send/receive requests",
    author: "linc",
    tables: favicons_table_column,
    init: initFaviconCrawler,
    delete: deleteFaviconCrawler,
    status: statusFaviconCrawler,
    data: {
        "get_all_favicons": get_all_favicons
    }
}



// Entry point of plugins
export function plugins() {
    return plugins_favicon;
}



import { plugins as requests } from "../analyses/requests.mjs"
import { plugins as websites } from "../analyses/websites.mjs"
import { plugins as favicons } from "../analyses/favicons.mjs"
import { initDb } from "../core/database.js"
import { initAnalysis, stopAnalysis, statusAnalysis, clearPlugins } from "../core/plugins.js"

var browser = chrome;
var network_status = 'pause';
var visit_list = [];
var listener = null;

var nwjsBrowser = chrome.webRequest;

const loaded_plugins = [requests, websites, favicons];
var extended = false;

function start(id, url) {
    loaded_plugins.forEach(plugins => initAnalysis(plugins(), id, url));
}

function stop(id) {
    loaded_plugins.forEach(plugins => stopAnalysis(plugins(), id));
}


function is_active(id) {
    return loaded_plugins
        .map(plugins => statusAnalysis(plugins(), id))
        .filter(x => x);
}
function listen_for_newtab(tab) {
    start(tab.id, tab.url);
}

function updateVisit(tabId, changeInfo, tab){
    if (changeInfo.status == "complete"){
        setTimeout(()=>{
            browser.tabs.update(tabId,{
                url: visit_list.shift()
              });
        }, 5000);
    }
}


chrome.runtime.onMessage.addListener(
    (data, sender, sendResponse) => {
        switch (data.type) {
            case 'play':
                chrome.action.setIcon({
                    path: {
                        16: "../icons/record-16.png",
                        32: "../icons/record-32.png",
                        64: "../icons/record-64.png",
                        128: "../icons/record-128.png",
                    },
                    tabId: data.id
                });
                start(data.id, data.url);
                network_status = data.type;

                if (data.typeScan == "all_tab") {
                    browser.tabs.onCreated.addListener(listen_for_newtab);
                }else if (data.typeScan == "visit"){
                    let tabId = data.id;
                    listener = function (id, changeInfo, tab) {
                        if (tabId == id && changeInfo.status == 'complete') {
                            setTimeout(()=>{
                                browser.tabs.update(data.id,{
                                    url: visit_list.shift()
                                });
                            }, 5000);
                        }
                    }

                    browser.tabs.onUpdated.addListener(listener);

                    browser.tabs.update(tabId,{
                        url: visit_list.shift()
                    });
                }
                break;
            case 'pause':
                chrome.action.setIcon({
                    path: {
                        16: "../icons/cookie-viz-favicon-16.png",
                        32: "../icons/cookie-viz-favicon-32.png",
                        64: "../icons/cookie-viz-favicon-64.png",
                        128: "../icons/cookie-viz-favicon-128.png",
                    },
                    tabId: data.id
                });
                stop(data.id);
                network_status = data.type;
                if (data.typeScan == "all_tab") {
                    browser.tabs.onCreated.removeListener(listen_for_newtab);
                }else if (data.typeScan == "visit"){
                    browser.tabs.onUpdated.removeListener(listener);
                }
                break;
            case 'clear':
                chrome.browsingData.removeCookies({});
                for (const plugins of loaded_plugins){
                    clearPlugins(plugins());
                }
                break;
            case 'visit':
                visit_list = data.url;
                break;
            case 'browse':
                console.log("browse");
                break;
            case 'analysis':
                return sendResponse(is_active(data.id).length == 0 ? "inactive" : "active");
            case 'extend':
                extended = true;
                break;
            case 'reduce':
                extended = false;
                break;
            case 'status':
                console.log(is_active(data.id).length == 0 ? "inactive" : "active");
                return sendResponse({ active: is_active(data.id).length != 0, extended: extended });
            default:
                console.log("unknown message");
                break;
        }
        return sendResponse('done');
    }
);



chrome.runtime.onInstalled.addListener(() => {
    initDb(loaded_plugins);
});
var network_status = 'pause';
var visit_list = [];

if (typeof browser == 'undefined') {
    browser = chrome;
}

var nwjsBrowser = browser.webRequest;

const loaded_plugins = [];
var extended = false;

function start(id, url) {
    loaded_plugins.forEach(module => initAnalysis(module.plugins(), id, url));
}

function stop(id) {
    loaded_plugins.forEach(module => stopAnalysis(module.plugins(), id));
}

function clear(id) {
    //browser.browsingData.removeCookies({});
    loaded_plugins.forEach(module => clearPlugins(module.plugins()));
}

function is_active(id) {
    return loaded_plugins
        .map(module => statusAnalysis(module.plugins(), id))
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

browser.runtime.onMessage.addListener(
    (data, sender) => {
        switch (data.type) {
            case 'play':
                browser.browserAction.setIcon({
                    path: "icons/record.svg",
                    tabId: data.id
                  });
                start(data.id, data.url);
                network_status = data.type;

                if (data.typeScan == "all_tab"){
                    browser.tabs.onCreated.addListener(listen_for_newtab);
                }else if (data.typeScan == "visit"){
                    browser.tabs.onUpdated.addListener(updateVisit,{
                        tabId: data.id,
                        properties:["status"]
                    });
                    browser.tabs.update(data.id,{
                        url: visit_list.shift()
                    });
                }
                break;
            case 'pause':
                browser.browserAction.setIcon({
                    tabId: data.id
                  });
                stop(data.id);
                network_status = data.type;
                if (data.typeScan == "all_tab"){
                    browser.tabs.onCreated.removeListener(listen_for_newtab);
                }else if (data.typeScan == "visit"){
                    browser.tabs.onUpdated.removeListener(updateVisit);
                }
                break;
            case 'clear':
                clear();
                break;
            case 'visit':
                visit_list = data.url;
                break;
            case 'browse':
                console.log("browse");
                break;
            case 'analysis':
                return Promise.resolve(is_active(data.id).length == 0 ? "inactive" : "active");
            case 'extend':
                extended = true;
                break;
            case 'reduce':
                extended = false;
                break;
            case 'status':
                console.log(is_active(data.id).length == 0 ? "inactive" : "active");
                return Promise.resolve({active : is_active(data.id).length != 0, extended:extended});
            default:
                console.log("unknown message");
                break;
        }
        return Promise.resolve('done');
    }
);

const loading = config.analyses.map((analysis) => {
    return new Promise((resolve, reject) => {
        try {
            import("../analyses/" + analysis + ".mjs").then(module => {
                loaded_plugins.push(module);
                resolve(module);
            })
        } catch (e){
            console.log("can't import the given analysis :" + analysis);
            reject(e);    
        }
    })
})

Promise.all(loading).then((modules) => {
    initDb(modules);
});

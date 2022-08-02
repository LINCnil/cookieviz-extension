//const { parseAdsTxt } = require('ads.txt');
import('../js/psl.js');

const tabWebsiteListener = {};

const websites_table_column = {
    websites_visited:[
        "url","timestamp"
    ],
    websites_adstxt:[
    ]
}

var website = null;
var index = null;

// Data handling
function getVisitedList(){
    if (!db) return;

    let txn = db.transaction(["websites_visited"], 'readonly');

    return new Promise((resolve, reject) => {
        const objectStore = txn.objectStore("websites_visited");

        let urls = [];

        objectStore.openCursor().onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                urls.push(cursor.value);
                cursor.continue();
            } else {
                resolve(urls);
            }
        }
    });
}

function cookie_snapshot(timestamps){
    if (!db) return;

    let keyRangeValue = IDBKeyRange.only(Number(timestamps));
    let txn = db.transaction(["websites_visited"], 'readonly');
    let objectStore = txn.objectStore("websites_visited").index("timestamp");
    
    return new Promise((resolve, reject) => {
        objectStore.openCursor(keyRangeValue).onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                let domains = cursor.value.cookies.map(x => x.domain );
                resolve([...new Set(domains)]);
            }else{
                resolve(null);
            }
        }
    });
}

function getAds() {
    if (!db) return;

    let txn = db.transaction(["websites_adstxt"], 'readonly');

    return new Promise((resolve, reject) => {
        const objectStore = txn.objectStore("websites_adstxt");

        let ads = [];

        objectStore.openCursor().onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                urls.push(cursor.value.domain);
                cursor.continue();
            } else {
                resolve(ads);
            }
        }
    });
}


// Crawler analyses
function storeAdsTxt(url){
    fetch(url).then(function(response) {
        if(response.ok) {
          response.text().then(function(ads_txt) {
            let { variables, fields } = parseAdsTxt(ads_txt);
            fields.forEach(field => {
                WriteToDb("websites_adstxt", {domain: field.domain, publisherAccountID: field.publisherAccountID, accountType: field.accountType, certificateAuthorityID: field.certificateAuthorityID});
            });
          });
        }
      })
      .catch(function(error) {
        //In case of error
        console.log("errror:" +error.message);
      });
}

function website_loaded(url, tabId, cookies, timestamp){
    let full_url= new URL(url);
    let host = psl.parse(full_url.hostname).domain;
    WriteToDb("websites_visited", {request_url:host, full_url:full_url.href, tabId:tabId, cookies:cookies, timestamp:timestamp});

    //Check if ads.txt/app-ads.txt is present
    //let host_name = full_url.protocol+'//'+host;
    //storeAdsTxt(host_name+"/ads.txt");
    //storeAdsTxt(host_name+"/app-ads.txt");
}

function initWebsitesAnalyses(id, url){
    tabWebsiteListener[id] = {
        updated: function (tabId, changeInfo, tabInfo) {
            if (changeInfo.status == "loading" && changeInfo.url){
                browser.cookies.getAll({}).then((cookies)=> website_loaded(changeInfo.url, tabId, cookies, Date.now()));
            }
        }
    };

    browser.tabs.onUpdated.addListener(tabWebsiteListener[id].updated, {
        tabId: id
        //}, ['requestHeaders', 'extraHeaders'] chrome
    });
}

function deleteWebsitesAnalyses(id){
    if (tabWebsiteListener[id]) {
        browser.tabs.onUpdated.removeListener(tabWebsiteListener[id].updated);
        delete tabWebsiteListener[id];
    }
    website = null;
    index = null;
}

function statusWebsitesAnalyses(id) {
    return id in tabWebsiteListener;
}

// Entry point of the analyzes
const websites = {
    name : "websites",
    description : "This plugins stores visited website and there associated ads.txt",
    author:"linc",
    tables:websites_table_column,
    init:initWebsitesAnalyses,
    delete:deleteWebsitesAnalyses,
    status:statusWebsitesAnalyses,
    data:{
        "visited_list": getVisitedList,
        "cookie_thirds_snapshot": cookie_snapshot,
        "adstxt_list": getAds
    }
}

export function plugins() {
    return websites;
}



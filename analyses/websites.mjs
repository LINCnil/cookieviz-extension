//const { parseAdsTxt } = require('ads.txt');
import"../js/psl.js";
import {WriteToDb, getFromDB} from "../core/database.js"
import {initDb} from "../core/database.js"

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
    return new Promise(async (resolve, reject) => {
        const objectStore = await getFromDB(websites, "websites_visited");

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
    return new Promise(async (resolve, reject) => {
        let keyRangeValue = IDBKeyRange.only(Number(timestamps));
        let objectStore = await getFromDB(websites, "websites_visited","timestamp");
    

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
    return new Promise((resolve, reject) => {
        const objectStore = getFromDB(websites, "websites_adstxt");

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
                WriteToDb(websites, "websites_adstxt", {domain: field.domain, publisherAccountID: field.publisherAccountID, accountType: field.accountType, certificateAuthorityID: field.certificateAuthorityID});
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
    WriteToDb(websites, "websites_visited", {request_url:host, full_url:full_url.href, tabId:tabId, cookies:cookies, timestamp:timestamp});

    //Check if ads.txt/app-ads.txt is present
    //let host_name = full_url.protocol+'//'+host;
    //storeAdsTxt(host_name+"/ads.txt");
    //storeAdsTxt(host_name+"/app-ads.txt");
}

function initWebsitesAnalyses(id, url){
    tabWebsiteListener[id] = {
        updated: function (tabId, changeInfo, tabInfo) {
            if (changeInfo.status == "loading" && changeInfo.url){
                chrome.cookies.getAll({}, function (cookies){website_loaded(changeInfo.url, tabId, cookies, Date.now())});
            }
        }
    };

    chrome.tabs.onUpdated.addListener(tabWebsiteListener[id].updated);
    chrome.cookies.getAll({}, function (cookies){website_loaded(url, id, cookies, Date.now())});
}

function deleteWebsitesAnalyses(id){
    if (tabWebsiteListener[id]) {
        chrome.tabs.onUpdated.removeListener(tabWebsiteListener[id].updated);
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



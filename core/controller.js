var filter_node = null;
var nb_visited = 0;
var nb_visited_with_cookie = 0;
var nb_third = 0;
var most_third = [0, 0];
var rest_third = [0, 0];

const DELAY = 1000;

const loaded_plugins = {};

const loading = config.analyses.map((analysis) => {
    return new Promise((resolve, reject) => {
        try {
            import("../analyses/" + analysis + ".mjs").then(module => {
                loaded_plugins[module.plugins().name] = module.plugins().data;
                resolve(module);
            })
        } catch (e) {
            console.log("can't import the given analysis :" + analysis);
            reject(e);
        }
    })
});

var nodes = [];
var links = [];
var updateViz_timeout = null;

function clearGraph(){
    //clearTimeout(updateViz_timeout);
    nodes = [];
    links = [];
    update_graph(node, link);
    UpdateViz();
    updateViz_timeout = setTimeout(UpdateViz, 1);
}

async function UpdateViz() {
    updateViz_timeout = null;

    const index = visited_list_expanded_div.selectedIndex;
    let visited_site ="";
    if (index != -1){
        visited_site = visited_list_expanded_div.options[index].text;
    }

    let refreshed_nodes = await loaded_plugins.requests.nodes_requests(visited_site);
    let refreshed_links = await loaded_plugins.requests.link_requests_with_cookies(visited_site);
    const adstxt_list = await loaded_plugins.websites.adstxt_list();

    try {
        const nodes_to_add = refreshed_nodes.filter(x => !nodes.some(y => y.id == x.id));
        const links_to_add = refreshed_links.filter(x => !links.some(y => y.source.id == x.source && y.target.id == x.target));
        const nodes_to_remove = nodes.filter(x => !refreshed_nodes.some(y => y.id == x.id));
        const links_to_remove = links.filter(x => !refreshed_links.some(y => y.source == x.source.id && y.target == x.target.id));

        // Update graph
        nodes_to_add.forEach(x => nodes.push(x));
        links_to_add.forEach(x => links.push(x));
        nodes_to_remove.forEach(x => nodes.splice(nodes.findIndex(y => y.id == x.id), 1));
        links_to_remove.forEach(x => links.splice(nodes.findIndex(y => y => y.source.id == x.source && y.target.id == x.target), 1));

        if (nodes_to_add.length > 0 ||
            links_to_add.length > 0 ||
            nodes_to_remove > 0 ||
            links_to_remove.length) {
            const favicons = await loaded_plugins.favicons.get_all_favicons();
            nodes.forEach(x => (x.id in favicons) ? x.icon = favicons[x.id] : null);

            update_graph(nodes, links);
        }

        updateViz_timeout = setTimeout(UpdateViz, DELAY);
    } catch (e) {
        console.log(e.trace());
        console.log("update error : " + e + "!")
        updateViz_timeout = setTimeout(UpdateViz, DELAY);
    }
}

async function updateThirds() {
    const index = visited_list_div.selectedIndex;
    let site = "";
    let timestamp = 0;

    if (index != -1){
        site = visited_list_div.options[index].text;
        timestamp = visited_list_div.options[index].value;
    }

    let nodes_with_cookies = await loaded_plugins.requests.nodes_requests_with_cookies_ordered_by_timestamp(timestamp, site);
   
    nb_thirds_div.textContent = nodes_with_cookies.length;
    setTimeout(updateThirds, DELAY);
}

async function updateDistrib() {

    const distrib = await loaded_plugins.requests.distrib();

    for (var i = 0; i < 3; i++) {
        if (distrib[i]) {
            podium_div[i].textContent = distrib[i].site;
        }
    }

    setTimeout(updateDistrib, DELAY);
}

async function updateNewCookies() {
    const index = visited_list_div.selectedIndex;
    let site = "";
    let timestamp = 0;

    if (index !=-1){
        site = visited_list_div.options[index].text;
        timestamp = visited_list_div.options[index].value;
    }
    

    const cookies_snapshot = await loaded_plugins.websites.cookie_thirds_snapshot(timestamp);

    const nodes_with_cookies = await loaded_plugins.requests.nodes_requests_with_cookies_ordered_by_timestamp(timestamp, site);
    const existing_cookies = nodes_with_cookies.filter(x => cookies_snapshot.find(y => y.endsWith(x)));
    const new_cookies = nodes_with_cookies.length - existing_cookies.length;
    nb_exists_div.innerText = existing_cookies.length;
    nb_news_div.innerText = new_cookies;
    setTimeout(updateNewCookies, DELAY);
}

var navigation = [];

function populateNavigation(nav_liv,url) {
    const unique_url = [...new Set(nav_liv.map(x => x.request_url))];

    unique_url.forEach(x => {
        const option2 = document.createElement("option");
        option2.innerHTML = "<h1>" + x + "</h1>";
        option2.value = x;
        visited_list_expanded_div.appendChild(option2);
        if (url.includes(x)) visited_list_expanded_div.selectedIndex = visited_list_expanded_div.length - 1;
    });

    nav_liv.forEach(x => {
        navigation.push(x);
        const option = document.createElement("option");
        option.innerHTML = "<h1>" + x.request_url + "</h1>";
        option.value = x.timestamp;
        visited_list_div.appendChild(option);
        if (url.includes(x.request_url)) visited_list_div.selectedIndex = visited_list_div.length - 1;
    });
}

function cleanNavigation() {
    navigation = [];
    navigation.textContent = "";
}

Promise.all(loading).then(async (modules) => {
    await initDb(modules);
    browser.tabs.query({ currentWindow: true, active: true })
        .then((tabs) => {
            let tab = tabs[0];
            browser.runtime.sendMessage({
                type: 'status',
                id: tab.id
            }).then((message) => {
                playPause.className = message.active ? "pause" : "play";
                if (message.extended) more.click();
            }, message_error);

            loaded_plugins.websites.visited_list().then((visited_list)=>{
                populateNavigation(visited_list, tab.url);

                updateThirds();
                updateDistrib();
                updateNewCookies();
            });
        }, message_error);
});
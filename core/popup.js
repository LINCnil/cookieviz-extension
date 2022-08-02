

const more = document.getElementById("more");
const hide = document.getElementById("hide");
const nav = document.getElementById("generalnav");
const footer = document.getElementById('footer');
const lessMore = document.getElementById('more');
const secondPart = document.getElementById('large_frame');
const maNavigation = document.getElementById('ma_navigation');
const mesDroits = document.getElementById('mes_droits');
const largeFrameContents = document.getElementById('largeFrameContents');
const generalContents = document.getElementById('generalContents');
const mesDroitsContents = document.getElementById('blocMesDroits');
const chronologieButton = document.getElementById('chronologieButton');
const chronologieContents = document.getElementById('chronologieContents');
const usageButton = document.getElementById('usageButton');
const usageContents = document.getElementById('usageContents');
const echangeButton = document.getElementById('echangeButton');
const echangeContents = document.getElementById('echangeContents');
const headerTitle = document.getElementById('headerTitle');
const secondNav = document.getElementById('nav_large');
const playPause = document.getElementById('play');
const clear_data = document.getElementById('clear_data');
const visited_list_div = document.getElementById('visited_list');
const visited_list_expanded_div = document.getElementById("visited_list_expanded");
const nb_thirds_div = document.getElementById('nb_thirds');
const nb_exists_div = document.getElementById('nb_exists');
const nb_news_div = document.getElementById('nb_news');
const podium_div = [document.getElementById('podium1'),
document.getElementById('podium2'),
document.getElementById('podium3')];
const zoomPlus = document.getElementById('zoomPlus');
const zoomMoins = document.getElementById('zoomMoins');
const hand = document.getElementById('hand');
const twitterButton = document.getElementById('twitterButton');
const twitterPodium = document.getElementById('twitterPodium');


const cookieviz = document.querySelector('#cookieviz');
const mesDroitsContentsLarge = document.getElementById('mesDroitsContentsLarge');
var graph_init = false;

const hideLegend = document.getElementById('lessBlue');
const legend = document.getElementById('legend');
const legendList = document.getElementById('legendList');
const largeFrameDroits = document.getElementById('largeFrameDroits');

const gear = document.getElementById('gear');

const information = document.getElementById('information');
const informationContents = document.getElementById('informationContents');
const xMark = document.getElementById('xMark');
const frame = document.getElementById('frame') ;
const xMarkinfo = document.getElementById('xMarkinfo');

function show_viz() {
  if (updateViz_timeout) {
    clearTimeout(updateViz_timeout);
  }

  if (getComputedStyle(hide).display != "none") {
    hide.style.display = "none";
    nav.style.gridColumnStart = "1";
    footer.style.width = "329px";
    footer.style.gridColumnStart = "1";
    document.body.style.width = "329px";
  } else {
    hide.style.display = "grid";
    nav.style.gridColumnStart = "1";
    //  footer.style.width = "800px";
    footer.style.gridColumnStart = "1";
    document.body.style.width = "800px";

    if (!graph_init) {
      load_graph([], [], cookieviz.getBoundingClientRect(), -200, 1);
      graph_init = true;
    }

    UpdateViz();
  }
}

// Réduire le deuxième niveau // 
more.addEventListener("click", () => show_viz());

// Navigation Générale // 
mesDroits.addEventListener("click", () => {
  if (getComputedStyle(largeFrameContents).display != "none") {
    largeFrameContents.style.display = "none";
    generalContents.style.display = 'none';
    mesDroitsContents.style.display = 'block';
    mesDroits.className = "active";
    maNavigation.className = "inactive";
    informationContents.style.display ='none';
  }


  largeFrameDroits.style.display = "block";
})

maNavigation.addEventListener("click", () => {
  if (getComputedStyle(largeFrameContents).display != "block") {
    largeFrameContents.style.display = "block";
    generalContents.style.display = "block";
    mesDroitsContents.style.display = "none";
    mesDroits.className = "inactive";
    maNavigation.className = "active";
    largeFrameDroits.style.display = "none";
    informationContents.style.display ='none';
  }
})

twitterButton.addEventListener("click", () => {
	const buildUrl = (base, params) => base + '?' + new URLSearchParams(params)
	
	
	const baseUrl = 'https://twitter.com/intent/tweet'
	const width = 550
	const height = 420
	let selected_index = visited_list_div.selectedIndex
	let visited_url = visited_list_div[selected_index].textContent ;
	browser.windows.create({
				url: buildUrl(baseUrl, {
					text: "CookieViz a détécté " + nb_thirds_div.innerHTML + " cookies sur la page " + visited_url,
					hashtags : "CookieDiet", 
				}),
				left: Math.round((screen.width - width) / 2),
				top: Math.round((screen.height - height) / 2),
				width,
				height,
				type: 'popup',
	})
})


twitterPodium.addEventListener("click", () => {
	const buildUrl = (base, params) => base + '?' + new URLSearchParams(params)
	
	
	const baseUrl = 'https://twitter.com/intent/tweet'
	const width = 550
	const height = 420
	let selected_index = visited_list_div.selectedIndex
	let visited_url = visited_list_div[selected_index].textContent ;
	browser.windows.create({
				url: buildUrl(baseUrl, {
					text: "Top 3 des sites où j'ai été le plus suivi : " +
					 "\n 1)" + podium_1.textContent +
					 "\n 2)" + podium_2.textContent +
					 "\n 3)" + podium_3.textContent +"\n",
					hashtags : "CookieDiet", 
				}),
				left: Math.round((screen.width - width) / 2),
				top: Math.round((screen.height - height) / 2),
				width,
				height,
				type: 'popup',
	})
})



// Navigation second part// 


/* echangeButton.addEventListener("click", () => {
  if (getComputedStyle(chronologieContents).display != "none") {
    chronologieContents.style.display = "none";
    largeFrameContents.style.display = "block";
    chronologieButton.className = "inactive";
    echangeButton.className = "active";
    usageButton.className = "inactive";
  }
  if (getComputedStyle(usageButton).className != "active") {
    usageButton.className = "inactive";
  }
})

chronologieButton.addEventListener("click", () => {
  if (getComputedStyle(largeFrameContents).display != "none") {
    largeFrameContents.style.display = "none";
    chronologieContents.style.display = "block";
    chronologieButton.className = "active";
    echangeButton.className = "inactive";
    usageButton.className = "inactive";
  }
})

usageButton.addEventListener("click", () => {
  if (getComputedStyle(chronologieContents).display != "none") {
    chronologieContents.style.display = "none";
    largeFrameContents.style.display = "block";
    chronologieButton.className = "inactive";
    usageButton.className = "active";
  }
  if (getComputedStyle(echangeButton).className != "active") {
    echangeButton.className = "inactive";
  }
}) */


// PLAY PAUSE // 
function message_error(error) {
  console.log(`Error: ${error}`);
}

function updateButtons() {
  browser.tabs.query({ currentWindow: true, active: true })
    .then((tabs) => {
      let tab = tabs[0];
      browser.runtime.sendMessage({
        type: 'status',
        id: tab.id
      }).then((message) => {
        playPause.className = message.active ? "pause" : "play";
      }, message_error);
    }, message_error);
}

playPause.addEventListener('click', function () {
  var gettingItem = browser.storage.local.get('analysis');
  gettingItem.then((res) => {
    let typeScan = res.analysis || 'by_tab';

    queryOption = typeScan== 'all_tab'?{}:{ currentWindow: true, active: true };

    browser.tabs.query(queryOption)
    .then((tabs) => {
      for (let tab of tabs) {
        browser.runtime.sendMessage({
          type: playPause.className,
          id: tab.id,
          url: tab.url,
          typeScan:typeScan
        }).then((message) => {
          updateButtons();
        }, message_error);
      }
    }, message_error);
  });
});

clear_data.addEventListener('click', function () {

  visited_list_div.textContent = "";
  visited_list_expanded_div.textContent = "";
  nb_thirds_div.innerHTML = "0";
  nb_exists_div.innerText = "0";
  nb_news_div.innerText = "";
  for (var i = 0; i < 3; i++) {
    podium_div[i].innerHTML = "";
  }
  clearGraph();
  browser.runtime.sendMessage({
    type: "clear"
  }).then((message) => {
  }, message_error);
});

lessMore.addEventListener('click', function () {
  if (lessMore.className == "more") {
    lessMore.className = "less";
    document.body.style.width = "800px";
    browser.runtime.sendMessage({
      type: 'extend'
    });
  } else {
    lessMore.className = "more";
    document.body.style.width = "329px";
    browser.runtime.sendMessage({
      type: 'reduce'
    });
  }
});

hideLegend.addEventListener('click', function () {
  if (hideLegend.className == "lessBlue") {
    hideLegend.className = "moreBlue";
    legend.style.borderBottom = "solid 2px";
    legend.style.borderTop = "none";
    legendList.style.display = "none";

  } else {
    hideLegend.className = "lessBlue";
    legend.style.borderBottom = "none";
    legend.style.borderTop = "solid 2px";
    legendList.style.display = "block";
  }
});

visited_list_expanded_div.addEventListener('click', function () {
  clearGraph();
});



information.addEventListener("click", () => {
  {
   generalContents.style.display = 'none';
   mesDroitsContents.style.display='none';
   informationContents.style.display = 'block'; 
 }

 
 

})

gear.addEventListener("click", () => {
  browser.runtime.openOptionsPage();
})

xMark.addEventListener('click', function () {
 
  { 
    informationContents.display='none';
   }

   if (maNavigation.className=='active'){
    generalContents.style.display='block';
    mesDroitsContents.style.display='none';
  
    }
  
   else {
    generalContents.style.display='none';
    mesDroitsContents.style.display='block';
  
   }

  } )

  xMarkinfo.addEventListener('click', function () {
 
    { informationContents.style.display='none';
     }
  
     if (maNavigation.className=='active'){
      generalContents.style.display='block';
      mesDroitsContents.style.display='none';
    
      }
    
     else {
      generalContents.style.display='none';
      mesDroitsContents.style.display='block';
    
     }
  
    } )


zoomPlus.addEventListener('click', function () {
  zoom_handler.scaleBy(svg.transition().duration(750), 2);
});

zoomMoins.addEventListener('click', function () {
  zoom_handler.scaleBy(svg.transition().duration(750), .5);
 });

 hand.addEventListener('click', function () {
   const large_frame = document.getElementById("large_frame");
   large_frame.style.cursor = large_frame.style.cursor == "grab"?  "default": "grab";
 });
      
function localizeHtmlPage()
{
    let i18ncode = browser.i18n.getUILanguage().substring(0, 2)
    var items = document.getElementsByClassName('translate');
    for (let item of items) {
      if (item.tagName == "IFRAME"){
        item.src = "_locales/"+i18ncode+"/"+item.getAttribute("translatesrc");
      }else{
        item.innerText = browser.i18n.getMessage(item.id);
      }
    }
}

localizeHtmlPage();
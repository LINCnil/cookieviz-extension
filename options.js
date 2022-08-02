

var typeScan = null;


function updateButtons(state){
  if (state == 'visit'){
    showVisitButton()
  }else{
    hideVisitButton()
  }
}

function saveOptions(e) {
  browser.storage.local.set({
    analysis: typeScan.value
  });
  e.preventDefault();
  updateButtons(typeScan.value);
}

function restoreOptions() {
  var gettingItem = browser.storage.local.get('analysis');
  gettingItem.then((res) => {
    typeScan.value = res.analysis || 'by_tab';
    updateButtons(typeScan.value);
  });
}

function localizeHtmlPage()
{
    var items = document.getElementsByClassName('translate');
    for (let item of items) {
      item.innerText = browser.i18n.getMessage(item.id);
    }
}

function showVisitButton(){
  const file_dialog_visit = document.createElement("INPUT");
  file_dialog_visit.id = "fileDialog_path";
  file_dialog_visit.type = "file";
  file_dialog_visit.accept = ".txt,text/plain"

  function message_error(error) {
    console.log(`Error: ${error}`);
  }

  function load_visit_txt(ffile) {
    var reader = new FileReader();
    reader.onload = function(progressEvent){
      var fileContentArray = this.result.split(/\r\n|\n/);
      browser.runtime.sendMessage({
        type: "visit",
        url:fileContentArray
      }).then((message) => {
        console.log(message)
      }, message_error);
    };
    reader.readAsText(ffile);
  }

  file_dialog_visit.addEventListener("change", function (evt) {
    load_visit_txt(this.files[0]);
    this.value = "";
  }, false);

  var browsing = document.getElementById("browsing");
  browsing.appendChild(file_dialog_visit);
}

function hideVisitButton(){
  var browsing = document.getElementById("browsing");
  while (browsing.firstChild) {
    browsing.removeChild(browsing.lastChild);
   }
}

document.addEventListener('DOMContentLoaded', function(){
  typeScan = document.getElementById("typeScan");
  restoreOptions();
  localizeHtmlPage();
  typeScan.addEventListener("change", saveOptions);
});



function test(){

}
//Plugins container
function initAnalysis(plugins_module, id, url){

    if(plugins_module.init){
        plugins_module.init(id, url);
    }
}

 function stopAnalysis(plugins_module, id) {
    if (plugins_module.delete) {
        plugins_module.delete(id);
    }
}

function statusAnalysis(plugins_module, id) {
    if (plugins_module.status) {
        return plugins_module.status(id);
    }
}


function clearPlugins(plugins_module) {
    if (plugins_module.tables) {
        cleanDB(plugins_module.tables);
    }
}
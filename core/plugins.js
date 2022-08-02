import { cleanDB } from "../core/database.js";

//Plugins container
export function initAnalysis(plugins_module, id, url){

    if(plugins_module.init){
        plugins_module.init(id, url);
    }
}

export function stopAnalysis(plugins_module, id) {
    if (plugins_module.delete) {
        plugins_module.delete(id);
    }
}

export function statusAnalysis(plugins_module, id) {
    if (plugins_module.status) {
        return plugins_module.status(id);
    }
}


export function clearPlugins(plugins_module) {
    cleanDB(plugins_module);
}
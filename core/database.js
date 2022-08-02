var databaseName = 'CookieViz2';
var versionNumber = '1';

var DBOpenRequest = null;
var db = null;
export function initDb(modules) {
    return new Promise((resolve, reject) => {
        DBOpenRequest = indexedDB.open(
            databaseName,
            versionNumber
        );

        //check if the Database failed to open
        DBOpenRequest.onerror = (event) => {
            console.error('Error loading database.');
            reject();
        };

        //check if the database openned successfully
        DBOpenRequest.onsuccess = (event) => {
            console.log('Your database is created');
            db = DBOpenRequest.result;
            resolve(db);
        };

        // create the tables object store and indexes
        DBOpenRequest.onupgradeneeded = (event) => {
            let local_db = event.target.result;
            modules.forEach(plugins => {
                let plugin = plugins();
                Object.keys(plugin.tables).forEach(table => {
                    let idb_table = local_db.createObjectStore(table, {
                        autoIncrement: true
                    });
                    Object.keys(plugin.tables[table]).forEach(key => {
                        const table_name = plugin.tables[table][key];
                        idb_table.createIndex(table_name, table_name, { unique: false })
                    }
                    )
                })
            })
            resolve(db);
        }
    });
}



// Handler that avoid WebSQL disk error
export async function WriteToDb(plugins, table, values, index) {
    if (!db) {
        db = await initDb(plugins);
    };
    const txn = db.transaction(table, 'readwrite');
    const objectStore = txn.objectStore(table);
    return objectStore.put(values, index);
}

export async function cleanDB(plugins) {
    if (!db) {
        db = await initDb(plugins);
    };
    for (const table in plugins.tables) {
        var txn = db.transaction([table], 'readwrite');
        txn.oncomplete = function (event) {

        };

        // en cas d'échec de l'ouverture de la transaction
        txn.onerror = function (event) {
            console.log('Error when clearing.');
        };
        var objectStore = txn.objectStore(table);
        objectStore.clear();
        objectStore.onsuccess = function (event) {
            console.log(table + "cleared !");
        };
    }

}

export async function getFromDB(plugins, table, index) {
    if (!db) {
        db = await initDb(plugins);
    };
    let txn = db.transaction([table], 'readonly');
    let objectStore = txn.objectStore(table);

    if (index)
        return objectStore.index(index);

    return objectStore;
}
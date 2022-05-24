class IDBFactor{
    constructor(name, keys) {
        const opendb = window.indexedDB.open(name);
        this.db = null;
        opendb.onsuccess = (e)=>{
            this.db = opendb.result;
        }
        opendb.onupgradeneeded = (e)=>{
            this.db = e.target.result;
            for (let key of keys){
                this.allocObjectStorage(key);
            }
        }
    }

    allocObjectStorage(key){
        if (!this.db.objectStoreNames.contains(key)){
            this.db.createObjectStore(key, {autoIncrement:true});
        }
    }

    writeObjectStorage(key, object){
        const transaction = this.db.transaction([key], 'readwrite');
        const write = transaction.objectStore(key).add(object);
    }

    clearObjectStorage(key){
        const transaction = this.db.transaction([key], 'readwrite');
        const erase = transaction.objectStore(key).clear();
    }

    grabObject(key){

    }
}
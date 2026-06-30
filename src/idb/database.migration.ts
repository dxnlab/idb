import { DatabaseOption, StoreOption } from "../types";

export default function (option?:DatabaseOption) {
  return option?.upgrade 
    // when explicit upgrade migration presented
    ? ({target})=>option.upgrade(target.result) 
    // set default migrations
    : (ev:IDBVersionChangeEvent) => {
      const db = ev.target.result ?? undefined;
      // stores to be
      const storesTobe = Array.from(Object.keys(option?.stores || {}));
      // concurrent stores
      const storeNames = Array.from(db.objectStoreNames);
      // create stores not exists
      storesTobe.filter((store)=>!storeNames.includes(store))
        .forEach((store)=>createStore(db, store, option?.stores?.[store]));
      // delete stores if not presented
      storeNames.filter((store)=>!storesTobe.includes(store))
        .forEach((store)=>deleteStore(db, store));
    };
}


// - [x] IDBDatabase.createObjectStore
export function createStore(db:IDBDatabase, storeName:string, option?:StoreOption) {
  // wrap store option
  return Object.entries(option?.index ?? {}).reduce((store, [index, iopt])=>{
    const keyPath = iopt?.key ?? iopt;
    const indexOptions = {
      unique: iopt?.unique,
      multiEntry: iopt?.multi,
    }
    store.createIndex(index, keyPath, indexOptions);
    return store;
  }, db.createObjectStore(storeName, {
    keyPath: option.key ?? option,
    autoIncrement: option?.autoIncrement
  }));
}

// - [x] IDBDatabase.deleteObjectStore
export function deleteStore(db:IDBDatabase, storeName:string) {
  return db.deleteObjectStore(storeName);
}
import { DatabaseOption, StoreOption } from "../types";
import { promiseRequest } from "./common";

export function onUpgrade (option?:DatabaseOption) {
  return option?.upgrade 
    // when explicit upgrade migration presented
    ? (ev:IDBVersionChangeEvent)=>option.upgrade!(ev.target.result ?? null) 
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

export function onBlocked (option?:DatabaseOption) {
  return option?.blocked
    // when explicit blocked handler presented
    ? (ev:Event)=>option.blocked!(ev.target.result)
    : null;
}


// - [x] IDBDatabase.createObjectStore
export function mayString(target:any):boolean {
  return ((typeof target ==='string')  || (target instanceof String));
}
export function mayStrings(target:any):boolean {
  return mayString(target)
    || (Array.isArray(target) && target.reduce((g,t)=>g && mayString(t), true))
};
const reduceKeyPathes = (...candidates:any[])=>candidates.reduce((keys, pathes)=>{
  return (keys==undefined && mayStrings(pathes)) ? pathes : keys;
}, undefined);

function createStore(db:IDBDatabase, storeName:string, option?:StoreOption) {
  // wrap store option
  return Object.entries(option?.index ?? {}).reduce((store, [index, iopt])=>{
    const keyPath = reduceKeyPathes(iopt?.key, iopt, index);
    // test if iopt itself is string or string[]

    const indexOptions = {
      unique: iopt?.unique,
      multiEntry: iopt?.multi,
    }
    store.createIndex(index, keyPath, indexOptions);
    return store;
  }, db.createObjectStore(storeName, {
    keyPath: reduceKeyPathes(option.key, option),
    autoIncrement: option?.autoIncrement
  }));
}

async function deleteStore(db:IDBDatabase, storeName:string) {
  return await promiseRequest(db.deleteObjectStore(storeName));
}
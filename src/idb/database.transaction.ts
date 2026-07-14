/**
 * proxy wrapping IDBTransaction
 *  - set it to be promise (abort on error, reject on abort; resolve at complete)
 *  - direct StoreProxy getters by store name
 *  - reserve any other names
 */

import StoreProxy from "./store";
import type { May } from '../types';

async function wrapProxy(builder:()=>May<IDBTransaction>) {
  const tx = await builder();
  const storeNames = Array.from(tx.objectStoreNames);
  const storeSingulars:{[store:string]:StoreProxy} = {};

  storeNames.map((name:string)=>{
    Object.defineProperty(tx, name, { get() {
      if(!storeSingulars?.[name]) {
        storeSingulars[name] = new StoreProxy(tx, name);
      }
      return storeSingulars[name];
    }})
  });
  return tx;
}


export default function (builder:()=>May<IDBTransaction>):(runner:Function, args?:any[], binded?:any)=>Promise<any> {
  // wrap proxy
  return (runner:Function, args:any[]=[], binded?:any) => new Promise(async (resolve, reject) => {
    const tx = await wrapProxy(builder);
    let result:any;
    let error:any;
    tx.onabort = reject;
    tx.onerror = (ev)=>{
      error = error || ev;
      tx.abort();
    };
    tx.oncomplete = ()=>{
      resolve(result);
    }
    

    try {
      result = await runner.apply(binded, [tx, ...args]);
      // invoke on complete
      if(tx.mode != 'readonly') {
        tx.commit();
      }
      resolve(result);
    } catch(err) {
      console.error(err);
      error = err;
      tx.abort();
    }
  });
}
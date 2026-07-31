/**
 * proxy wrapping IDBTransaction
 *  - set it to be promise (abort on error, reject on abort; resolve at complete)
 *  - direct StoreProxy getters by store name
 *  - reserve any other names
 */

import StoreProxy from "./store";
import type { May } from '../types';

async function wrapProxy(builder:Function) {
  try {
    const tx = await builder.apply(undefined, []);
    const storeNames = Array.from(tx.objectStoreNames);
    const storeSingulars:{[store:string]:StoreProxy}= {};
    
    storeNames.map((name:any)=>{
      Object.defineProperty(tx, name, { get() {
        if(!storeSingulars?.[name]) {
          storeSingulars[name] = new StoreProxy(tx, name);
        }
        return storeSingulars[name];
      }})
    });
    return tx;
  } catch (ex) {
    console.error(ex);
  }
}


export default function (builder:()=>May<IDBTransaction>):(runner:Function, args?:any[], binded?:any)=>Promise<any> {
  // wrap proxy
  return (runner:Function, args:any[]=[], binded?:any) => new Promise(async (resolve, reject) => {
    const tx = await wrapProxy(builder);
    let result:any;
    let error:any;
    tx.onabort = reject;
    tx.onerror = (ev:Event)=>{
      error = error || ev;
      console.error('tx err', ev);
      reject(error);
    };
    tx.oncomplete = (ev:Event)=>{ resolve(result); }

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
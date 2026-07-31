import { DatabaseOption } from "./types";

import {
  connect,
  drop,
} from './idb';


const databaseKey = 'idb';

const assert = (condition:any, message:string) => {
  if(!condition) {
    throw new Error(`AssertionFail: ${message}`);
  }
}

export function idb(database:string, option?:DatabaseOption) {
  return (cls:any, context?:DecoratorContext) => {
    //
    assert(context?.kind === 'class', `class decorator`);

    let cnx:any;
    let singluar:any;
    const connector = ()=>{
      if(!cnx) {
        singluar = new cls;
        cnx = connect(database, option);
      }
      return cnx;
    }
    const disconnector = async ()=>{
      if(cnx) {
        await cnx.disconnect();
        // clear
        cnx = null;
        singluar = undefined;
        return true;
      }
      return false;
    }

    return Object.defineProperties(cls, {
      // static factory methods
      [databaseKey]:{ get: connector },
      get: { 
        async value(){
          if(!cnx) {
            await connector();
          }
          return singluar; 
        }
      },
      disconnect: { value: disconnector },
      drop: { 
        async value() {
          await disconnector();
          return await drop(database);
        }
      },
    });
  }
}

const trxAvailableKinds = ['method','getter','setter','accessor'];
export function trx(stores:string[], mode?:IDBTransactionMode, option?:IDBTransactionOptions) {
  return function(runner:Function, context:DecoratorContext) {
    return async function(this:any, ...args:any[]) {
      assert(trxAvailableKinds.find((k)=>k == context.kind) != null, 
        `transaction decorator must be in ${trxAvailableKinds.join(', ')}`);

      const cls = this.constructor;
      const wrap = (await cls[databaseKey]).txWrapper(stores, mode, option);
      return await wrap(runner, args, cls);
    }
  }
}

function wrapTrxWithMode(mode:IDBTransactionMode, trx:Function) {
  return (...args:Array<string|IDBTransactionOptions>) => {
    const stores = args.filter((v)=>typeof v === 'string');
    const option = args.find((v)=>typeof v !== 'string') || undefined;
    return trx(stores, mode, option);
  }
}

function handlerOf(event:string) {
  return function(handler:Function, _:DecoratorContext) {
    return async function(this:any) {
      const cls = this.constructor;
      const cnx = await cls[databaseKey];
      // add event handler
      cnx[event](handler);
    }
  }
}

export const reads = wrapTrxWithMode('readonly', trx);
export const writes = wrapTrxWithMode('readwrite', trx);
export const onClose = handlerOf('onClose');
export const onAbort = handlerOf('onAbort');
export const onError = handlerOf('onError');
export * from './idb';
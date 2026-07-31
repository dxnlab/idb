import { DatabaseOption } from "./types";

import {
  withTransaction,
} from './wraps';
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
    const connector = ()=>{
      if(!cnx) {
        cnx = connect(database, option);
      }
      return cnx;
    }
    const disconnector = async ()=>{
      if(cnx) {
        await cnx.disconnect();
        cnx = null;
        return true;
      }
      return false;
    }

    return Object.defineProperties(cls, {
      // static factory methods
      [databaseKey]:{ get: connector },
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
      const txBuilder = ()=>cls[databaseKey].transaction(stores, mode, option);
      const runnerWrap = withTransaction(this, txBuilder, runner);
      return await runnerWrap(...args);
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

export default {
  reads: wrapTrxWithMode('readonly', trx),
  writes: wrapTrxWithMode('readwrite', trx),
  onError: handlerOf('onError'),
  onClose: handlerOf('onClose'),
  onAbort: handlerOf('onAbort'),
};

export * from './idb';
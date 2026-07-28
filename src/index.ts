import { DatabaseOption } from "./types";

import {
  getConnector,
  getDisconnector,
  withTransaction,
} from './wraps';
import {
  cmp,
  showDatabases,
  transaction,
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

    // mixin static
    const singleDBKey = `_${databaseKey}$`+(Date.now()+Math.random()).toString(36);
    const connector = getConnector(cls, singleDBKey);
    const disconnector = getDisconnector(cls, singleDBKey);
    return Object.defineProperties(cls, {
      showDatabases: { value: showDatabases },
      cmp: { value: cmp },
      connect: { value: async ()=>await connector(database, option) },
      disconnect: { value: disconnector },
      transaction: { 
        value(
          stores:string[],
          mode:IDBTransactionMode='readonly',
          option?:IDBTransactionOptions
        ) { return transaction(cls[singleDBKey], { stores, mode, option }); }
      },
      drop: {
        async value(){ 
          await this.disconnect();
          await drop(database);
        } 
      },
      [databaseKey]: {
        get() { return cls.connect(); },
        set(_) { cls.disconnect(); },
        enumerable: true,
      }
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
      const txBuilder = ()=>cls.transaction(stores, mode, option);
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

export const reads = wrapTrxWithMode('readonly', trx);
export const writes = wrapTrxWithMode('readwrite', trx);

export * from './idb';
import StoreProxy from "./idb/store";

type KeyPathPrimary = string | string[];

export type May<R> = R | Promise<R>

export type IndexOption = KeyPathPrimary | {
  // keyPath
  key: KeyPathPrimary;
  // multiEntity
  multi?: boolean;
  // unique
  unique?: boolean;
}

export type StoreOption = KeyPathPrimary | {
  // keyPath
  key: KeyPathPrimary;
  // autoIncrement
  autoIncrement?: boolean;
  // index mapping
  index?: {
    [indexName:string]: IndexOption
  }
}

export type DatabaseOption = {
  version?: number;
  stores?: {
    [storeName:string]: StoreOption;
  }
  upgrade?:(db:IDBDatabase, request?:IDBOpenDBRequest, ev?:IDBOpenDBRequest)=>any,
  blocked?:(db:IDBDatabase, request?:IDBOpenDBRequest, ev?:IDBOpenDBRequest)=>any,
}

export type IDBDatabaseProxy = IDBDatabase & {
  stores:Function,
  disconnect:Function,
  txWrapper:Function,
  onError:Function,
  onAbort:Function,
  onClose:Function,
};

export type Trx = IDBTransaction & {
  [store:string]:StoreProxy
};
export type IDBTransactionRunner = (tx:Trx, ...args:any[])=>Promise<any>; 
export type IDBTransactionWrap = (runner:IDBTransactionRunner) => any;
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
  upgrade?:(db:IDBDatabase, request:IDBOpenDBRequest, ev:IDBOpenDBRequest)=>any,
  blocked?:(db:IDBDatabase, request:IDBOpenDBRequest, ev:IDBOpenDBRequest)=>any,
}
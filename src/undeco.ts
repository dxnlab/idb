/**
 * To polyfill when typescript decorator stage3 not provided
 */
import {
  factory,
  cmp,
  showDatabases,
  connect,
  drop,
} from './idb';
import wrapTransaction from './idb/database.transaction';

import { DatabaseOption, IDBDatabaseProxy, IDBTransactionWrap } from './types';

/**
 * Direct exports
 */
export {
  prepare,
  generatorOf,
} from './idb';

type IDBConnectionPoolSingleInstance = {
  factory:IDBFactory,
  cmp:(first:any, second:any)=>number,
  showDatabases:()=>Promise<IDBDatabaseInfo[]>,
  pool:Map<string,IDBDatabaseProxy>
}

/**
 * connection pool of databases
 */
const connectionPool = Object.defineProperties({}, {
  factory: { value: factory },
  cmp: { value: cmp },
  showDatabases: { value:showDatabases },
  pool:{ value: new Map<string,IDBDatabaseProxy>() },
}) as IDBConnectionPoolSingleInstance;

function wrapIDBTransaction(db:IDBDatabase, mode?:IDBTransactionMode) {
  const wraps = async (stores:string[], mode:IDBTransactionMode, runner:Function, option:IDBTransactionOptions) => {
    const wrap = wrapTransaction(()=>db.transaction(stores, mode, option));
    return await wrap(runner, [], null);
  }
  return mode !== undefined 
    ? async (stores:string[], runner:Function, option:IDBTransactionOptions)=>await wraps(stores, mode, runner, option)
    : wraps;
}

function wrapIDBProperties(db:IDBDatabase) {
  return Object.defineProperties(db, {
    drop: { async value() { return await drop(db.name); } },
    // transaction wrappers
    trx: { value: wrapIDBTransaction(db) },
    reads: { value: wrapIDBTransaction(db, 'readonly') },
    writes: { value: wrapIDBTransaction(db, 'readwrite') },
  });
}

export async function open(database:string, options?:DatabaseOption) {
  if(!connectionPool.pool.has(database)) {
    const cnx = await connect(database, options);
    // wrap additional undeco properties
    wrapIDBProperties(cnx);
    // append the pool
    connectionPool.pool.set(database, cnx);
  }
  return connectionPool.pool.get(database);
}

export async function close(database:string) {
  if(connectionPool.pool.has(database)) {
    const cnx = connectionPool.pool.get(database);
    // disconnect
    cnx?.disconnect();
    // remove from the pool
    connectionPool.pool.delete(database);
  }
}

export {
  factory,
  showDatabases,
  cmp,
  drop
} from './idb';

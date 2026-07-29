/**
 * To polyfill when typescript decorator stage3 not provided
 */
import iDB from './idb';
import wrapTransaction from './idb/database.transaction';

import { DatabaseOption } from './types';
import { getDisconnector } from './wraps';

/**
 * Direct exports
 */
export {
  prepare,
  generatorOf,
} from './idb';


/**
 * connection pool of databases
 */
const connectionPool = {};
// update IDBDatabase types to run transaction
Object.defineProperties(connectionPool, {
  factory: { get: ()=>iDB.factory },
  cmp: { value: iDB.cmp },
  showDatabases: { value: iDB.showDatabases },
});

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
  const disconnect = getDisconnector(connectionPool, db.name);
  Object.defineProperties(db, {
    // disconnect
    disconnect: { value: disconnect },
    // drop
    drop: { 
      value: async ()=>{ 
        await disconnect();
        await drop(db.name);
      }
    },
    // transaction wrappers
    trx: { value: wrapIDBTransaction(db) },
    reads: { value: wrapIDBTransaction(db, 'readonly') },
    writes: { value: wrapIDBTransaction(db, 'readwrite') },
  });
  return db;
}

export async function open(database:string, options?:DatabaseOption) {
  if(!Object.hasOwn(connectionPool, database)) {
    const db = iDB.open(database, options);
    // wrap properties
    wrapIDBProperties(db);
    // append the pool
    connectionPool[database] = db;
  }
  return connectionPool[database];
}

export async function close(database:string) {
  return await connectionPool?.[database]?.disconnect();
}

export const factory = iDB.factory;
export const showDatabases = iDB.showDatabases;
export const cmp = iDB.cmp;
export const drop = iDB.drop;
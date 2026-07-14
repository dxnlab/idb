import { promisedRequest } from "./common";
import { DatabaseOption, May } from "../types";
import wrapTransaction from './database.transaction';
import idbMigration from './database.migration';

export const factory = globalThis.indexedDB;
/** --- IDBFactory ---
 *
 */


// - [x] IDBFactory.databases()
export async function showDatabases():Promise<IDBDatabaseInfo[]> {
  return await factory.databases();
}

// - [ ] IDBFactory.cmp()
export function cmp(first:any, second:any):number {
  return factory.cmp(first, second);
}

function _buildHandlers(option?:DatabaseOption):{[event:string]:Function|null} {
  return option? {
    onUpgradeNeeded: idbMigration(option),
    onBlocked: option?.blocked ? (ev)=>option.blocked(ev.target.result) : null,
  } : {};
}

// - [x] IDBFactory.open
export const connect:(database:string, option?:DatabaseOption)=>Promise<IDBDatabase> 
= promisedRequest(
    // builder
    (database:string, option?:DatabaseOption)=>factory.open(database, option?.version),
    // handles
    (_:string, option?:DatabaseOption)=>_buildHandlers(option)
  );

// - [x] IDBFactory.deleteDatabase
export const drop:(database:string)=>Promise<any> = promisedRequest(
  (database:string)=>factory.deleteDatabase(database)
);

// - [x] IDBDatabase.close
export async function disconnect(db:IDBDatabase) {
  return new Promise((resolve, reject) => {
    let _closed = false;
    const closure = ()=>{
      if(!_closed) {
        _closed = true;
        resolve(true);
      }
    };
    try {
      db.addEventListener('close', closure);
      db.close();
      // timeout to close
      setTimeout(closure, 1e2);
    } catch(ex) {
      console.error(ex);
      reject(ex);
    }
  });
}

// - [x] IDBDatabase.transaction (wrapper)
export function transaction(db:May<IDBDatabase>, {stores, mode, option}:{
  stores:string[], 
  mode?:IDBTransactionMode,
  option?:IDBTransactionOptions
}) : (runner:Function, args?:any[], binded?:any)=>Promise<any> {
  return wrapTransaction(async ()=>{
    const cnx = await db;
    return cnx.transaction(stores, mode, option);
  });
}

/** --- IDBDatabase:migrations ---
 * 
 */



export default  {
  factory,
  showDatabases,
  cmp,
  connect,
  drop,
  disconnect,
  transaction,
};
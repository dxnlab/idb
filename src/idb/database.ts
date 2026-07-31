import { promisedRequest, promiseRequest } from "./common";
import type { DatabaseOption, IDBDatabaseProxy } from "../types";
import wrapTransaction from './database.transaction';
import { onUpgrade, onBlocked } from './database.migration';

/*** --- IDBFactory --- ***/

/**
 * retrieve IDBFactory instance of global
 * @use DatabaseProxy.factory
 */
export const factory = globalThis.indexedDB;
export function cmp(first:any, second:any) { return factory.cmp(first, second) }
export function open(database:string, version?:number) { return factory.open(database, version) }
export async function databases() { return await factory.databases() }
export async function deleteDatabase(database:string) { return await promiseRequest(factory.deleteDatabase(database)) }
/**
 * IDBFactory.databases method alias
 * @use const dbNames = Array.from(await DatabaseProxy.showDatabases()).map(({name,version})=>name);
 * @refer https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/databases
 */
export async function showDatabases():Promise<IDBDatabaseInfo[]> {
  return Array.from(await factory.databases());
}

/**
 * IDBFactory.deleteDatabase alias
 * @refer https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/deleteDatabase
 */
export async function drop(database:string) {
  try {
    await promiseRequest(factory.deleteDatabase(database));
    return true;
  } catch(ex) {
    console.error(ex);
    return false;
  }
}

function connectHandlerBuilders(_:string, option?:DatabaseOption) {
  return {
    onUpgradeNeeded: onUpgrade(option),
    onBlocked: onBlocked(option),
  };
}

export function connector():(database:string, option?:DatabaseOption)=>Promise<IDBDatabase> {
  return promisedRequest<IDBDatabase>(
    (database:string, option?:DatabaseOption)=>factory.open(database, option?.version), 
    connectHandlerBuilders,
  );
}

/*** --- IDBDatabase --- ***/


function injectDefaultLogger(cnx:IDBDatabase, logger=console) {
  Object.entries({
    close(ev:Event){ logger.debug(`[IDB] ${cnx.name} closed`, ev) },
    abort(ev:Event){ logger.warn(`[IDB] ${cnx.name} abort:`, ev) },
    error(ev:Event){ logger.error(`[IDB] ${cnx.name} ERROR!`, ev) },
  }).forEach(([event, listener])=>cnx.addEventListener(event, listener));
}

function decorateDatabaseProxy(cnx:IDBDatabase) : IDBDatabaseProxy {
  const appendHandler = (event:string)=>({
    value: (handler:(ev:Event)=>any)=>{
      cnx.addEventListener(event, handler);
  }});
  return Object.defineProperties(cnx, {
    stores: { 
      get: ():Array<string>=>Array.from(cnx.objectStoreNames)
    },
    // close
    disconnect: {
      value() { return cnx.close(); }
    },
    // wrapTransaction
    txWrapper: {
      value(
        stores:string|Iterable<string>,
        mode:IDBTransactionMode='readonly',
        option?:IDBTransactionOptions
      ){ 
        const builder = ()=>cnx.transaction(stores, mode, option);
        return wrapTransaction(builder);
      }
    },
    // on close handler
    onClose: appendHandler('close'),
    // on error handler
    onError: appendHandler('error'),
    // on abort handler
    onAbort: appendHandler('abort'),
  }) as IDBDatabaseProxy;
}

/**
 * 
 * @param database 
 * @param option 
 * @param connect 
 * @returns 
 */
export async function connect(database:string, option?:DatabaseOption) {
  const tryConnect = connector();
  const connection = await tryConnect(database, option);

  // add default connection event handlers
  injectDefaultLogger(connection);

  // appending database proxy
  return decorateDatabaseProxy(connection);
}

export async function close(connection:IDBDatabase) {
  return await promiseRequest(connection.close());
}

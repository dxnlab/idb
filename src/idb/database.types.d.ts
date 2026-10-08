import { DatabaseOption, May, StoreOption } from "../types";

/**
 * database.ts type declaration
 */
declare const factory:IDBFactory;
declare function cmp(first:any, second:any):number;
declare function open(database:string, version?:number):IDBOpenDBRequest;
declare function databases():Promise<IDBDatabaseInfo[]>;
declare function deleteDatabase(database:string):Promise<void>;
declare function showDatabases():Promise<IDBDatabaseInfo[]>;
declare function drop(database:string):Promise<boolean>;
declare function connector(): (database:string, option?:DatabaseOption) => Promise<IDBDatabase>;
declare function connect(database:string, option?:DatabaseOption):Promise<IDBDatabase>;

/**
 * database.migration.ts type declaration
 */
declare function onUpgrade(option?:DatabaseOption): (event:IDBVersionChangeEvent)=>void;
declare function onBlocked(option?:DatabaseOption): (event:IDBVersionChangeEvent)=>void;
declare function mayString(target:any): boolean;
declare function mayStrings(target:any): boolean;
declare function createStore(db:IDBDatabase, storeName:string, option?:StoreOption): IDBObjectStore;

/**
 * database.transaction.ts type declaration
 */
declare function wrapTransaction<T>(db:IDBDatabase, storeNames:string|string[], mode?:IDBTransactionMode, callback?:(tx:IDBTransaction)=>Promise<T>):Promise<T>;
declare function transaction(builder:()=>May<IDBTransaction>): (runner:Function, args?:any[], binded?:any)=>Promise<any>;
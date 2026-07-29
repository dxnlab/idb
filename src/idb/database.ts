import { promisedRequest, promiseRequest } from "./common";
import { DatabaseOption } from "../types";
import wrapTransaction from './database.transaction';
import idbMigration from './database.migration';

/** --- IDBFactory ---
 *
 */
export default class DatabaseProxy {
  // list of database names - factory level
  protected static _databases:{[dbname:string]:DatabaseProxy} = {};
  protected static _databaseInfo?:IDBDatabaseInfo[];
  protected _connection?:Promise<IDBDatabase>;
  protected _stores?:string[];

  /**
   * retrieve IDBFactory instance of global
   * @use DatabaseProxy.factory
   */
  static get factory() { 
    return globalThis.indexedDB 
  }
  /**
   * IDBFactory.cmp method
   * @use DatabaseProxy.cmp(value1, value2);
   * @refer https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/cmp
   */
  static cmp(first:any, second:any):number { 
    return this.factory.cmp(first, second);
  }
  /**
   * IDBFactory.databases method alias
   * @use const dbNames = Array.from(await DatabaseProxy.showDatabases()).map(({name,version})=>name);
   * @refer https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/databases
   */
  static async showDatabases(refresh:boolean=false):Promise<IDBDatabaseInfo[]> {
    if(!this._databaseInfo || refresh) {
      const dbInfo = await this.factory.databases();
      this._databaseInfo = Array.from(dbInfo);
    }
    return this._databaseInfo;
  }

  /**
   * Boolean flag whether the named database has opened instance
   * @param database 
   * @returns true = has Open | false = none
   */
  static hasOpen(database:string) {
    return Object.hasOwn(this._databases, database) != undefined;
  }

  /**
   * IDBFactory.deleteDatabase alias
   * @refer https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/deleteDatabase
   */
  static drop(database:string) {
    // caution: deleteDatabase rarely resolved in wdio
    promiseRequest(()=>this.factory.deleteDatabase(database))
      .then(()=>{
        delete this._databases[database];
        this._databaseInfo = undefined;
      })
      .finally(()=>{
        console.log('dropped', database, this._databaseInfo);
      });
    return true;
  }

  /**
   * 
   * @param database 
   * @param option 
   * @param connect 
   * @returns 
   */
  static open(database:string, option?:DatabaseOption, connect:boolean=false) {
    if(!Object.hasOwn(this._databases, database)) {
      const db = new DatabaseProxy(database, option, connect);
      this._databases[database] = db;
    }
    return this._databases[database];
  }
  
  private constructor(
    protected readonly database:string, 
    protected readonly option?:DatabaseOption,
    connect:boolean=false
  ) { 
    if(connect) {
      // run async connection at construction
      this.connect();
    }
  }

  public get hasTryConnected() {
    return this._connection != undefined;
  }

  public async connect():Promise<IDBDatabase> {
    if(!this.hasTryConnected) {
      const connector = promisedRequest<IDBDatabase>(
        (name:string, option?:DatabaseOption)=>DatabaseProxy.factory.open(name, option?.version),
        (_:string, option?:DatabaseOption)=>(option
          ? {
            onUpgradeNeeded: idbMigration(option),
            // @ts-ignore
            onBlocked: option?.blocked ? ({target})=>option.blocked(target.result) : null,
          } 
          : {}) as {[event:string]:Function|null}
      );
      this._connection = connector(this.database, this.option);
      // reset connection on error
      this._connection.catch(()=>{ this._connection = undefined });
    }
    return await this._connection!;
  }

  public async connected():Promise<boolean> {
    if(this.hasTryConnected) {
      const cnx = await this._connection;
      return cnx != undefined;
    } else {
      return false;
    }
  }

  public get connection():Promise<IDBDatabase> {
    return this.connect();
  }

  public get close(){ return this.disconnect }
  public async disconnect():Promise<boolean> {
    if(this.hasTryConnected) {
      const idb = await this.connection;
      idb.close();
      this._connection = undefined;
      return true;
    } else {
      return false;
    }
  }

  public transaction(stores:string[], mode:IDBTransactionMode='readonly', option?:IDBTransactionOptions)
    :(runner:Function, args?:any[], binded?:any)=>Promise<any> {
    return wrapTransaction(
      async() => (await this.connection).transaction(stores, mode, option),
    );
  }
}


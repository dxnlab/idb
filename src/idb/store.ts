import IndexProxy from "./dataindex";
import { Queriable } from "./common";

/** IDBObjectStore wrapper  */
export default class StoreProxy extends Queriable<IDBObjectStore> {
  protected _tx:IDBTransaction;
  protected _index:{[name:string]:IndexProxy};

  constructor(tx:IDBTransaction, name:string) {
    super(tx.objectStore(name));
    this._tx = tx;
    this._index = {};
    // getter
    this.indexNames.forEach((index)=>{
      Object.defineProperty(this, index, {get:()=>this.index(index)})
    });
  }

  public get store():IDBObjectStore { 
    return this.basis as IDBObjectStore; 
  }

  // props @inherited
  // - IDBObjectStore.keyPath
  // - IDBObjectStore.name

  // read props
  public get indexNames():string[] { return Array.from(this.store.indexNames); }
  public get transaction() { return this.store.transaction; }
  public get autoIncrement() { return this.store.autoIncrement; }

  // methods @inherited
  // - IDBObjectStore.count
  // - IDBObjectStore.get
  // - IDBObjectStore.getKey
  // - IDBObjectStore.getAll
  // - IDBObjectStore.getAllKeys
  // - IDBObjectStore.getAllRecords
  // - IDBObjectStore.openCursor
  // - IDBObjectStore.openKeyCursor

  // IDBObjectStore.add
  public async add(value:any, key?:IDBValidKey) { 
    return this.binds('add', value, key);
  }

  // IDBObjectStore.clear
  public async clear() {
    return this.binds('clear');
  }

  // IDBObjectStore.delete
  public async delete(key:IDBValidKey|IDBKeyRange) {
    return this.binds('delete', key);
  }
  
  // IDBObjectStore.put
  public async put(item:any, key?:IDBValidKey) {
    return this.binds('put', item, key);
  }

  // generators @inherited
  // - openGenerator
  // - valueGenerator
  // - keyGenerator

  // @ProxiedIndex
  // IDBObjectStore.index
  public index(name:string):IndexProxy {
    if(this._index[name] == undefined) {
      this._index[name] = new IndexProxy(this.store, name);
    }
    return this._index[name];
  }

  /**
   * retrieve cursor from query statement
   * 

   *  
   *  
   *  
   * @param stmt 
   * @param index 
   */
  public async *query(stmt:string, index?:string):AsyncGenerator {

  }

}
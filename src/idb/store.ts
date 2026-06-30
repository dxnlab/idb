import IndexProxy from "./dataindex";
import { Queriable } from "./common";

/** IDBObjectStore wrapper  */
export default class StoreProxy extends Queriable<IDBObjectStore> {
  protected _tx:IDBTransaction;

  constructor(tx:IDBTransaction, name:string) {
    super(tx.objectStore(name));
    this._tx = tx;
  }

  public get store():IDBObjectStore { 
    return this.basis as IDBObjectStore; 
  }

  // props @inherited
  // - IDBObjectStore.keyPath
  // - IDBObjectStore.name

  // read props
  public get indexNames() { return this.store.indexNames; }
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
    return new IndexProxy(this.store, name);
  }

}
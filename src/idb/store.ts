import IndexProxy from "./dataindex";
import { Queriable } from "./common";

/** 
 * IDBObjectStore wrapper  
 * 
 **/
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

  /**
   * raw store getter
   * @type IDBObjectStore
   */
  public get store():IDBObjectStore { 
    return this.basis as IDBObjectStore; 
  }

  // props @inherited
  // - IDBObjectStore.keyPath
  // - IDBObjectStore.name

  // read props
  /**
   * index names of the ObjectStore
   * @type string[]
   */
  public get indexNames():string[] { return Array.from(this.store.indexNames); }

  /**
   * Transaction instance that the object store belongs
   * @type IDBTransaction
   * @refer https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/transaction
   */
  public get transaction() { return this.store.transaction; }

  /**
   * If the ObjectStore had set autoIncrement
   * @type boolean
   */
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

  /**
   * Sequencial get values by the keys
   * 
   * @param keys primary key for (each) values.
   * @returns any[] retrieved values
   */
  public async gets(generator:Generator<IDBValidKey>) {
    return this.bindGenerator('get', generator);
  }

  /**
   * Add a value to the ObjectStore, with the primary key
   * 
   * @param value target value to add
   * @param key (optional) primary key for the value. When not set, use value property instead.
   * @returns the value which had set into the ObjectStore.
   * @throws DOMException 
   *  ReadOnlyError | TransactionInactiveError | DataError | InvalidStateError | DataCloneError
   * @refer https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/add
   */
  public async add(value:any, key?:IDBValidKey) { 
    return this.binds('add', value, key);
  }

  /**
   * Sequential adding values to the ObjectStore.
   * 
   * @param values target values to add. MUST specify adquate primary key properties in it.
   * @returns any[] values.
   * @throws DOMExeption
   *  ReadOnlyError | TransactionInactiveError | DataError | InvalidStateError | DataCloneError
   *  When a Exception placed, it break away from the iteration. SHOULD rollback & retry.
   */
  public async adds(generator:Generator) {
    return this.bindGenerator('add', generator);
  }

  /**
   * clear the ObjectStore contents.
   * 
   * @returns undefined
   * @throws DOMException
   *  InvalidStateError | ReadOnlyError | TransactionInactiveError
   * @refer https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/clear
   */
  public async clear() {
    return this.binds('clear');
  }

  /**
   * Delete value(s) by the key/keyRange.
   * 
   * @param key the primary key or key range that of target values to delete.
   * @returns undefined
   * @throws DOMException
   *  TransactionInactiveError | ReadOnlyError | InvalidStateError | DataError
   * @refer https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/delete
   */
  public async delete(key:IDBValidKey|IDBKeyRange) {
    return this.binds('delete', key);
  }

  /**
   * Sequencial deletes to the keys.
   * @param keys 
   * @returns undefined
   * @throws DOMException
   *  TransactionInactiveError | ReadOnlyError | InvalidStateError | DataError
   */
  public async deletes(generator:Generator<IDBValidKey>) {
    await this.bindGenerator('delete', generator);
  }
  
  /**
   * Update OR Add item to the store
   * 
   * @param item the target value to update
   * @param key primary key for the value
   * @returns updated record
   * @throws DOMException
   *  TransactionInactiveError | ReadOnlyError | InvalidStateError | DataError | DataCloneError
   * @refer https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/put
   */
  public async put(item:any, key?:IDBValidKey) {
    return this.binds('put', item, key);
  }

  /**
   * Sequencial put items
   * 
   * @param item the target value to update
   * @param key primary key for the value
   * @returns any[] updated records
   * @throws DOMException
   *  TransactionInactiveError | ReadOnlyError | InvalidStateError | DataError | DataCloneError
   * @refer https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/put
   */
  public async puts(generator:Generator) {
    return this.bindGenerator('put', generator);
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
}
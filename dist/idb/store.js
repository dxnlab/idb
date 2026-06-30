import IndexProxy from "./dataindex";
import { Queriable } from "./common";
/** IDBObjectStore wrapper  */
export default class StoreProxy extends Queriable {
    _tx;
    constructor(tx, name) {
        super(tx.objectStore(name));
        this._tx = tx;
    }
    get store() {
        return this.basis;
    }
    // props @inherited
    // - IDBObjectStore.keyPath
    // - IDBObjectStore.name
    // read props
    get indexNames() { return this.store.indexNames; }
    get transaction() { return this.store.transaction; }
    get autoIncrement() { return this.store.autoIncrement; }
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
    async add(value, key) {
        return this.binds('add', value, key);
    }
    // IDBObjectStore.clear
    async clear() {
        return this.binds('clear');
    }
    // IDBObjectStore.delete
    async delete(key) {
        return this.binds('delete', key);
    }
    // IDBObjectStore.put
    async put(item, key) {
        return this.binds('put', item, key);
    }
    // generators @inherited
    // - openGenerator
    // - valueGenerator
    // - keyGenerator
    // @ProxiedIndex
    // IDBObjectStore.index
    index(name) {
        return new IndexProxy(this.store, name);
    }
}

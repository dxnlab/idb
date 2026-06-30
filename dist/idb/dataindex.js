import { Queriable } from "./common";
/**
 * data index (IDBIndex) proxy for query
 *  Within transaction, initiated from StoreProxy index,
 *  used as index entry point for data.
 */
export default class IndexProxy extends Queriable {
    constructor(store, name) {
        super(store.index(name));
    }
    get index() { return this.basis; }
    // props @inherited
    // IDBIndex.keyPath
    // readonly props
    get name() { return this.basis.indexName ?? this.basis.name; }
    get isAutoLocale() { return this.basis.isAutoLocale; }
    get locale() { return this.basis.locale; }
    get objectStore() { return this.basis.objectStore; }
    get multiEntry() { return this.multiEntry; }
    get unique() { return this.unique; }
}

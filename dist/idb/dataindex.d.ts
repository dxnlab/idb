import { Queriable } from "./common";
/**
 * data index (IDBIndex) proxy for query
 *  Within transaction, initiated from StoreProxy index,
 *  used as index entry point for data.
 */
export default class IndexProxy extends Queriable<IDBIndex> {
    constructor(store: IDBObjectStore, name: string);
    get index(): IDBIndex;
    get name(): any;
    get isAutoLocale(): any;
    get locale(): any;
    get objectStore(): IDBObjectStore;
    get multiEntry(): any;
    get unique(): any;
}

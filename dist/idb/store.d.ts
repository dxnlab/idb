import IndexProxy from "./dataindex";
import { Queriable } from "./common";
/** IDBObjectStore wrapper  */
export default class StoreProxy extends Queriable<IDBObjectStore> {
    protected _tx: IDBTransaction;
    constructor(tx: IDBTransaction, name: string);
    get store(): IDBObjectStore;
    get indexNames(): DOMStringList;
    get transaction(): IDBTransaction;
    get autoIncrement(): boolean;
    add(value: any, key?: IDBValidKey): Promise<unknown>;
    clear(): Promise<unknown>;
    delete(key: IDBValidKey | IDBKeyRange): Promise<unknown>;
    put(item: any, key?: IDBValidKey): Promise<unknown>;
    index(name: string): IndexProxy;
}

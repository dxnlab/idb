/** type definition to ease (optional) */
import type { Brand, Product, Item } from './example.types';
/** Decorate the class */
export declare class ItemData {
    /**
     * The `reads` decorator wraps the method with readonly mode Transaction, for objectStores by the names.
     *
     * @param tx:(Proxied)IDBTransaction;
     *  which holds (proxied) IDBObjectStore with its name.
     * @returns Promise<RETURN> as the function return type.
     */
    getAllBrands({ brands }: any): Promise<any>;
    /**
     * The `writes` decorator wraps the method with readwrite mode Transaction, for objectStores by the names.
     *
     * @param tx:(Proxied)IDBTransaction;
     *  which holds (proxied) IDBObjectStore with its name.
     * @params brands:{title:string, ...}  as of migration determined.
     * @returns Promise<RETURN> as the function return type.
     */
    setBrands({ brands }: any, ...puts: Brand[]): Promise<any[]>;
    /**
     * multiple store associated transaction
     * @param tx
     * @param adds:Product[]
     * @returns
     */
    addProducts({ brands, products }: any, ...adds: Product[]): Promise<any[]>;
    /**
     * simple store, to show IDBTransactionOption set.
     * @param tx
     * @param adds:Product[]
     * @returns
     */
    setItems({ items }: any, ...its: Item[]): Promise<any[]>;
    /**
     * AsyncGenerators - by openCursor can be set.
     *  - openGenerator; returns ordinary IDBCursor generator with openCursor
     *  - valueGenerator; returns value as of the IDBCursor
     *  - keyGenerator; returns index key genarator
     *
     * Transaction option, { durability }, also can be set for reads/writes:
     * `@trx (storeNames:string[], mode:IDBTransactionMode='readonly', option?:IDBTransactionOption)`
     * `@reads (...storeOrOption:(string|IDBTransactionOption)[])`
     * `@writes(...storeOrOption:(string|IDBTransactionOption)[])`
     * when multiple options presented, only the first option gets effective.
     *
     * @param tx
     * @param brandName
     */
    listItems(tx: any): AsyncGenerator<never, any, unknown>;
    /**
     * Just to show Raw IDBObjectStore comparison with Proxied Store
     *
     * @param tx
     * @returns
     */
    justToShowRawStore(tx: any): Promise<boolean>;
    /**
     * Just to show `@trx` decorator using
     * @param tx
     * @returns
     */
    justToShowTrxDecorator(tx: any): Promise<any>;
    /**
     * Clear all specified stores
     */
    clearsAll(tx: any): Promise<[any, any, any]>;
}

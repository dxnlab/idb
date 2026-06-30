import { DatabaseOption, May } from "../types";
export declare const factory: IDBFactory;
/** --- IDBFactory ---
 *
 */
export declare function showDatabases(): Promise<IDBDatabaseInfo[]>;
export declare function cmp(first: any, second: any): number;
export declare const connect: (database: string, option?: DatabaseOption) => Promise<IDBDatabase>;
export declare const drop: (database: string) => Promise<any>;
export declare function disconnect(db: IDBDatabase): Promise<unknown>;
export declare function transaction(db: May<IDBDatabase>, { stores, mode, option }: {
    stores: string[];
    mode?: IDBTransactionMode;
    option?: IDBTransactionOptions;
}): (runner: Function, args?: any[], binded?: any) => Promise<any>;
/** --- IDBDatabase:migrations ---
 *
 */
declare const _default: {
    factory: IDBFactory;
    showDatabases: typeof showDatabases;
    cmp: typeof cmp;
    connect: (database: string, option?: DatabaseOption) => Promise<IDBDatabase>;
    drop: (database: string) => Promise<any>;
    disconnect: typeof disconnect;
    transaction: typeof transaction;
};
export default _default;

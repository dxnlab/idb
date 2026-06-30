import { DatabaseOption } from "./types";
export declare function idb(database: string, option?: DatabaseOption): (cls: any, context?: DecoratorContext) => void;
export declare function trx(stores: string[], mode?: IDBTransactionMode, option?: IDBTransactionOptions): (runner: Function, context: DecoratorContext) => any;
export declare function reads(...args: Array<string | IDBTransactionOptions>): (runner: Function, context: DecoratorContext) => any;
export declare function writes(...args: Array<string | IDBTransactionOptions>): (runner: Function, context: DecoratorContext) => any;

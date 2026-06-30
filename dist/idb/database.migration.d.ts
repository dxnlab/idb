import { DatabaseOption, StoreOption } from "../types";
export default function (option?: DatabaseOption): (({ target }: {
    target: any;
}) => any) | ((ev: IDBVersionChangeEvent) => void);
export declare function createStore(db: IDBDatabase, storeName: string, option?: StoreOption): IDBObjectStore;
export declare function deleteStore(db: IDBDatabase, storeName: string): void;

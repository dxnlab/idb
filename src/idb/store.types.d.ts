import { Queriable } from "./common";
import IndexProxy from "./dataindex";

declare class StoreProxy extends Queriable<IDBObjectStore> {
  protected _tx: IDBTransaction;
  protected _index: { [name: string]: IndexProxy };

  constructor(tx: IDBTransaction, name: string);

  public readonly store: IDBObjectStore;
  public readonly indexNames: string[];
  public readonly transaction: IDBTransaction;
  public readonly autoIncrement: boolean;
  
  public index(name: string): IndexProxy;
  public count(key?: IDBValidKey | IDBKeyRange): Promise<number>;
  public get(key: IDBValidKey | IDBKeyRange): Promise<any>;
  public gets(generator:Generator<IDBValidKey>): Promise<Generator<any>>;
  public add(value: any, key?: IDBValidKey): Promise<IDBValidKey>;
  public adds(generator:Generator<any>): Promise<Generator<IDBValidKey>>;
  public clear(): Promise<void>;
  public delete(key: IDBValidKey | IDBKeyRange): Promise<void>;
  public deletes(generator:Generator<IDBValidKey>): Promise<Generator<void>>;
  public put(value: any, key?: IDBValidKey): Promise<IDBValidKey>;

  /** Queriable inherited */
  // @ts-ignore
  public readonly keyPath: string | string[];
  // @ts-ignore
  public readonly keyPathes: string[];
  // @ts-ignore
  public readonly name: string;
  protected binds<IDBObjectStore>(fnname:string, ...args:any[]): Promise<any>;
  protected bindGenerator<IDBObjectStore>(fnname:string, generator:()=>Generator): Promise<any[]>;
  public count(query?: IDBValidKey | IDBKeyRange): Promise<number>;
  public get(key: IDBValidKey): Promise<any>;
  public getKey(key: IDBValidKey): Promise<IDBValidKey>;
  public getAll(query?: IDBValidKey | IDBKeyRange, count?: number): Promise<any[]>;
  public getAllKeys(query?: IDBValidKey | IDBKeyRange, count?: number): Promise<IDBValidKey[]>;
  public getAllRecords(option?:object): Promise<any[]>;
  public openCursor(handler:(cursor: IDBCursorWithValue) => any, { onError, query, direction }?: { onError?: (err: any) => void; query?: IDBValidKey | IDBKeyRange; direction?: IDBCursorDirection }): Promise<void>;
  public openKeyCursor(range?: IDBValidKey | IDBKeyRange, direction?: IDBCursorDirection): Promise<IDBCursor | null>;
  public getKey(key: IDBValidKey): Promise<IDBValidKey>;
  public getAllRecords(query?: IDBValidKey | IDBKeyRange, count?: number): Promise<any[]>;
  public cursorGenerator(query?: IDBValidKey | IDBKeyRange, direction?: IDBCursorDirection): AsyncGenerator<IDBCursorWithValue>;
  public keyCursorGenerator(query?: IDBValidKey | IDBKeyRange, direction?: IDBCursorDirection): AsyncGenerator<IDBCursor>;
  public groupGenerator({ query, direction, having }?: { query?: IDBValidKey | IDBKeyRange; direction?: IDBCursorDirection; having?: (cursor: IDBCursorWithValue) => boolean }): AsyncGenerator<IDBCursorWithValue>;
  public openGenerator({ query, direction, having }?: { query?: IDBValidKey | IDBKeyRange; direction?: IDBCursorDirection; having?: (it: any) => boolean }): AsyncGenerator<IDBCursorWithValue>;
  public valueGenerator({ query, direction, having }?: { query?: IDBValidKey | IDBKeyRange; direction?: IDBCursorDirection; having?: (it: any) => boolean }): AsyncGenerator<IDBCursorWithValue>;
  public keyGenerator({ query, direction, having }?: { query?: IDBValidKey | IDBKeyRange; direction?: IDBCursorDirection; having?: (it: any) => boolean }): AsyncGenerator<IDBCursor>;
}
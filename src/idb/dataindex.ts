import { Queriable } from "./common";

/**
 * data index (IDBIndex) proxy for query
 *  Within transaction, initiated from StoreProxy index,
 *  used as index entry point for data.
 */
export default class IndexProxy extends Queriable<IDBIndex> {
  constructor(store:IDBObjectStore, name:string) {
    super(store.index(name));
  }

  public get index():IDBIndex { return this.basis as IDBIndex; }

  // props @inherited
  // IDBIndex.keyPath
  
  // readonly props
  public get name() { return this.basis.indexName ?? this.basis.name; }
  public get isAutoLocale() { return this.basis.isAutoLocale; }
  public get locale() { return this.basis.locale; }
  public get objectStore() { return this.basis.objectStore }
  public get multiEntry() { return this.multiEntry; }
  public get unique() { return this.basis.unique; }

  // methods @inherited
  // - IDBIndex.count
  // - IDBIndex.get
  // - IDBIndex.getKey
  // - IDBIndex.getAll
  // - IDBIndex.getAllKeys
  // - IDBIndex.getAllRecords
  // - IDBIndex.openCursor
  // - IDBIndex.openKeyCursor

  // generators @inherited
  // - openGenerator
  // - valueGenerator
  // - keyGenerator

}
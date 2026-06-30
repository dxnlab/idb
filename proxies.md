# @dxnlab/idb Proxy Instances

The project appends read-only properties over legacy indexeddb instances to ease using. This, get triggered at the connector class (`IDBDatabase`), transaction wrapper (`IDBTransaction`), containing stores (`IDBObjectStore`) and indices (`IDBIndex`) accordingly.

## IDBDatabase: class static methods

```typescript
@idb('database')
class iDB {
    /** 
     * appended properties to the class 
     * by @idb decorator 
     **/

    // indexeddb.databases
    static async showDatabases():Promise<IDBDatabaseInfo[]>

    // indexeddb.cmp
    static cmp(first:any, second:any):number

    // lazy loading connector
    static get idb():Promise<IDBDatabase>

    // alias for disconnect. close connection at any set.
    static set idb():Promise<void>

    // open connection
    static async connect():Promise<IDBDatabase>

    // close connection
    static async disconnect():Promise<void>

    // drop the database
    static async drop():Promise<void>

    // transaction wrapper
    static async transaction(
        stores:string[], 
        mode:'readonly'|'readwrite'='readonly',
    ): (runner:(tx:TransactionProxy, ...args:any[])=>any,
        bindingArgs:any[],
        bindingThis:any)
            =>any;
}

// assuming instance 
```

### IDBFactory

#### IDBFactory.databases

```typescript
await iDB.showDatabases()
    .map({name, version}:IDBDatabaseInfo)=>...);
```
directs `indexeddb.databases`

#### IDBFactory.cmp

```typescript
const comparison = iDB.cmp(first, second)
```
directs `indexeddb.cmp`

#### IDBFactory.open

```typescript
// best practice
const db = await iDB.idb as Promise<IDBDatabase>;
// is handled by internal
const db = await iDB.connect()
```

directs `indexeddb.open` with migration option

#### IDBFactory.deleteDatabase

```typescript
await iDB.drop()
```

directs `indexeddb.deleteDatabase` with the database name

### IDBDatabase

#### IDBDatabase.transaction

returns transaction wrapper function for the database.

```typescript
// build transaction wrapper
const withTrx = iDB.transaction(['storeA','storeB']);
// pass in-transaction handler as the single parameter
const result = await withTrx(async ({storeA, storeB})=>[
    ...(await storeA.getAll()),
    ...(await storeB.getAll()),
]);
```

### IDBTransaction

#### IDBDatabase.objectStore

```typescript
@reads('store')
async getStoreMethods(tx) {
    // IDBObjectStore instance
    const legacyObjectStore = tx.objectStore('store');
    // proxied objected store getter
    const proxiedObjectStore = tx.['store'] || tx.store;

    // raw target getter; true
    return legacyObjectStore === proxiedObjectStore.store;
}
```

### IDBObjectStore 

#### IDBObjectStore.index

```typescript
@reads('store')
async getIndexMethods({store}) {
    // IDBIndex instance
    const legacyIndex = store.index('idx_name');
    // proxied index getter
    const proxiedIndex = store.['idx_name'] || store.idx_name;

    // raw target getter; true
    return legacyIndex === proxiedIndex.index;
}
```

---

### (in Transaction) Common for `IDBObjectStore`/`IDBIndex` promise wrap

```typescript

// common properties (getter)
get keyPath():string
get name():string

// common methods (promise wrapped)
async count(query):Promise<number>
async get(key):Promise<any>
async getKey(key):Promise<any>
async getAll(query?, count?):Promise<any[]>
async getAllKeys(query?, count?):Promise<any[]>
async getAllRecords(option?):Promise<any[]> // getAll when not supported
async openCursor(query?, direction?):Promise<IDBCursorWithValue>
async openKeyCursor(query?, direction?):Promise<IDBCursor>

// generators
async *openGeneartor(query?, direction?):AsyncGenerator<IDBCursorWithValue>
async *valueGenerator(query?, direction?):AsyncGenerator<any>
async *keyGenerator(query?, directin?):AsyncGenerator<IDBCursor>

```


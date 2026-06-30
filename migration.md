# @dxnlab/idb database migration

When class decorator @idb set, try to establish the first connection, it fires `IDBOpenDBRequest` then it may trigger `IDBVersionChangeEvent` if selected version (positive non-zero integer) upgraded.

Within the migration option, if an `upgrade` (`onupgradeneeded` handler accordingly) handler explicitly determined, it priors `auto-migration` feature. But when it's omitted, `stores` property that has object store definitions would build the database migrations.

Due to indexeddb specification, it is **NOT POSSIBLE TO ALTERNATE EXISTING STORE**. Hence `auto-migration` first compares `stores` defined store names to concurrent `objectStoreNames`, then i) **CREATE NEWLY LISTED** and ii) **DELETE NOT PRESENTED**.

## How it works

When `upgrade` handler determined, it priors then `auto-migration`. `upgrade` handler gets `IDBDatabase` instance from `IDBVersionChangeEvent` then commiting changes.

### upgrade?(db, request, event):void


```typescript
upgrade(
    db:IDBDatabase, 
    request:IDBOpenDBRequest, 
    event:IDBVesionChangeEvent
):void 
{
    // list current object stores
    const oldStoreNames = Array.from(
        db.objectStoreNames as DOMStringList) as string[];
    // old & new version numbers 
    const oldVersion:nuber = event.oldVersion;
    const newVersion:nubmer = event.newVersion;

    // create a new object store
    const newStore = db.createObjectStore(
        'new_store',              // store name
        ['primary', 'keys'],      // keyPath string|string[]
        { autoIncrement: false }, // additional options
    );
    // appending an index
    const newStoreIndex = newStore.createIndex(
        'idx',        // index name
        'primary'     // keyPath string|string[]
        { multiEntity: false, unique: true }
    );
    // seeding, dropping, ...

    /** 
     * auto-migration WILL NOT BE triggered,
     * since upgrade handler exists!
     */
}
```

## auto-migration

But when upgrade handler not presented, it generates `stores` specified stores by its definition.

The only option that is required on `createObjectStore`/`createIndex` is the `keyPath`. There, when the definition option holds `string`|`string[]` as a value rather than detailed `object`, it puts those as `keyPath` and leave rest of options unspecified. If it's a store, internal indexes are zero-set at default.

Also, migration option does **NOT** handles version history, it ignores skipped version changes. When version-history related changes get required, use `upgrade` handler instead.

## The type; example

```typescript
{
    /**
     * @optional version number as of indexeddb spec.
     **/
    version: 1,
  
    /**
     * @optional onUpgradeNeeded event handler.
     *  When omitted, "stores" builds auto-migration
     */
    upgrade: (db,request,event)=>void,

    /**
     * @optional onBlocked event handler.
     *   rarely be used.
     */
    blocked: (db,request,event)=>void,

    /**
     * @optional ObjectStore definitions
     */
    stores: {
        // Simplest: storeName: "<primary keyPath>"
        simple: 'id',
        // Simpler: storeName: ["<key>", "<path>", "<s>"]
        multiSimple: ['topKey','midKey','lowKey'],
        /**
         * Practical
         **/
        sample: {
            /**
             * @required keyPath
             * @type string|string[]
             **/
            key: 'pk',

            /**
             * @optional autoIncrement
             * @type boolean
             * @default false
             **/
            autoIncrement: false,
            
            /**
             * @optional Practical Index definitions
             **/
            index: {

                /**
                 * index also, can hold a single keyPath
                 * @type string|string[]
                 */
                simple_idx: 'pk',

                // But to be more practical;
                idx: {
                    /**
                     * @required keyPath for the index.
                     * @type string|string[]
                     */
                    key: 'id',

                    /**
                     * @optional multiEntry property
                     * @type boolean
                     * @default false
                     */
                    multi: false,

                    /**
                     * @optional unique property
                     * @type boolean
                     * @deafult false
                     */
                    unique: false,

                }

            }

        }

    }

}
```

## Limitation

- Due to `indexeddb specification`, alternate existing objectStore is not possible. Also, auto-migration only i) **create newly named stores** and ii) **delete stores that are not listed**.
- Auto migration does not count historical version updates; If a identical name get used create, updated (replaced) and/or deleted-recreated, it is not possible to be followed.

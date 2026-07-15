# Query IndexedDB with @dxnlab/idb



## Reads AsyncWrapper

Within the proxied [Store](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore) & [Index](https://developer.mozilla.org/en-US/docs/Web/API/IDBIndex), common `get`/`getKey`/`getAll`(`getAllRecords`)/`getAllKeys` method wraps origin function to a corresponding Promise.

A single getter methods takes a single key value (`IDBValidKey`) as optional paramter, and those bulk-retrieval methods share common parameters: (`query`, `direction`). Unlike origin functions, a single option parameter is not allowed for the wrappers.

- `query` IDBValidKey | IDBKeyRange; 

  Can be a single value to lookup, or array (if the keyPath has multiple keys within the store/index) or [KeyRange](https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange).

- `direction` 'next' | 'prev' | 'nextunique' | 'prevunique'; 

  Retrieval direction that has defined [IDBCursor.direction](https://developer.mozilla.org/en-US/docs/Web/API/IDBCursor/direction)

```typescript
@reads('store')
public async exampleOfRetrievals({store}) {
    // get the item by store primary key
    const pkItem = await store.get('pk');

    // get key of 'pk'
    const pk = await store.getKey(IDBKeyRange.only('pk'));

    // get all items
    const allItemsWithoutQuery = await store.getAll();
    // is further equivalent
    const allRecordsWithoutQuery = await store.getAllRecords();
    
    // keys to lookup
    const allKeys = await store.getAllKeys();
}
```

## Edits AsyncWrapper

For the StoreProxy, there's transactional method wrapper for `add`, `put`, `delete` and `clear`.

```typescript
@writes('store')
public async exampleOfEditings({store}) {
    // add an item
    await store.add({ ...values }, optionalKeyAsOfLegacyIDBStore_add);

    // can update the value (INSERT OR UPDATE)
    await store.put({ ...values }, optionalKeyAsOfLegacyIDBStore_add);

    // delete a records
    await store.delete(selectedKey);

    // or clear all the records
    await store.clear();
}
```

## Cursor

There's simplified cursor function that can be used async access. `openCursor` and `openKeyCursor` wrapper gets `handler` function as first parameter, then option objects (optional). Since the cursor goes series of dispatching success events, the handler get triggered by a single cursor emit.

Simpler [`AsyncGenerator` wrappers are also available](#generator), however, it takes more resources and less perfornant then raw cursor handling. These, cursor wrappers preserve origin architecture as much as possible to keep up the performance.

Refer [IDBCursor](https://developer.mozilla.org/en-US/docs/Web/API/IDBCursor) and [IDBCursorWithValue](https://developer.mozilla.org/en-US/docs/Web/API/IDBCursorWithValue) for further Cursor manipulations.

```typescript
@writes('store')
public async exampleOfCursor({store}) {
    // open a cursor then run its handler one at a time.
    store.openCursor((cursor) => {
        // cursor === undefined when it gets done.
        if(cursor == null) return;

        // decomposing cursor properties
        const { source, key, value } = cursor;
        // anything with the cursor can be possible to be achieved.
        cursor.update(values)
        cursor.delete()
        // Because the handler is simple wrapper,
        // continue() or advance() must be called internally.
        cursor.advance(2)
    });

    // run with key cursor
    store.openKeyCursor((cusor) => {
        // cursor === undefined when it gets done.
        if(cursor == null) return;

        const { source, key } = cursor;
        // also can do the things with the cursor
        cursor.delete();
        // move forward
        cursor.continue();
    });
}
```

## Generator

In advance `Cursor` and `AsyncGenerator` using, there's simplified generator methods that can handle key/values as of `for await (const x of asyncGenerator()) { ... }.

- `openGenerator` ({ `query?`, `direction?`, `having?` })

  openGenerator yields cursor (`IDBCursorWithValue`) as of `openCursor`. It takes `query` parameter (`IDBValidKey` | `IDBKeyRange`), `direction` (`IDBCursorDirection`) which are resembles [Read AsyncWrappers](#reads-asyncwrapper).

  `having` option is corresponds to `HAVING` function in usual SQL query, which filters records by the recall. Generator yielded type - for the openGenerator, IDBCursorWithValue is the only paramter intakes. It yields when having(cursor) returns `true`, skip when it's `false`.

  And the generator runs `cursor.continue` internally.

- `valueGenerator` ({ `query`, `direction`, `having` })

  Each generator functions share common in action, except valueGenerator yields `cursor.value` for each iteration.

- `keyGenerator` ({ `query`, `direction`, `having` })

  Unlike 2 functions above, keyGenerator use `openKeyCursor` to get `IDBCursor` instead, and yields `cursor.key` out of the cursor.

- `groupGenerator` ({ `query`, `direction`, `having` })

  This, uses `openCursor` and yields `Entries` form, `[key:IDBValidKey, records:any[]]`.
  `having` filter get applied for each cursor rather than a group. for instance, 

  ```typescript
  having:({key, value}) => value.dualKey === key
  ```

  It will filter out `value.dualKey === key` records BEFORE aggregated then yields `[key, [...dualKeyIdenticalValues]]` for each key.

  

```typescript
@reads('store')
public async exampleOfGenerators({store}) {
    // openGenerator
    for await (const cursor of store.openGenerator({query, direction, having})) {
        const { key, value } = cursor;
        // do things with the cursor
    }

    // valueGenerator
    const asyncValueGenerator = store.valueGenerator({
        having: (value)=>Object.hasProperty(value, 'flag')
    });
    for await (const value of asyncValueGenerator) {
        // value.flag MUST exists that had passed "having" filter above.
        if(value.flag!) {
            // so this case must be value.flag == falsy (0, false or null)
        }
    }

    // keyGenerator
    for await (const key of store.keyGenerator({ direction: 'prevunique' })) {
        // so things with key
    }

    // groupGenerator
    for await (const [key, records] of store.groupGenerator()) {
        // Resembles Object.entries( ) using
    }

}
```

## Prepare

< v0.0.3, prepare statement adapted.

`prepare` takes proxied Store or Index instance, using determined keyPath indices for easier query records. For example:

```typescript
@reads('store')
public async *storesAt({store}, location)
    :AsyncGenerator<[IDBValidKey, any[]]> {
    // prepare statement
    const query = prepare(store.location)
        // bound range
        .range('=', location)
        // direction ascending
        .ascending()
    yield* query.keyEntries;
}
```

### generator getters; cursor, values, keys, uniqueKeys, keyEntries

It builds common generators out of statement setting. Once conditions had set, the generators can be placed by a getter.

- `cursor` corresponds to `openGenerator` which yields `IDBCursorWithValue`
- `values` to `valueGenerator` that yields `cursor.value`
- `keys` to `keyGenerator` for `cursor.key`
- `uniqueKeys` forces `unique()` at direction then provide `keys` according to other settings.

  that is, `stmt.uniqueKeys` is identical to `stmt.unique().keys`

- `keyEntries` to `groupGenerator` at `[key, records]`



### range / direction / having

There are i) bounding range condition `range`, ii) direction settings `ascending`, `descending`, `unique`, `iterate`, and iii) having filter `having` conditions can be set for a prepared query.

#### range(operator:string, value:any)

range determines key range to query. Among the key that of target, it makes bounding range from `IDBKeyRange` option.

```typescript
@reads('items')
public async *itemInRange({items}, itemCategory:ItemCategory, min:number, max:number) {
    // use price index from items store.
    yield* prepare(items.price)
        // ranged to (min, max]
        .range('>', min)
        .range('<=', max)
        // within the same category
        .having(({category})=>category == itemCategory)
        // yields values out of it
        .values;
}
```

`operator` takes usual operator strings that are:

- Less than (the value): `<`, `lt`
- Greater than: `>`, `gt`
- Less than or equals: `<=`, `=<`, `lte`
- Greater than or equals: `>=`, `=>`, `gte`
- equals: `=`, `==`, `eq`

since the `IDBValidKey` can be complicated due to environment of indexedDB keyRange, it directly takes the boundary value at range. This, corresponding to the target keyPath range values, sets `IDBKeyRange` boundary at getting the generator. Which applies - can update then reuse once after query made.


```typescript
@writes('store')
public async reusingStatement({store}) {
    const query = prepare(store)
        // within [0, 99]
        .range('>=', 0)
        .range('<=', 99);
    const keysToFind = [];
    // once used
    for await (const key in query.uniqueKeys) {
        keysToFind.push(key);
    }

    // update direction & having
    for await (const cursor in query.having(keysToFind.includes).decending().unique().cursor) {
        // can use the cursor
        cursor.update({...values});
    }
}
```

#### direction; ascending/descending & unique/iterate

direction get passed into `direction` to the according [Generator](#generator) methods. There's `ascending` (=next) vs. `descending` (=prev) and `iterate` (=all) vs. `unique` (=unique) methods provided.

| *direction* | **ascending** | **descending**
|-----|-----|-----|
| **iterate** | `next` (default) | `prev` |
| **unique** | `nextunique` | `prevunique` |



#### having

The having function is corresponding to `having` option for the [Generator](#generator) methods. But in this case, sequencial having functions applied. There can be multiple having functions can be set, only the ALL returned true get retrieved.

Because having function get different parameters by generators, better NOT TO update-reuse queries that has `having` in it.

```typescript
@reads('store')
public async *multiHaving({store}) {
    yield* prepare(store.id)
        // is integer
        .having((pk)=>Math.round(pk) === pk)
        // upon (0, 10]
        .having((pk)=> 0 < pk && pk <= 10)
        // odd number
        .having((pk)=>pk%2===1)
        // and multiplicate of 3
        .having((pk)=>pk%3===0)
        // should be generator of <3, 9>
        .unique().keys
}
```
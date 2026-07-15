# @dxnlab/idb

[IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) wrapper with [TypeScript Decorator stage3](https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/#decorators)


## Quick Start

```typescript

import { 
    idb,     // class decorator to connect idb
    reads,   // method wrapper for mode 'readonly'
    writes,  // method warpper for mode 'readwrite'
    prepare, // prepare queries
} from '@dxnlab/idb'

/**
 * idb database migration info
 */
const migration = {
    version: 1,
    stores: {
        items: 'id'
        index: {
            category: 'category',
            price: 'price',
        }
    }
}

type Item = {
    id:string,
    title:string,
    category?:string,
    price?:number
}

/*---- DEFINE ----*/

@idb('database_name', migration)
class ItemDB {
    /**
     * Add an item.
     */
    @writes('items')
    public async addItem(tx, it:Item) {
        return await tx.items.add(it);
    }

    /**
     * Single item find by its PK; id.
     */
    @reads('items')
    public async getItem({items}, id:string) {
        return await items.get(id);
    }

    /**
     * Async Items generator
     */
    @reads('items')
    public async *items({items}, query?, direction='next') {
        yield* items.valueGenerator({query, direction});
    }

    /**
     * prepare query generator
     */
    @reads('items')
    public async itemsOfPrice({items}, categories:ItemCategory[], maxPrice:number) {
        yield* prepare(items.price)
            .range('<=', maxPrice)
            .having(({category})=>categories.includes(category))
            .values;
    }
}

/*---- USE ----*/

// simple construction will connect the database
const itemDB = new ItemDB();
// The first parameter, tx; gets neglected when explicitly called.
await itemDB.addItem({ id: 'one', title: 'one', price: 1});
await itemDB.addItem({ id: 'two', title: '2' });

// { id:'one', title:'one', price: 1 }
const itemOne = await itemDB.getItem('one')

// list generators
for await (const IT of itemDB.items()) {
    /* do things with IT */

    /* or simply can yield */
}
```

## Install

```
npm install @dxnlab/idb
```

### Configure caution

[Can I Use decorator now?](https://caniuse.com/?search=decorator) TypeScript Decorator - stage3 feature itself is relatively a new. It makes clear structure, easy to be used, also can enhance overall performance by functional typing. However, it's lagging environmental supports - plus dangling previous `stage 2` mismatches - makes it harder to get widely spreaded.

---

According to typescript settings, some framework delivers ts/tsx file directly or with simple transpiling. Which in turn, cause `Syntax Error` at the decorator symbol, `@`.

Including [`wdio`](https://webdriver.io/), Any script that using stage 3 decorator ***MUST***:

- **Node.js** version `12.20` or higher
- **tsconfig.target** `ES15` or higher
- **tsconfig.experimentalDecorators**: `false` to disable stage2 decorator

#### babel

```jsonp
/* babel.config.json */

{

    "plugins": [
        [
            "@babel/plugin-proposal-decorators", 
            { "version: "2023-11" }
        ]
    ]
}
```



#### Vite & Oxc

Relevant issue: 
- [oxc#9170](https://github.com/oxc-project/oxc/issues/9170) 
- [vitejs discussion/21891](https://github.com/vitejs/vite/discussions/21891)

Recent [Vite v8](https://vite.dev/) and using [OXC](https://oxc.rs/) has not firmly resolved to use typescript decorator.

There's `babel` bypass proposal; referring [The babel Plugin](https://babeljs.io/docs/babel-plugin-proposal-decorators/) and [vitejs discussion#21891](https://github.com/vitejs/vite/discussions/21891), Which would loose some integrity but can provide ts/tsx decorator support:

```sh
npm install --save-dev @rolldown/plugin-babel @babel/plugin-proposal-decorators
```

```typescript
/* vite.config.ts */

import babel from '@rolldown/plugin-babel'

export default defineConfig({
    /** ... **/
    plugins: [
        babel({
            presets:[{
                preset: ()=>({ plugins: [
                    [
                        '@babel/plugin-proposal-decorators', 
                        { version: '2023-11' }
                    ]
                ]})
            }]
        })
    ]
    /** ... **/
});
```

#### Others

Not yet known; Please feel free to provide typescript-decorator-stage3 support information!

## Key features

1. It wraps indexeddb worker request-response callback within `Promise`; Which is very likely with [classical idb](https://www.npmjs.com/package/idb). Each request get resolved at `success` and failed at `error` in common.
2. The class; which populates a single-database connector instance, makes certain enhancements:
  - It provides **lazy-loading** class-wise singletone connection.
  - Each direct database manipulation features get ***forced*** to be in the class.
  - Can ease version migration from option, rather than direct callback.
3. It wraps all indexeddb transactions by a method decorator - `trx`, and its simplified aliases `reads`, `writes`.
  - Which can hide repeating transaction `commit`/`abort`
  - It provides simpler proxy for `Transaction`/`ObjectStore`/`Index` that each can be accessed by its given name.


  ```typescript
  /** 
   * 3 method decorators for transactions;
   *   trx, reads, writes 
   **/

  // base IDBDatabase.transaction(store|stores, mode, option)
  trx(
    stores:string[], 
    mode:'readonly'|'readwrite'='readonly', 
    option?:{durability:'strict'|'relaxed'|'default'})

  // trx(stores, 'readonly', option)
  reads(...storesOrOption:string|{durability}[])

  // trx(stores, 'readwrite', option)
  writes(...storesOrOption:string|{durability}[])
  ```
4. It provides built-in query generator support using `open(Key)Cursor`.

  ```typescript
  // value generator
  @reads('store')
  async *queryByValue({store}, query:IDBKeyRange, count:number) {
    // Itself returns AsyncGenerator<any>
    return store.valueGenerator(query, count);

  }

  // is identical to:
  @reads('store')
  async *queryByValueIdenticalTo({store}, query:IDBKeyRange, direction:IDBCursorDirection) {
    const cursor = store.openCursor(query, direction);
    while(cursor) {
        yield cursor.value;
        cursor.continue();
    }
  }
  ```

5. Wrapping `AsyncGenerator` query (<=0.0.3)

  ```typescript
  @idb
  class Foo {
    /**
     * Using AsyncGenerator
    *  - openGenerator; openCursor & using cursor:IDBCursorWithValue instance as-is
    *  - valueGenerator; openCursor & using cursor.value:any
    *  - keyGenerator; openKeyCursor & using cursor.key
    * @param {
    *   query?:IDBValidKey|IDBKeyRange; passed on openCursor
    *   direction?:'next' | 'nextunique' | 'prev' | 'prevunique'
    *   having?:(cursorValue:any)=>boolean; yields the cursor retrieval value at true,
    *     alike "SELECT ... HAVING" statement at SQL.
    * }
    */
    @reads('store')
    async runWithGenerators({store}) {
        // openGenerator({query?, direction?, having?})
        for await(const cursor of store.openGenerator()) {
            // DO whith cursor:IDBCursorWithValue
        }

        // keyGenerator({query?, direction?, having?})
        for await (const key of store.keyGenerator()) {
            // DO with key == cursor.key
        }
    }
  }
  ```
  6. Wrapping advanced query generator (since 0.0.3)

  ```typescript


  @idb
  class Bar {
    /**
     * 
     */
    @reads('store')
    public *searchItems({store}, category:string, minPrice:number, maxPrice:number) {
        /**
         * 'category' has its index by name "category" but price doesn't.
         *   open a cursor with the selected category, 
         *   then filter those at price range with "HAVING" validator.
         */
        const stmt = prepare(store)
            // `range` determine query boundary by the store/index keys.
            .range('=', category)
            // `having` yields the cursor when its condition mets (return true)
            .having(({price})=> minPrice <= price && price <= maxPrice);
            // set direction. ascending at default.
            .ascending()
            // .unique() when unique traversal required
        // statement 
        // there are multiple generators can be used:
        // - cursor [IDBCursorWithValue]
        // - keys [IDBCursor]
        // - uniqueKeys [IDBCursor], force uniquness to be true
        // - values [any] value instance
        // - keyEntries [key, values[]].
        for await (const item of stmt.values) {
            yield item;
        }
    }

    /**
     * Simpler bounds
     */
    @reads('store')
    public *boundedItemsWithinPeriod({store}, fromDate:Date, tillDate:Date) {
        const stmt = prepare(store)
            .range('>', fromDate)
            .range('<=>', tillDate);
        yield* stmt.values;
    }

    /**
     * Actual value bindings
     */
    @reads('store')
    public *boundedItemsWithPeriodAvailable({store}, fromDate:Date, tillDate:Date) {
        const stmt = prepare(store.released_date)
            .range('>', fromDate)
            .range('<=',  tillDate)
            .having(({stock_count})=> 0<stock_count);
        yield* stmt.values;
    }
  }

  ```

  ## Options & Examples

  - [x] [Migration](migration.md)
  - [x] [Proxies](proxies.md) *v0.0.3 updated
  - [x] [Queries](query.md) *v0.0.3 started
  - [ ] Examples


---

## Versions

- 2026.Jun.30 `v0.0.2` first initiated
  - decorator proxied database/transaction/objectStore/index.
  - promise request wrapper
  - with in transaction wrapper
  - @author yg.song

- 2026.Jul.14 `v0.0.3` update
  - (fixed) `IndexProxy` getter at `StoreProxy` instance property.
  - Advanced query generator `prepare`

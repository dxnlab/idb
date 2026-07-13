import { idb, reads, writes, trx } from '.'
/** migration option */
import migration from './migration'
/** type definition to ease (optional) */
import type { Brand, Product, Item } from './types'


/** Decorate the class */
@idb('items', migration)
export class ItemData {
  /**
   * The `reads` decorator wraps the method with readonly mode Transaction, for objectStores by the names.
   * 
   * @param tx:(Proxied)IDBTransaction;
   *  which holds (proxied) IDBObjectStore with its name.
   * @returns Promise<RETURN> as the function return type. 
   */
  @reads('brands')
  public async getAllBrands({brands}:any) {
    // with in proxied object store instance, existing IDB methods are wrapped as Promise;
    //  that resolved at onSuccess, rejected at onError.
    return await brands.getAll();
  }

  /**
   * The `writes` decorator wraps the method with readwrite mode Transaction, for objectStores by the names.
   * 
   * @param tx:(Proxied)IDBTransaction;
   *  which holds (proxied) IDBObjectStore with its name.
   * @params brands:{title:string, ...}  as of migration determined.
   * @returns Promise<RETURN> as the function return type.
   */
  
  @writes('brands')
  public async setBrands({brands}:any, ...puts:Brand[]) {
    return await Promise.all(
      puts.map((b:Brand)=>brands.put(b))
    );
  }

  /**
   * multiple store associated transaction
   * @param tx
   * @param adds:Product[]
   * @returns 
   */
  @writes('brands', 'products')
  public async addProducts({brands, products}:any, ...adds:Product[]) {
    return await Promise.all(
      adds.map(async (p:Product)=>{
        const brand = await brands.get(p.brand);
        // add the product only when brand exists
        if(brand) {
          return await products.add(p);
        }
      })
    );
  }

  /**
   * simple store, to show IDBTransactionOption set.
   * @param tx
   * @param adds:Product[]
   * @returns 
   */
  @writes('items', { durability: 'default' })
  public async setItems({items}:any, ...its:Item[]) {
    return await Promise.all(
      its.map((it)=>items.add(it))
    );
  }

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
  @reads('items', { durability: 'relaxed'})
  public async *listItems(tx:any) {
    return tx.items.openGenerator();
  }

  /**
   * Just to show Raw IDBObjectStore comparison with Proxied Store
   * 
   * @param tx 
   * @returns 
   */
  @reads('items')
  public async justToShowRawStore(tx:any) {
    const rawItemStore:IDBObjectStore = tx.objectStore('items');
    const proxiedItemStore = tx.items;
    // rawItemStore(IDBObjectStore) !== proxiedItemStore(StoreProxy);
    // DO things with ordinary IDBObjectStore;
    return rawItemStore!==proxiedItemStore; // true
  }

  /**
   * Just to show `@trx` decorator using
   * @param tx 
   * @returns 
   */
  @trx(['items'], 'readonly', { durability: 'default' })
  public async justToShowTrxDecorator(tx:any) {
    return await tx.items.getAll();
  }

  /**
   * Clear all specified stores
   */
  @writes({durability: 'strict'}, 'brands', 'products', 'items')
  public async clearsAll(tx:any) {
    return await Promise.all([
      tx.brands.clear(),
      tx.products.clear(),
      tx.items.clear(),
    ]);
  }

}

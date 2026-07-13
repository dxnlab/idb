export default {
  version: 1,
  // object store definitions
  stores: {
    // Only keyPath string|string[] required for the store.
    brands: 'title',
    // To provide store options & index, an object can be used.
    products: {
      // store primary keyPath
      key: 'id',
      // store PK autoIncrement - defaults to false
      autoIncrement: true,
      // store indices
      index: {
        // Index can be determined only with keyPath string|string[], either.
        brand: 'brand',
        category: {
          key: 'category',
          // multiEntry option for the index, defaults false.
          multi: true,
        },
        product_code: {
          key: ['brand', 'code'],
          // unique option for the index. defaults false.
          unique: true
        }
      }
    },
    items: {
      key: 'sku',
      index: {
        product: ['product'],
        // undetermined attributes, i.e. "color", "stockCount" also can be set each records.
      }
    }
  },
  // If function `upgrade` explicitly determined, it priors than auto build.
  //  auto build, when triggered by a version change event - 
  //  reads concurrent obect store names then create store and its index, 
  //  determined by the corresponding option. Also, delete stores not presented.
  //  However, due to indexedDB specification, it is NOT POSSIBLE to update an index of existing store.
  // upgrade(db:IDBDatabase, request:IDBOpenDBRequest, event:IDBVersionChangeEvent) { }

  // The function `blocked` get triggered when onBlocked event fired.
  // blocked(request:IDBOpenDBRequest, event:IDBVersionChangeEvent) { } 
};
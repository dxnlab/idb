var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { idb, reads, writes, trx } from '.';
/** migration option */
import migration from './example.migration';
/** Decorate the class */
let ItemData = (() => {
    let _classDecorators = [idb('items', migration)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getAllBrands_decorators;
    let _setBrands_decorators;
    let _addProducts_decorators;
    let _setItems_decorators;
    let _listItems_decorators;
    let _justToShowRawStore_decorators;
    let _justToShowTrxDecorator_decorators;
    let _clearsAll_decorators;
    var ItemData = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getAllBrands_decorators = [reads('brands')];
            _setBrands_decorators = [writes('brands')];
            _addProducts_decorators = [writes('brands', 'products')];
            _setItems_decorators = [writes('items', { durability: 'default' })];
            _listItems_decorators = [reads('items', { durability: 'relaxed' })];
            _justToShowRawStore_decorators = [reads('items')];
            _justToShowTrxDecorator_decorators = [trx(['items'], 'readonly', { durability: 'default' })];
            _clearsAll_decorators = [writes({ durability: 'strict' }, 'brands', 'products', 'items')];
            __esDecorate(this, null, _getAllBrands_decorators, { kind: "method", name: "getAllBrands", static: false, private: false, access: { has: obj => "getAllBrands" in obj, get: obj => obj.getAllBrands }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setBrands_decorators, { kind: "method", name: "setBrands", static: false, private: false, access: { has: obj => "setBrands" in obj, get: obj => obj.setBrands }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _addProducts_decorators, { kind: "method", name: "addProducts", static: false, private: false, access: { has: obj => "addProducts" in obj, get: obj => obj.addProducts }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setItems_decorators, { kind: "method", name: "setItems", static: false, private: false, access: { has: obj => "setItems" in obj, get: obj => obj.setItems }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listItems_decorators, { kind: "method", name: "listItems", static: false, private: false, access: { has: obj => "listItems" in obj, get: obj => obj.listItems }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _justToShowRawStore_decorators, { kind: "method", name: "justToShowRawStore", static: false, private: false, access: { has: obj => "justToShowRawStore" in obj, get: obj => obj.justToShowRawStore }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _justToShowTrxDecorator_decorators, { kind: "method", name: "justToShowTrxDecorator", static: false, private: false, access: { has: obj => "justToShowTrxDecorator" in obj, get: obj => obj.justToShowTrxDecorator }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _clearsAll_decorators, { kind: "method", name: "clearsAll", static: false, private: false, access: { has: obj => "clearsAll" in obj, get: obj => obj.clearsAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ItemData = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        /**
         * The `reads` decorator wraps the method with readonly mode Transaction, for objectStores by the names.
         *
         * @param tx:(Proxied)IDBTransaction;
         *  which holds (proxied) IDBObjectStore with its name.
         * @returns Promise<RETURN> as the function return type.
         */
        async getAllBrands({ brands }) {
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
        async setBrands({ brands }, ...puts) {
            return await Promise.all(puts.map((b) => brands.put(b)));
        }
        /**
         * multiple store associated transaction
         * @param tx
         * @param adds:Product[]
         * @returns
         */
        async addProducts({ brands, products }, ...adds) {
            return await Promise.all(adds.map(async (p) => {
                const brand = await brands.get(p.brand);
                // add the product only when brand exists
                if (brand) {
                    return await products.add(p);
                }
            }));
        }
        /**
         * simple store, to show IDBTransactionOption set.
         * @param tx
         * @param adds:Product[]
         * @returns
         */
        async setItems({ items }, ...its) {
            return await Promise.all(its.map((it) => items.add(it)));
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
        async *listItems(tx) {
            return tx.items.openGenerator();
        }
        /**
         * Just to show Raw IDBObjectStore comparison with Proxied Store
         *
         * @param tx
         * @returns
         */
        async justToShowRawStore(tx) {
            const rawItemStore = tx.objectStore('items');
            const proxiedItemStore = tx.items;
            // rawItemStore(IDBObjectStore) !== proxiedItemStore(StoreProxy);
            // DO things with ordinary IDBObjectStore;
            return rawItemStore !== proxiedItemStore; // true
        }
        /**
         * Just to show `@trx` decorator using
         * @param tx
         * @returns
         */
        async justToShowTrxDecorator(tx) {
            return await tx.items.getAll();
        }
        /**
         * Clear all specified stores
         */
        async clearsAll(tx) {
            return await Promise.all([
                tx.brands.clear(),
                tx.products.clear(),
                tx.items.clear(),
            ]);
        }
        constructor() {
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return ItemData = _classThis;
})();
export { ItemData };

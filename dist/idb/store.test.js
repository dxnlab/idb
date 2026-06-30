import { expect } from "expect-webdriverio";
import { connect, disconnect, drop, withTx } from "./database";
import { createStore } from './database.migration';
import StoreProxy from "./store";
describe("StoreProxy wrapper tests", async () => {
    const dbname = "test_store_proxy_" + Date.now();
    let db;
    const storeName = "items";
    // @before 
    //  - migrate data/schema/items.simple database [items] with random unique name
    //  - add random items
    before(async () => {
        db = await connect(dbname, {
            version: 1,
            upgrade(idb) {
                createStore(idb, storeName, {
                    key: "id",
                    autoIncrement: true,
                    index: {
                        label: "label",
                        sku: {
                            key: ["product", "color", "size"],
                            unique: true,
                        },
                    },
                });
            },
        });
        const wr = withTx(db, { stores: [storeName], mode: "readwrite" });
        await wr(async (tx) => {
            await tx.items.add({ label: "item1", product: "A", color: "red", size: "M" });
            await tx.items.add({ label: "item2", product: "B", color: "blue", size: "L" });
        });
    });
    // @after - drop the migrated database
    after(async () => {
        disconnect(db);
        await drop(dbname);
    });
    // within a single transaction for readwrite items
    it("readwrite transaction capabilities", async () => {
        const rw = withTx(db, { stores: [storeName], mode: "readwrite" });
        await rw(async (tx) => {
            const items = tx.items;
            //   - create store proxy for both
            expect(items).toBeInstanceOf(StoreProxy);
            expect(items.store).toBeInstanceOf(IDBObjectStore);
            //   - test for each, properties & methods are exist accordingly
            expect(items.name).toBe(storeName);
            expect(items.keyPath).toBe("id");
            expect(items.autoIncrement).toBe(true);
            expect(items.transaction).toBe(tx);
            expect(items.indexNames.contains("label")).toBe(true);
            //   - test add
            const addReq = items.add({ label: "item3", product: "C", color: "green", size: "S" });
            expect(addReq).toBeInstanceOf(Promise);
            const addedId = await addReq;
            expect(addedId).toBeDefined();
            //   - test put
            const putReq = items.put({ id: addedId, label: "item3_updated", product: "C", color: "green", size: "S" });
            expect(putReq).toBeInstanceOf(Promise);
            await putReq;
            //   - test get
            const getReq = items.get(addedId);
            expect(getReq).toBeInstanceOf(Promise);
            const fetched = await getReq;
            expect(fetched.label).toBe("item3_updated");
            //   - test getAll
            const allReq = items.getAll();
            expect(allReq).toBeInstanceOf(Promise);
            const allItems = await allReq;
            expect(allItems.length).toBeGreaterThanOrEqual(3);
            //   - test getAllKeys
            const keysReq = items.getAllKeys();
            expect(keysReq).toBeInstanceOf(Promise);
            const allKeys = await keysReq;
            expect(allKeys.length).toBe(allItems.length);
            //   - test openCursor
            const cursorReq = items.openCursor();
            expect(cursorReq).toBeInstanceOf(Promise);
            let cursor = await cursorReq;
            expect(cursor).toBeDefined();
            //   - test openKeyCursor
            const keyCursorReq = items.openKeyCursor();
            expect(keyCursorReq).toBeInstanceOf(Promise);
            let keyCursor = await keyCursorReq;
            expect(keyCursor).toBeDefined();
            //   - test openGenerator
            let genCount = 0;
            for await (const c of items.openGenerator()) {
                genCount++;
            }
            expect(genCount).toBe(allKeys.length);
            //   - test valueGenerator
            let valCount = 0;
            for await (const v of items.valueGenerator()) {
                valCount++;
            }
            expect(valCount).toBe(allKeys.length);
            //   - test keyGenerator
            let keyCount = 0;
            for await (const k of items.keyGenerator()) {
                keyCount++;
            }
            expect(keyCount).toBe(allKeys.length);
            //   - test index
            const idx = items.index("label");
            expect(idx).toBeDefined();
            expect(idx.name).toBe("label");
            //   - test delete
            const delReq = items.delete(addedId);
            expect(delReq).toBeInstanceOf(Promise);
            await delReq;
            const fetchedAfterDel = await items.get(addedId);
            expect(fetchedAfterDel).toBeUndefined();
        });
    });
    // within a single transaction for readonly items
    it("readonly transaction capabilities", async () => {
        const ro = withTx(db, { stores: [storeName], mode: "readonly" });
        await ro(async (tx) => {
            const items = tx.items;
            //   - test get
            const fetched = await items.get(1);
            expect(fetched).toBeDefined();
            //   - test getAll
            const allItems = await items.getAll();
            expect(allItems.length).toBeGreaterThanOrEqual(2);
            //   - test getAllKeys
            const allKeys = await items.getAllKeys();
            expect(allKeys.length).toBeGreaterThanOrEqual(2);
            //   - test openCursor
            const cursor = await items.openCursor();
            expect(cursor).toBeDefined();
            //   - test openKeyCursor
            const keyCursor = await items.openKeyCursor();
            expect(keyCursor).toBeDefined();
            //   - test openGenerator
            let genCount = 0;
            for await (const c of items.openGenerator()) {
                genCount++;
            }
            expect(genCount).toBe(allKeys.length);
            //   - test valueGenerator
            let valCount = 0;
            for await (const v of items.valueGenerator()) {
                valCount++;
            }
            expect(valCount).toBe(allKeys.length);
            //   - test keyGenerator
            let keyCount = 0;
            for await (const k of items.keyGenerator()) {
                keyCount++;
            }
            expect(keyCount).toBe(allKeys.length);
            //   - test index
            const idx = items.index("label");
            expect(idx).toBeDefined();
        });
        return true;
    });
});

import { expect } from "expect-webdriverio";
import { connect } from "./database";
import { createStore } from './database.migration';
import withTx from './database.transaction';
import StoreProxy from "./store";

describe("StoreProxy wrapper tests", async () => {
  const dbname = "test_store_proxy_" + Date.now();
  let db: Promise<IDBDatabase>;
  const storeName = "items";

  // @before 
  //  - migrate data/schema/items.simple database [items] with random unique name
  //  - add random items
  beforeAll(async () => {
    db = connect(dbname, {
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

    const wr = withTx(async ()=>(await db).transaction([storeName], 'readwrite'));
    await wr(async (tx) => {
      await tx.items.add({ label: "item1", product: "A", color: "red", size: "M" });
      await tx.items.add({ label: "item2", product: "B", color: "blue", size: "L" });
    });
  });

  // @after - drop the migrated database
  afterAll(async () => {
    await disconnect(db);
    await drop(dbname);
  });


  // within a single transaction for readwrite items
  await it("readwrite transaction capabilities", async () => {
    db = connect(dbname);
    const rw = withTx(async ()=>(await db).transaction([storeName], 'readwrite'));
    await rw(async (tx) => {
      const items = tx.items;
      //   - create store proxy for both
      expect(items).toBeInstanceOf(StoreProxy);
      expect(items.store).toBeInstanceOf(IDBObjectStore);
      console.log('items store pass');

      //   - test for each, properties & methods are exist accordingly
      expect(items.name).toBe(storeName);
      expect(items.keyPath).toBe("id");
      expect(items.autoIncrement).toBe(true);
      expect(items.transaction).toBe(tx);
      expect(items.indexNames.contains("label")).toBe(true);
      console.log('store props & methods pass');

      //   - test add
      const addReq = items.add({ label: "item3", product: "C", color: "green", size: "S" });
      expect(addReq).toBeInstanceOf(Promise);
      const addedId = await addReq;
      expect(addedId).toBeDefined();
      console.log('add an item pass');

      //   - test put
      const putReq = items.put({ id: addedId, label: "item3_updated", product: "C", color: "green", size: "S" });
      expect(putReq).toBeInstanceOf(Promise);
      console.log('put an item pass', await putReq);

      //   - test get
      const getReq = items.get(addedId);
      expect(getReq).toBeInstanceOf(Promise);
      const fetched = await getReq;
      expect(fetched.label).toBe("item3_updated");
      console.log('get the item pass')

      //   - test getAll
      const allReq = items.getAll();
      expect(allReq).toBeInstanceOf(Promise);
      const allItems = await allReq;
      expect(allItems.length).toBeGreaterThanOrEqual(3);
      console.log('getAll items pass');

      //   - test getAllKeys
      const keysReq = items.getAllKeys();
      expect(keysReq).toBeInstanceOf(Promise);
      const allKeys = await keysReq;
      expect(allKeys.length).toBe(allItems.length);
      console.log('getAllKeys pass');

      //   - test openCursor
      const cursorReq = items.openCursor();
      expect(cursorReq).toBeInstanceOf(Promise);
      let cursor = await cursorReq;
      expect(cursor).toBeDefined();
      console.log('open cursor pass');

      //   - test openKeyCursor
      const keyCursorReq = items.openKeyCursor();
      expect(keyCursorReq).toBeInstanceOf(Promise);
      let keyCursor = await keyCursorReq;
      expect(keyCursor).toBeDefined();
      console.log('openKeyCursor pass');

      //   - test openGenerator
      let genCount = 0;
      for await (const c of items.openGenerator()) {
        console.log(`-`, c);
        genCount++;
      }
      expect(genCount).toBe(allKeys.length);
      console.log('openGenerator pass');

      //   - test valueGenerator
      let valCount = 0;
      for await (const v of items.valueGenerator()) {
        console.log(`v`, v);
        valCount++;
      }
      expect(valCount).toBe(allKeys.length);
      console.log('valueGenerator pass');

      //   - test keyGenerator
      let keyCount = 0;
      for await (const k of items.keyGenerator()) {
        console.log('k', k);
        keyCount++;
      }
      expect(keyCount).toBe(allKeys.length);
      console.log('keyGenerator pass');

      //   - test index
      const idx = items.index("label");
      expect(idx).toBeDefined();
      expect(idx.name).toBe("label");
      console.log('index proxy pass');

      //   - test delete
      const delReq = items.delete(addedId);
      expect(delReq).toBeInstanceOf(Promise);
      await delReq;
      const fetchedAfterDel = await items.get(addedId);
      expect(fetchedAfterDel).toBeUndefined();
      console.log('delete the item pass');
    });
  });

  // within a single transaction for readonly items
  await it("readonly transaction capabilities", async () => {
    db = connect(dbname);
    const ro = withTx(async ()=>(await db).transaction([storeName], 'readonly'));
    await ro(async (tx) => {
      const items = tx.items;
      //   - test get
      const fetched = await items.get(1);
      expect(fetched).toBeDefined();
      console.log('get an item pass');

      //   - test getAll
      const allItems = await items.getAll();
      expect(allItems.length).toBeGreaterThanOrEqual(2);
      console.log('getAll pass');

      //   - test getAllKeys
      const allKeys = await items.getAllKeys();
      expect(allKeys.length).toBeGreaterThanOrEqual(2);
      console.log('getAllKeys pass');

      //   - test openCursor
      const cursor = await items.openCursor();
      expect(cursor).toBeDefined();
      console.log('openCursor pass');

      //   - test openKeyCursor
      const keyCursor = await items.openKeyCursor();
      expect(keyCursor).toBeDefined();
      console.log('openKeyCursor pass');

      //   - test openGenerator
      let genCount = 0;
      for await (const c of items.openGenerator()) {
        console.log(c);
        genCount++;
      }
      expect(genCount).toBe(allKeys.length);
      console.log('openGenerator pass');

      //   - test valueGenerator
      let valCount = 0;
      for await (const v of items.valueGenerator()) {
        valCount++;
      }
      expect(valCount).toBe(allKeys.length);
      console.log('valueGenerator pass');

      //   - test keyGenerator
      let keyCount = 0;
      for await (const k of items.keyGenerator()) {
        keyCount++;
      }
      expect(keyCount).toBe(allKeys.length);
      console.log('keyGenerator pass');

      //   - test index
      const idx = items.index("label");
      expect(idx).toBeDefined();
      console.log('index proxy pass');
    });
    return true;
  });
});
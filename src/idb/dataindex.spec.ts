import { expect } from "expect-webdriverio";
import { connect, createStore, disconnect, drop, transact } from "./database";
import StoreProxy from "./store";
import IndexProxy from "./dataindex";

describe("IndexProxy wrapper tests", async () => {
  const dbname = "test_index_proxy_" + Date.now();
  let db: IDBDatabase;
  const storeName = "items";

  // @before 
  //  - migrate data/schema/items.simple database [items] with random unique name
  //  - add random items
  beforeAll(async () => {
    db = await connect(dbname, {
      version: 1,
      upgrade(idb) {
        createStore(idb, storeName, {
          key: "id",
          autoIncrement: true,
          index: {
            title: "title",
            color_size: {
              key: ["color", "size"],
            },
            sku: {
              key: "sku",
              unique: true,
            },
          },
        });
      },
    });

    const wr = transact(db, [storeName], "readwrite");
    await wr(async ({ items }) => {
      await items.add({ title: "Item A", color: "red", size: "M", sku: "SKU001" });
      await items.add({ title: "Item B", color: "blue", size: "L", sku: "SKU002" });
      await items.add({ title: "Item A", color: "red", size: "S", sku: "SKU003" });
    });
  });

  // @after - drop the migrated database
  afterAll(async () => {
    await disconnect(db);
    await drop(dbname);
  });

  it("IndexProxy methods and properties", async () => {
    const ro = transact(db, [storeName], "readonly");
    await ro(async ({ items }) => {
      //   - create store proxy for both
      //     ; for each, test properties and methods accordingly (neglect updating when mode readonly)
      
      const idxTitle = items.index("title");
      expect(idxTitle).toBeInstanceOf(IndexProxy);
      expect(idxTitle.index).toBeInstanceOf(IDBIndex);
      
      // properties
      expect(idxTitle.name).toBe("title");
      expect(idxTitle.keyPath).toBe("title");
      expect(idxTitle.objectStore.name).toBe(storeName);
      
      //    - within readonly transaction
      //      - test by title
      const aItems = await idxTitle.getAll("Item A");
      expect(aItems.length).toBe(2);
      
      const firstAKey = await idxTitle.getKey("Item A");
      expect(firstAKey).toBeDefined();

      //      - test by color, size
      const idxColorSize = items.index("color_size");
      const redMItems = await idxColorSize.getAll(["red", "M"]);
      expect(redMItems.length).toBe(1);
      expect(redMItems[0].sku).toBe("SKU001");

      //      - test by sku
      const idxSku = items.index("sku");
      expect(idxSku.unique).toBe(true);
      
      const sku2Item = await idxSku.get("SKU002");
      expect(sku2Item).toBeDefined();
      expect(sku2Item.title).toBe("Item B");
      
      // Open cursor on index
      const cursor = await idxSku.openCursor();
      expect(cursor).toBeDefined();
      
      // Generator test
      let genCount = 0;
      for await (const val of idxTitle.valueGenerator()) {
        genCount++;
      }
      expect(genCount).toBe(3);
    });

    return true;
  });
});

import { expect } from "expect-webdriverio";
import { setup, teardown, trx } from './tests';
import StoreProxy from "./store";
import IndexProxy from "./dataindex";

describe("IndexProxy wrapper tests", async () => {
  let db: IDBDatabase;
  const storeName = "items";

  // @before 
  //  - migrate data/schema/items.simple database [items] with random unique name
  //  - add random items
  before(async () => {
    db = await setup(1, {
      [storeName]: {
        key: 'id',
        autoIncrement: true,
        index: {
          title: 'title',
          color_size: {
            key: ['color', 'size'],
          },
          sku: {
            unique: true,
          }
        }
      }
    }, {
      [storeName]: [
        { title: "Item A", color: "red", size: "M", sku: "SKU001" },
        { title: "Item B", color: "blue", size: "L", sku: "SKU002" },
        { title: "Item A", color: "red", size: "S", sku: "SKU003" },
      ]
    });
  });

  // @after - drop the migrated database
  after(async () => {
    await teardown(db);
  });

  const wraps = async (fn)=>await trx(db, { stores: [storeName], mode: 'readonly'}, fn);

  it("IndexProxy methods and properties", async () => {
    await wraps(async ({ items }) => {
      const idxTitle = items.title;
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
    });
  });

  it('tests openCursor', async ()=>{
    await wraps(async ({items})=>{
      // Open cursor on index
      const idxSku = items.sku;
      let cCount = 0;
      const result = await new Promise((resolve, reject)=>{
        idxSku.openCursor(
          (cursor) => {
            if(cursor) {
              console.log(cursor);
              cCount += 1;
              // THIS MUST BE CONTINUED
              cursor.continue();
            } 
            // when it reached its end
            else {
              resolve(cCount);
            }
          },
          { onError: reject }
        );
      });
      expect(result).toBeGreaterThan(0);
    });
  });

  it('tests generator', async ()=>{
    await wraps(async ({items})=>{
      const idx = items.title;
      let cnt = 0;
      for await (const val of idx.valueGenerator()) {
        console.log({cnt, val});
        cnt += 1;
      }
      expect(cnt).toBeGreaterThan(0);
    });
  });
});

import { expect } from "expect-webdriverio";
import { cmp, connect, disconnect, drop, showDatabases, transaction } from "./database";
import { createStore } from "./database.migration";
import StoreProxy from "./store";

/** 
 * database wrapper (database.ts) specification test
 * 
 */
describe('database wrapper tests', async ()=>{
  it('IDBFactory.cmp', async ()=>{
    const rs = cmp(1, 2);
    expect(rs).not.toBe(0);
  });

  it('IDBFactory.databases', async ()=> {
    const names = await showDatabases();
    expect(names).toBeDefined();
    expect(names.length).toBeGreaterThanOrEqual(0);
  });

  
  // test connect
  const dbname = 'tests';
  it('IDBFactory.open', async ()=>{
    const db = await connect(dbname);
    expect(db).toBeInstanceOf(IDBDatabase);
    const dbs = await showDatabases();
    expect(dbs.find(({name, version})=>name===dbname && version<=1)).toBeTruthy();
    db.close();
  });

  describe('with migration', async ()=>{
    let db:IDBDatabase;
    const migrationV2 = {
      nodes: 'id',
      links: ['src','trg'],
      items: {
        key: 'id',
        autoIncrement: true,
        index: {
          order: 'order',
          multi: {
            key: 'multi',
            multi: true,
          },
          uniq: {
            key: 'email',
            unique: true,
          }
        }
      }
    };
    before(async ()=>{
      let upgradeCalled = 0;
      db = await connect(dbname, {
        version: 2,
        upgrade(idb){
          upgradeCalled += 1;
          expect(idb).toBeInstanceOf(IDBDatabase);
          Object.entries(migrationV2).forEach(([store, storeOption])=>{
            const st = createStore(idb, store, storeOption as any);
            expect(st).toBeInstanceOf(IDBObjectStore);
            const index = Array.from(st.indexNames);
            console.log(`${store} - ${index.join(', ')}`);
          });
        }
      });
    });

    it('test write then read', async ()=>{
      const stores = Array.from(Object.keys(migrationV2))
      const writes = transaction(db, {stores, mode: 'readwrite'});
      expect(writes).toBeDefined();
      expect(typeof writes === 'function').toBeTruthy();
      const reads = transaction(db, {stores});
      expect(reads).toBeDefined();
      expect(typeof reads === 'function').toBeTruthy();

      const wrs = writes(async (tx)=>{
        expect(tx).toBeInstanceOf(IDBTransaction);
        expect(tx.nodes).toBeInstanceOf(StoreProxy);
        ['one','two','three'].forEach((n)=>{
          tx.nodes.add({id: n});
        });
        expect(tx.links).toBeInstanceOf(StoreProxy);
        await tx.links.add({ src: 'one', trg: 'two', });
        await tx.links.add({ src: 'two', trg: 'three', });
        await tx.links.add({ src: 'three', trg: 'one', });
      });
      expect(wrs).toBeInstanceOf(Promise);
      expect(await wrs).toBe(undefined);

      const rrs = await reads(async (tx)=>{
        console.log('reads start');
        expect(tx).toBeInstanceOf(IDBTransaction);
        expect(tx.nodes).toBeInstanceOf(StoreProxy);

        console.log('before get');
        const ns = await tx.nodes.getAll();
        expect(ns).toBeDefined();
        expect(ns.length).toBeGreaterThanOrEqual(3);
        return ns;
      });
      // expect(rrs).toBeDefined();
    });

    after(async ()=>{
      disconnect(db);
      await drop(dbname);

      expect(await showDatabases()).not.toContain({
        name: dbname,
        version: db.version,
      });
    });
  });
});
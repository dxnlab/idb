import { expect } from "expect-webdriverio";
import iDB from "./database";
import { createStore } from "./database.migration";
import StoreProxy from "./store";

/** 
 * database wrapper (database.ts) specification test
 * 
 */
describe('database wrapper tests', async ()=>{
  it('IDBFactory.cmp', async ()=>{
    const rs = iDB.cmp(1, 2);
    expect(rs).not.toBe(0);
    console.log('cmp passed');
  });

  it('IDBFactory.databases', async ()=> {
    const names = await iDB.showDatabases(true);
    expect(names).toBeDefined();
    expect(names.length).toBeGreaterThanOrEqual(0);
    console.log('showDatabases passed');
  });

  
  // test connect
  const dbname = 'tests';
  it('IDBFactory.open', async ()=>{
    const idb = iDB.open(dbname);
    const db = await idb.connect();
    expect(db).toBeInstanceOf(IDBDatabase);
    const dbs = await iDB.showDatabases(true);
    expect(dbs.find(({name, version})=>name===dbname && version<=1)).toBeTruthy();
    await db.close();
    console.log('open passed');
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
      db = iDB.open(dbname, {
        version: Date.now(),
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
      await db.connected();
    });

    // after(async ()=>{
    //   console.log('after starts');
    //   await db.disconnect();
    //   await drop(dbname);

    //   expect(await iDB.showDatabases(true)).not.toContain({
    //     name: dbname,
    //     version: db.version,
    //   });
    // });

    it('test write then read', async ()=>{
      console.log('transaction test startes');
      const stores = Array.from(Object.keys(migrationV2));
      expect(stores.length).toBeGreaterThan(0);
      console.log('stores', stores);

      const writes = db.transaction(stores, 'readwrite');
      expect(writes).toBeDefined();
      expect(typeof writes === 'function').toBeTruthy();
      const reads = db.transaction(stores);
      expect(reads).toBeDefined();
      expect(typeof reads === 'function').toBeTruthy();

      const wrs = writes(async (tx)=>{
        console.info('write tx start');
        // await tx.nodes.adds(['one','two','three'].map((id)=>({id,})));
        console.info('write nodes done');
        // await tx.links.add({ src: 'one', trg: 'two', });
        // await tx.links.add({ src: 'two', trg: 'three', });
        // await tx.links.add({ src: 'three', trg: 'one', });
        console.info('write links done');
        return true;
      });
      expect(wrs).toBeInstanceOf(Promise);
      expect(await wrs).toBe(undefined);
      console.log('writes tx done');

      // const rrs = await reads(async (tx)=>{
      //   console.log('reads start');

      //   console.log('before get');
      //   const ns = await tx.nodes.getAll();
      //   console.log(ns);
      //   return ns;
      //   return [];
      // });
      // expect(rrs).toBeInstanceOf(Promise);
      // const read = await rrs;
      // expect(read).toBeInstanceOf(Array);
      // expect(read.length).toBeGreatherThanOrEqual(3);
      // console.log('reads tx done');

      return true;
    });

    
  });
});
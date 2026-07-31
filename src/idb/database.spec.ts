import { expect } from 'expect-webdriverio'
import { cmp, showDatabases, drop, connector, connect } from "./database";
import { createStore } from "./database.migration";

/** 
 * database wrapper (database.ts) specification test
 * 
 */
describe('database wrapper tests', async ()=>{
  it('IDBFactory.cmp', async ()=>{
    const rs = cmp(1, 2);
    expect(rs).not.toBe(0);
    console.log('cmp passed');
  });

  it('IDBFactory.databases', async ()=> {
    const names = await showDatabases(true);
    expect(names).toBeDefined();
    expect(names.length).toBeGreaterThanOrEqual(0);
    console.log('showDatabases passed');
  });

  
  // test connect
  const dbname = 'tests';
  const overloadMethods = {
    stores: 'get',
    disconnect: 'value',
    txWrapper: 'value'
  };
  it('IDBFactory.connector', async ()=>{
    const trial = connector();
    expect(typeof trial).toBe('function');
    const idb = await trial(dbname);
    expect(idb).toBeInstanceOf(IDBDatabase);
    idb.close();
  });
  it('IDBFactory.connect', async ()=>{
    const db = await connect(dbname);
    expect(db).toBeInstanceOf(IDBDatabase);
    Object.entries(overloadMethods).forEach(([fn, desc])=>{
      const prop = Object.getOwnPropertyDescriptor(db, fn);
      expect(prop).toBeDefined();
      expect(prop[desc]).toBeDefined();
      expect(typeof prop[desc]).toBe('function');
    });
    
    const dbs = await showDatabases(true);
    expect(dbs.find(({name, version})=>name===dbname && version<=1)).toBeTruthy();
    await db.disconnect();
    console.log('connect passed');
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
      // create the database
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
            console.log(`[IDB Store] create ${store} ${index.join(', ')}`);
          });
        }
      });
      expect(db).toBeDefined();
      expect(db).toBeInstanceOf(IDBDatabase);
      console.log('beforeHook done');
    });

    after(async ()=>{
      
      // completes to drop
      db.disconnect();
      await drop(dbname);

      expect(await showDatabases()).not.toContain({
        name: dbname,
        version: db.version,
      });
    });

    it('test write then read', async ()=>{
      const stores = Array.from(Object.keys(migrationV2));
      expect(stores.length).toBeGreaterThan(0);

      const writes = db.txWrapper(stores, 'readwrite');
      expect(writes).toBeDefined();
      expect(typeof writes === 'function').toBeTruthy();
      const reads = db.txWrapper(stores);
      
      expect(reads).toBeDefined();
      expect(typeof reads === 'function').toBeTruthy();
      
      const wrs = writes(async (tx)=>{
        // adding nodes
        await tx.nodes.add({id: 'one'});
        await tx.nodes.add({id: 'two'});
        await tx.nodes.add({id: 'three'});
        console.log('nodes added');

        // adding links
        await tx.links.add({ src: 'one', trg: 'two', });
        await tx.links.add({ src: 'two', trg: 'three', });
        await tx.links.add({ src: 'three', trg: 'one', });
        console.log('links added');
      });
      expect(wrs).toBeInstanceOf(Promise);
      expect(await wrs).toBe(undefined);
      

      const rrs = reads(async (tx)=>{
        const ns = await tx.nodes.getAll();
        return ns;
      });
      expect(rrs).toBeInstanceOf(Promise);
      const read = await rrs;
      expect(read).toBeInstanceOf(Array);
      expect(read.length).toBeGreaterThanOrEqual(3);
    });
  });
});
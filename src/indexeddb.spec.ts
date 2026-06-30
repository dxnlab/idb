/**
 * IndexedDB functional tests
 * @refer https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 * 
 * Coverage:
 * - [ ] IDBFactory
 *   - [x] open
 *   - [x] databases
 *   - [x] deleteDatabase
 *   - [ ] cmp
 * - [ ] IDBDatabase
 *   - [x] name
 *   - [x] version
 *   - [x] onupgradeneeded
 *   - [x] close
 *   - [x] objectStoreNames
 *   - [x] createObjectStore
 *   - [x] deleteObjectStore
 *   - [x] transaction
 * - [ ] IDBTransaction
 *   - [x] mode (readonly, readwrite)
 *   - [x] oncomplete
 *   - [x] onerror
 *   - [x] objectStore
 *   - [ ] abort
 *   - [ ] commit (newer browsers)
 * - [ ] IDBObjectStore
 *   - [x] add
 *   - [x] put
 *   - [x] getAll
 *   - [x] getAllKeys
 *   - [x] count
 *   - [x] clear
 *   - [x] openCursor
 *   - [x] openKeyCursor
 *   - [x] createIndex
 *   - [x] deleteIndex
 *   - [ ] get
 *   - [ ] delete
 *   - [ ] getKey
 * - [ ] IDBIndex
 *   - [x] getAll
 *   - [x] properties (multiEntry, unique)
 *   - [ ] get
 *   - [ ] getAllKeys
 *   - [ ] count
 *   - [ ] getKey
 *   - [ ] openCursor
 *   - [ ] openKeyCursor
 * - [ ] IDBKeyRange
 *   - [ ] only
 *   - [ ] bound
 *   - [ ] lowerBound
 *   - [ ] upperBound
 * - [ ] IDBCursor
 *   - [ ] continue
 *   - [ ] continuePrimaryKey
 *   - [ ] delete
 *   - [ ] update
 *   - [ ] direction (next, prev, nextunique, prevunique)
 * - [ ] Events & Error Handling
 *   - [ ] onblocked (open, deleteDatabase)
 *   - [ ] onversionchange (IDBDatabase)
 *   - [ ] onabort (IDBTransaction)
 * 
 */

import { expect } from 'expect-webdriverio';
// dataset provided from simple network
const storeDefinitions = {
  nodes: {
    keyPath: 'id'
  },
  links: {
    keyPath: 'id',
    autoIncrement: true,
  },
  items: {
    keyPath: 'id'
  }
}
const storeIndexDefinitions = {
  nodes: {},
  links: {
    link_source: ['src', { multiEntry: true }],
    link_target: ['trg', { multiEntry: true }],
    link_unique: [['src','trg'], { unique: true }],
  },
  items: {
    title: ['title']
  }
}

// build a random token for unique database names
const randomToken = () => {
  const n = Date.now() + Math.random();
  return n.toString(36);
}

// Helper: compare boolean values
const compareBoolean = (left:any, right:any) => {
  const leftBool = !!left;
  const rightBool = !!right;
  expect(leftBool).toBe(rightBool);
}

// Helper: compare keyPath of an object store or index
type keyPathObject = { keyPath:string|Array<string> }
const compareKeyPathOf = (expected:keyPathObject, actual:keyPathObject) => {
  const expectedKeyPath = expected?.keyPath;
  const actualKeyPath = actual?.keyPath; 
  if(Array.isArray(expectedKeyPath)) {
    expect(Array.isArray(actualKeyPath)).toBe(true);
    expectedKeyPath.forEach((el)=>expect(actualKeyPath).toContain(el));
  } else {
    expect(actualKeyPath).toBe(expectedKeyPath);
  }
}

describe('Test indexeddb presence', () => {
  const dbName = `testdb-${randomToken()}`;
  
  // Foundational test: verify IndexedDB is available in the window scope
  it('should have indexeddb in the global scope', () => {
    expect(window.indexedDB).toBeDefined();
    expect(typeof window.indexedDB).toBe('object');
    expect(window.indexedDB).toBeInstanceOf(IDBFactory);
  });

  // Environment test: verify IndexedDB is available within a Web Worker
  it('should have indexedDB in a Web Worker', async () => {
    const workerScript = `
      self.onmessage = () => {
        const supported = typeof indexedDB !== 'undefined';
        const isObject = typeof indexedDB === 'object';
        const isIDBFactory = typeof IDBFactory !== 'undefined' && indexedDB instanceof IDBFactory;
        self.postMessage({ supported, isObject, isIDBFactory });
      };
    `;
    const blob = new Blob([workerScript], { type: 'text/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    
    const response: any = await new Promise((resolve) => {
      worker.onmessage = (e) => resolve(e.data);
      worker.postMessage('check');
    });
    
    expect(response.supported).toBe(true);
    expect(response.isObject).toBe(true);
    expect(response.isIDBFactory).toBe(true);
    worker.terminate();
  });

  // Functional tests for IndexedDB features
  describe('Test indexeddb features', () => {
    const idb = window.indexedDB;
  
    // Feature: idb.databases() - list existing databases
    it('should list databases', async () => {
      const databases = await idb.databases();
      expect(Array.isArray(databases)).toBe(true);
      // Ensure our test database doesn't exist yet
      expect(databases.find(db => db.name === dbName)).toBeUndefined();
    });
    

    // Feature: idb.open() v1 - initial database creation and migration
    describe(`with database ${dbName}:v1`, () => {
      const checkIdbInstance = (db: IDBDatabase) => {
        expect(db).toBeInstanceOf(IDBDatabase);
        expect(db.name).toBe(dbName);
      };

      // Test initial open and onupgradeneeded event
      it('should open database and trigger onupgradeneeded', async () => {
        const request = idb.open(dbName, 1);
        let upgradeCalled = false;
        
        const upgradePromise = new Promise<void>((resolve) => {
          request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            upgradeCalled = true;
            const db = (event?.target as IDBOpenDBRequest)?.result;
            checkIdbInstance(db);
            expect(event).toBeInstanceOf(IDBVersionChangeEvent);
            expect(event.type).toBe('upgradeneeded');
            expect(event.oldVersion).toBe(0);
            expect(event.newVersion).toBe(1);
            // 2-1. verify objectStores are initially empty
            expect(db.objectStoreNames).toBeInstanceOf(DOMStringList);
            expect(db.objectStoreNames.length).toBe(0);
            resolve();
          };
        });

        const resultPromise = new Promise<IDBDatabase>((resolve, reject) => {
          request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
          request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
        });

        const db = await resultPromise;
        await upgradePromise;
        
        expect(upgradeCalled).toBe(true);
        checkIdbInstance(db);

        // 2-2. verify database now appears in databases() list
        const databases = await idb.databases();
        expect(databases.find(db => db.name === dbName)).toBeDefined();

        // 2-3. verify objectStoreNames is still empty after migration
        expect(db.objectStoreNames.length).toBe(0);
        
        db.close();
      });
    });

    // Feature: idb.open() v2 - schema modification and object store creation
    describe(`with database ${dbName}:v2`, () => {
      // 3-1. Add IDBObjectStores and IDBIndices
      it('should upgrade to v2 and create object stores', async () => {
        const request = idb.open(dbName, 2);
        
        // Define stores and indices for v2 migration
        const upgradePromise = new Promise<void>((resolve) => {
          request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const db = (event.target as IDBOpenDBRequest).result;
            
            // Perform schema migration
            Object.entries(storeDefinitions).forEach(([store, option]) => {
              const theStore = db.createObjectStore(store, option);
              const indexDefs = storeIndexDefinitions[store];
              Object.entries(indexDefs).forEach(([index, indexOptions]) => {
                theStore.createIndex(index, ...indexOptions);
              });
            });
            resolve();
          };
        });

        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
          request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
        });
        await upgradePromise;

        // 3-2. Verify created object stores
        const storeNames = db.objectStoreNames;
        expect(storeNames.length).toBe(3);
        expect(storeNames).toContain('nodes');
        expect(storeNames).toContain('links');
        expect(storeNames).toContain('items');

        // Verify store and index properties via transaction
        const transaction = db.transaction(['nodes', 'links', 'items'], 'readonly');
        
        // Verify 'nodes' store properties
        const nodesStore = transaction.objectStore('nodes');
        compareKeyPathOf({ keyPath: 'id' }, nodesStore);
        compareBoolean(false, nodesStore.autoIncrement);

        // Verify 'links' store and its indices
        const linksStore = transaction.objectStore('links');
        compareKeyPathOf({ keyPath: 'id' }, linksStore);
        compareBoolean(true, linksStore.autoIncrement);
        
        const sourceIndex = linksStore.index('link_source');
        compareKeyPathOf({ keyPath: 'src' }, sourceIndex);
        compareBoolean(true, sourceIndex.multiEntry);

        const uniqueIndex = linksStore.index('link_unique');
        compareKeyPathOf({ keyPath: ['src', 'trg'] }, uniqueIndex);
        compareBoolean(true, uniqueIndex.unique);

        db.close();
      });

      // Feature: Data operations - CRUD and querying
      it('should perform data operations in v2', async () => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = idb.open(dbName, 2);
          request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
          request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
        });

        // 3-3. store.add() - add a single record
        const addDefaultNode = new Promise<void>((resolve, reject) => {
          const tx = db.transaction('nodes', 'readwrite');
          const store = tx.objectStore('nodes');
          const req = store.add({ id: 'default', data: 'some data' });
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
        await addDefaultNode;

        // 3-4. Multiple store.add() in a single transaction
        const addMoreNodes = new Promise<void>((resolve, reject) => {
          const tx = db.transaction('nodes', 'readwrite');
          const store = tx.objectStore('nodes');
          store.add({ id: 'alpha' });
          store.add({ id: 'beta' });
          store.add({ id: 'gamma' });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        await addMoreNodes;

        // 3-5. store.put() - update an existing record
        const putDefaultNode = new Promise<void>((resolve, reject) => {
          const tx = db.transaction('nodes', 'readwrite');
          const store = tx.objectStore('nodes');
          const req = store.put({ id: 'default', data: 'updated data' });
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
        await putDefaultNode;

        // 3-6. store.getAll() - retrieve all records from a store
        const allNodes = await new Promise<any[]>((resolve, reject) => {
          const tx = db.transaction('nodes', 'readonly');
          const store = tx.objectStore('nodes');
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        expect(allNodes.length).toBe(4);

        // 3-7. store.add() with auto-incrementing keys
        const addLinks1 = new Promise<void>((resolve, reject) => {
          const tx = db.transaction('links', 'readwrite');
          const store = tx.objectStore('links');
          store.add({ src: 'alpha', trg: 'beta' });
          store.add({ src: 'beta', trg: 'gamma' });
          store.add({ src: 'gamma', trg: 'alpha' });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        await addLinks1;

        // 3-8. More store.add() operations
        const addLinks2 = new Promise<void>((resolve, reject) => {
          const tx = db.transaction('links', 'readwrite');
          const store = tx.objectStore('links');
          store.add({ src: 'beta', trg: 'alpha' });
          store.add({ src: 'gamma', trg: 'beta' });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        await addLinks2;

        // 3-9. index.getAll() - query links by source index
        const alphaLinks = await new Promise<any[]>((resolve, reject) => {
          const tx = db.transaction('links', 'readonly');
          const store = tx.objectStore('links');
          const index = store.index('link_source');
          const req = index.getAll('alpha');
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        expect(alphaLinks.length).toBe(1);
        expect(alphaLinks[0].trg).toBe('beta');

        // 3-10. index.getAll() - query links by target index
        const gammaTargetLinks = await new Promise<any[]>((resolve, reject) => {
          const tx = db.transaction('links', 'readonly');
          const store = tx.objectStore('links');
          const index = store.index('link_target');
          const req = index.getAll('gamma');
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        expect(gammaTargetLinks.length).toBe(1);
        expect(gammaTargetLinks[0].src).toBe('beta');

        db.close();
      });
    });

    // Feature: idb.open() v3 - schema deletion and advanced operations
    describe(`with database ${dbName}:v3`, () => {
      // Test schema modifications: deleting stores and indices
      it('should upgrade to v3 and modify schema', async () => {
        const request = idb.open(dbName, 3);
        
        const upgradePromise = new Promise<void>((resolve) => {
          request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const db = (event.target as IDBOpenDBRequest).result;
            
            // 4-1. deleteObjectStore() - remove an existing object store
            db.deleteObjectStore('items');
            
            // 4-2. store.deleteIndex() - remove an index from an object store
            const linksStore = (event.target as IDBOpenDBRequest).transaction!.objectStore('links');
            linksStore.deleteIndex('link_unique');
            
            resolve();
          };
        });

        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
          request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
        });
        await upgradePromise;

        // Verify v3 schema changes
        expect(db.objectStoreNames).not.toContain('items');
        const tx = db.transaction('links', 'readonly');
        const linksStore = tx.objectStore('links');
        expect(linksStore.indexNames).not.toContain('link_unique');

        db.close();
      });

      // Advanced data operations: count, clear, cursors
      it('should perform data operations in v3', async () => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = idb.open(dbName, 3);
          request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
          request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
        });

        // 4-3. Verify unique constraint removal (duplicate add should succeed now)
        const addDuplicateLinks = new Promise<void>((resolve, reject) => {
          const tx = db.transaction('links', 'readwrite');
          const store = tx.objectStore('links');
          store.add({ src: 'alpha', trg: 'beta' });
          store.add({ src: 'beta', trg: 'gamma' });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        await addDuplicateLinks;

        // 4-4. store.count() - count records in a store
        const linksCountBefore = await new Promise<number>((resolve, reject) => {
          const tx = db.transaction('links', 'readonly');
          const store = tx.objectStore('links');
          const req = store.count();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        expect(linksCountBefore).toBe(7); // 5 from v2 + 2 new ones

        // 4-5. store.clear() - remove all records from a store
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction('links', 'readwrite');
          const store = tx.objectStore('links');
          const req = store.clear();
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });

        // 4-6. Verify counts after clearing
        const nodesCount = await new Promise<number>((resolve, reject) => {
          const tx = db.transaction('nodes', 'readonly');
          const store = tx.objectStore('nodes');
          const req = store.count();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        expect(nodesCount).toBe(4);

        const linksCountAfter = await new Promise<number>((resolve, reject) => {
          const tx = db.transaction('links', 'readonly');
          const store = tx.objectStore('links');
          const req = store.count();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        expect(linksCountAfter).toBe(0);

        // 4-7. store.getAllKeys() - retrieve all keys from a store
        const nodeKeys = await new Promise<IDBValidKey[]>((resolve, reject) => {
          const tx = db.transaction('nodes', 'readonly');
          const store = tx.objectStore('nodes');
          const req = store.getAllKeys();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        expect(nodeKeys).toContain('alpha');
        expect(nodeKeys).toContain('beta');
        expect(nodeKeys).toContain('gamma');
        expect(nodeKeys).toContain('default');

        // 4-8. getAll records simulation (using getAll)
        const allNodes = await new Promise<any[]>((resolve, reject) => {
          const tx = db.transaction('nodes', 'readonly');
          const store = tx.objectStore('nodes');
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        expect(allNodes.length).toBe(4);

        // 4-9. store.openCursor() - iterate through records using a cursor
        const cursorData: any[] = [];
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction('nodes', 'readonly');
          const store = tx.objectStore('nodes');
          const req = store.openCursor();
          req.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              cursorData.push(cursor.value);
              cursor.continue();
            } else {
              resolve();
            }
          };
          req.onerror = () => reject(req.error);
        });
        expect(cursorData.length).toBe(4);

        // 4-10. store.openKeyCursor() - iterate through keys using a key cursor
        const cursorKeys: IDBValidKey[] = [];
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction('nodes', 'readonly');
          const store = tx.objectStore('nodes');
          const req = store.openKeyCursor();
          req.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursor>).result;
            if (cursor) {
              cursorKeys.push(cursor.key);
              cursor.continue();
            } else {
              resolve();
            }
          };
          req.onerror = () => reject(req.error);
        });
        expect(cursorKeys.length).toBe(4);

        db.close();
      });
    });
    
    // Feature: idb.deleteDatabase() - clean up database
    describe(`delete database ${dbName}`, () => {
      // Test database deletion
      it('should delete the database', async () => {
        const deleteRequest = idb.deleteDatabase(dbName);
        
        await new Promise<void>((resolve, reject) => {
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
        });

        // 5-2. Verify database is removed from databases() list
        const databases = await idb.databases();
        expect(databases.find(db => db.name === dbName)).toBeUndefined();
      });
    });
  });

});
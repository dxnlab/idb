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

import { describe, it, expect } from 'vitest';

const until = async (condition: () => unknown, timeout: number = 5000, interval: number = 100): Promise<unknown> => {
  const { promise, reject, resolve } = Promise.withResolvers();
  const timeoutId = setTimeout(() => {
    clearTimeout(timeoutId);
    clearInterval(intervalId);
    reject(new Error(`Timeout of ${timeout}ms exceeded while waiting for condition.`));
  }, timeout);
  const intervalId = setInterval(() => {
    const rs = condition();
    if(rs) {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      resolve(rs);
    }
  }, interval);
  return promise;
}

describe('Check indexedDB available', async ()=>{
  const sampleDBName = 'test-db';

  describe('test IDBFactory', async ()=>{
    // Test if indexedDB is available in the environment
    it('should be available', async ()=>{
      expect(globalThis.indexedDB).toBeDefined();
      expect(globalThis.indexedDB).toBeInstanceOf(IDBFactory);
    });

    // Test if indexedDB.open() request
    it('should return an IDBOpenDBRequest', async ()=>{
      const request = indexedDB.open(sampleDBName, 1);
      let db:IDBDatabase;
      request.addEventListener('success', (event:any)=>{
        db = event?.target?.result || request.result;
        expect(db).toBeInstanceOf(IDBDatabase);
        expect(db.name).toBe(sampleDBName);
        expect(db.version).toBe(1);
        expect(db.objectStoreNames).toBeInstanceOf(DOMStringList);
        expect(db.objectStoreNames.length).toBe(0);
      }, { once: true });
      request.addEventListener('error', (_)=>{
        expect(true).toBe(false); // Fail the test if error occurs
      }, { once: true });
      expect(request).toBeInstanceOf(IDBOpenDBRequest);
      // @ts-ignore
      (await until(() => db))?.close();

      // try to delete the database after the test
      let deleted:boolean|null = null;
      const deleteRequest = indexedDB.deleteDatabase(sampleDBName);
      deleteRequest.addEventListener('success', ()=>{
        deleted = true;
      }, { once: true });

      await until(()=>{ deleted != null; return deleted; });
      expect(deleted).toBe(true);
    });
  });
});
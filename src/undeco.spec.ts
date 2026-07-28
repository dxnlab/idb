import { expect } from '@wdio/globals';
import {
  open,

  showDatabases,
  cmp,
  prepare,
  generatorOf,
} from './undeco';

const testDB = 'test';
const testMigration =  {
  version: 1,
  stores: {
    items: {
      key: 'id',
      autoIncrement: true,
    }
  }
};
const testAdds = [
  { kind: 'node', value: 1 },
  { kind: 'node', value: 2 },
  { kind: 'link', source: 1, target: 2, value: 1 },
  { kind: 'link', source: 2, target: 1, value: 2 },
]

describe('undecorated features', async ()=>{
  // test open
  describe('to test open', async ()=>{
    it('tests open', async ()=>{
      const idb = await open(testDB, testMigration);
      expect(idb).toBeInstanceOf(IDBDatabase);
      // singletone test
      expect(idb === await open(testDB)).toBe(true);

      [
        'disconnect',
        'drop',
        'trx',
        'reads',
        'writes',
      ].forEach((method)=>{
        console.log(`test ${method} existance`);
        expect(typeof idb?.[method]).toBe('function');
      });

      // run writes
      await idb.writes(['items'], async ({items})=>{
        const gsterisk = generatorOf(testAdds);
        const ids = await items.adds(gsterisk);
        expect(ids).toBeInstanceOf(Array);
        expect(ids.length).toBe(testAdds.length);
        ids.forEach((id)=>expect(id).toBeGreaterThan(0));
      });
      
      // reads the values
      await idb.reads(['items'], async ({items})=>{
        const stmt =  prepare(items);
        for await (const it of stmt.values) {
          console.log(it);
          expect(it).toBeInstanceOf(Object);
          expect(it.id).toBeGreaterThan(0);
        }
      });
    })
  })

});
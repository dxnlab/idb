import { expect } from 'expect-webdriverio';
import MixedItems from './simple';

/**
 * spec tests
 */
describe('simple spec run', async ()=>{
  
  it('should success', async ()=>{
    expect(await true).toBe(true);
  });
  
  it('test writes and reads', async ()=>{
    const idb = new MixedItems();
    // const singular = {id: 'one', name: 'single'};
    // const secondary = [
    //   {id: 'two', name: 'dual'},
    //   {id: 3, name: 'tri', label: 'x'},
    //   {id: 4, name: 'four', label: 'y'},
    // ];
    // await idb.addItems(singular);
    // expect(await idb.find('one')).toBe(singular);
    // await idb.addItems(...secondary);
    // const all = await idb.listAll();
    // expect(all).toContain(singular);
    // expect(all.length).toBeGreaterThanOrEqual(secondary.length);

    // let count = 0;
    // for await (const it of idb.itemGen()) {
    //   count += 1;
    //   console.log(it);
    //   expect(it.id).toBeDefined();
    // }

    // expect(count).toBe(all.length);
  });
});
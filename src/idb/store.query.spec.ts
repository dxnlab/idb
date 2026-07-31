import { expect } from 'expect-webdriverio'
import { setup, teardown, trx, randompick } from './tests'
import { prepare } from './store.query'

const storeName = 'items';
const storeDefinition = {
  key: 'id',
  autoIncrement: true,
  index: {
    item_color: 'color',
    item_order: 'order',
  }
}
const colors = ['red','black','white','grey','blue','green','teal','yellow','violet','brown','orange','gold','silver','steel','bronze','lime','mint'];

describe('prepare query spec v003', async ()=>{
  let db;
  const wraps = async (runner) => await trx(db, { stores: [storeName], mode: 'readonly'}, runner);
  //
  before(async ()=>{
    db = await setup(1, {[storeName]:storeDefinition}, {
      // multiplicate seeds
      [storeName]: (new Array(colors.length*100)).fill(null).map(()=>({
        color: randompick(colors),
        order: Math.round(Math.random()*colors.length*10) + 1,
      }))
    });
    return db;
  });

  after(async ()=>{
    await teardown(db);
  });

  it('prepare statement works', async ()=>{
    await wraps(async ({items})=>{
      // build stmt
      const stmt = prepare(items);
      // default direction to be 'next'
      expect(stmt.direction).toBe('next');

      // run all values out of stmt
      let valueCount = 0;
      for await (const it of stmt.values) {
        valueCount += 1;
      }
      expect(valueCount).toBeGreaterThanOrEqual(colors.length*99);

      // keys should be 'id'
      stmt
        .range('<', 100)
        .unique()
        .descending();
      // now the direction would be 'prevunique'
      expect(stmt.direction).toBe('prevunique');

      let lastId = null;
      for await (const id of stmt.keys) {
        expect(id).toBeLessThan(100);
        if(lastId!=null) {
          // check it descending
          expect(lastId).toBeGreaterThan(id);
          // check its bounding
        }
        lastId = id;
      }
    });
  });

  it('should run with bounds', async ()=>{

    await wraps(async ({items})=>{
      // index preparation; index proxy gets by the index name, rather then of key column name.
      const stmt = prepare(items.item_order);
      let min = colors.length*20, max=0;

      for await (const o of stmt.uniqueKeys) {
        min = Math.min(o, min);
        max = Math.min(o, max);
      }

      expect(min).toBeLessThan(max);

      // bounding from [min+1, max)
      let fullCounts = 0, uniqCounts =0;
      stmt
        .range('<=', min+1)
        .range('>', max);

      for await (const v of stmt.values) {
        expect(v.order).toBeGreaterOrEqual(min+1);
        expect(v.order).toBeLessThen(max);
        fullCounts += 1;
      }
      expect(fullCounts).toBeGreaterThan(0);

      // set unique
      for await (const order of stmt.uniqueKeys) {
        expect(order).toBeGreaterOrEqual(min+1);
        expect(order).toBeLessThen(max);
        uniqCounts += 1;
      }
      expect(uniqCounts).toBeGreaterThan(0);
      expect(uniqCounts).toBeLessThan(fullCounts);
    });

  });

  it('should run with having', async ()=>{
    const targetColor = randompick(colors);
    const orderThreshold = 10;
    await wraps(async ({items})=>{
      const stmt = prepare(items.item_color);
      stmt
        // with the exact value,
        .range('=', targetColor)
        // having order
        .having(({order})=>orderThreshold < order);

      let cnt = 0;
      for await (const it of stmt.values) {
        // the color should be the target only
        expect(it.color).toBe(targetColor);
        // passed having
        expect(it.order).toBeGreaterThan(orderThreshold);
        cnt += 1;
      }

      expect(cnt).toBeGreaterThan(0);
    });
  });
})
import { expect } from 'expect-webdriverio';
import logger from '@wdio/logger'
import { ItemData } from './main.js'
import migration from './migration.js'

describe('example runs', async ()=>{
  const log = logger('EXAMPLE');
  const dbname = 'items';
  let idb:any;

  beforeAll(async ()=>{
    // test connector connected
    idb = new ItemData();
    const db = await ItemData.idb;
    expect(db).toBeInstanceOf(IDBDatabase);
    expect(db.name).toBe(dbname);
    expect(db.version).toBe(migration.version);
    // adding seed items
    await idb.setBrands(
      {title: 'alpha'},
      {title: 'omega'},
    );
    await idb.addProducts(
      {brand: 'alpha', code: 'a1', category: 'one' },
      {brand: 'alpha', code: 'a2', category: 'two' },
      {brand: 'alpha', code: 'a3', category: 'tri' },
      {brand: 'alpha', code: 'a4', category: 'paper' },
      {brand: 'omega', code: 'z1', category: 'one' },
      {brand: 'omega', code: 'zx', category: 'x' },
    );
    await idb.setItems(
      { sku: 'a1-black', product: 'a1', color: 'black', price: 100, stockCount: 10 },
      { sku: 'a1-white', product: 'a1', color: 'white', price: 100, stockCount: 12 },
      { sku: 'a2-white', product: 'a2', color: 'white', price: 200, stockCount: 5 },
      { sku: 'a3-green', product: 'a3', color: 'green', price: 250, stockCount: 2 },
      { sku: 'a4-blank', product: 'a4', color: 'white', price: 10, stockCount: 1000 },
      { sku: 'a4-ivory', product: 'a4', color: 'ivory', price: 10, stockCount: 1000 },
      { sku: 'a4-green', product: 'a4', color: 'green', price: 20, stockCount: 1000 },
      { sku: 'z1-ruby', product: 'z1', color: 'red', price: 5000, stockCount: 2 },
      { sku: 'z1-dia', product: 'z1', color: 'transparent', price: 7500, stockCount: 1 },
      { sku: 'zx-saphire', product: 'zx', color: 'blue', price: 7700, stockCount: 1 },
      { sku: 'zx-quartz', product: 'zx', color: 'transparent', price: 6500, stockCount: 2 },
    );
  });

  it('test getAllBrands', async () => {
    const brands = await idb.getAllBrands();
    expect(brands).toBeDefined();
    expect(brands.length).toBeGreaterThan(0);
    log.info(brands);
  });

  it('test listItems', async () => {
    let count = 0;
    const itemsGenerator = idb.listItmes();
    for await (const it of itemsGenerator) {
      log.info(`>>> [${it.product}] ${it.sku}`);
      expect(it.price).toBeDefined();
      count += 1;
    }
    expect(count).toBeGreaterThan(0);
  });

  afterAll(async ()=>{
    // clear values
    await idb.clearsAll();
    // drop the schema
    await ItemData.drop();
  });
});
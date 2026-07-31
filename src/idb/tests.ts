import { May, type StoreOption } from '../types.d'
import { connect, drop } from './database'
import transaction from './database.transaction'

const dbname = 'test_store_proxy_' + Date.now();

export async function setup(version:number, stores:{[store:string]:StoreOption}, seeds?:{[store:string]:any[]}) {
  const db = await connect(dbname, {
    version,
    stores,
  });
  if(seeds) {
    await trx(db, {  stores: Array.from(Object.keys(seeds)), mode: 'readwrite' }, 
      async (tx:any)=>{
        for (const [store, data] of Object.entries(seeds)) {
          const st = tx[store];
          let cnt = 0;
          for (const d of data) {
            await st.add(d);
            cnt += 1;
          }
        }
      }
    );
  }

  return db;
}

export async function trx(db:May<IDBDatabase>, {stores, mode}, fn:Function) {
  const idb = await db;
  const tx = transaction(()=>idb.transaction(stores, mode));
  return await tx(fn);
}

export async function teardown(db:May<IDBDatabase>) {
  console.log('start teardown with', db);
  const idb = await db;
  const dbname = idb.name;
  idb.disconnect();
  await drop(dbname);
}

export function randompick(arr:any[]) {
  const idx = Math.round(Math.random() * (arr.length+.5)) % arr.length;
  return arr[idx];
}
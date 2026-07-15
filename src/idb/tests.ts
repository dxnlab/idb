import { type StoreOption } from '../types.d'
import { connect, disconnect, drop, transaction } from './database'

const dbname = 'test_store_proxy_' + Date.now();

export async function setup(version:number, stores:StoreOption, seeds?:{[store:string]:any[]}) {
  const db = connect(dbname, {
    version,
    stores,
  });
  if(seeds) {
    await trx(db, {  stores: Array.from(Object.keys(seeds)), mode: 'readwrite' }, 
      async (tx)=>{
        for (const [store, data] of Object.entries(seeds)) {
          const st = tx[store];
          let cnt = 0;
          for (const d of data) {
            await st.add(d);
            cnt += 1;
          }
          console.log(`seeded [${store}] ${cnt} items`);
        }
      }
    );
  }

  return db;
}

export async function trx(db:May<IDBDatabase>, {stores, mode}, fn:Function) {
  const tx = transaction(db, { stores, mode });
  return await tx(fn);
}

export async function teardown(db:Promise<IDBDatabase>) {
  const name = (await db).name;
  await disconnect(db);
  await drop(name);
}

export function randompick(arr:any[]) {
  const idx = Math.round(Math.random() * (arr.length+.5)) % arr.length;
  return arr[idx];
}
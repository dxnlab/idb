import { type StoreOption } from '../types.d'
import iDB from './database'
import transaction from './database.transaction'

const dbname = 'test_store_proxy_' + Date.now();

export async function setup(version:number, stores:StoreOption, seeds?:{[store:string]:any[]}) {
  const db = iDB.open(dbname, {
    version,
    stores,
  });
  await db.connect();
  if(seeds) {
    await trx(db.connection, {  stores: Array.from(Object.keys(seeds)), mode: 'readwrite' }, 
      async (tx)=>{
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

  return await db.connection;
}

export async function trx(db:May<IDBDatabase>, {stores, mode}, fn:Function) {
  const idb = await db;
  const tx = transaction(()=>idb.transaction(stores, mode));
  return await tx(fn);
}

export async function teardown(db:Promise<IDBDatabase>) {
  const idb = await db;
  await iDB.drop(idb.name);
}

export function randompick(arr:any[]) {
  const idx = Math.round(Math.random() * (arr.length+.5)) % arr.length;
  return arr[idx];
}
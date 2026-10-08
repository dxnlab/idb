import { describe, it, expect } from 'vitest';
import { connect, drop } from '@dxnlab/idb';

describe('simple-wrap', async ()=>{
  const testDbName = 'testdb';
  it('test simple wrap', async ()=>{
    const db = await connect(testDbName);

    expect(db).toBeInstanceOf(IDBDatabase);
    await db.open();
    expect(db).toHaveProperty('name', testDbName);
    expect(db).toHaveProperty('version', 1);
    expect(db.connected).toBe(true);
    await db.disconnect();
    expect(db.connected).toBe(false);
    await drop(testDbName);
  });

  it('test simple wrap handling events', async ()=>{
    const db = await connect(testDbName);
  })
});
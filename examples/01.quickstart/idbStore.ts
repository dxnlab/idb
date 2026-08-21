/**
 * quick start
 */
import { idb, reads, writes } from '@dxnlab/idb'

@idb('quickstart', {
  version: 1,
  stores: {
    items: {
      key: 'id',
      autoIncrement: true
    }
  }
})
export class IDBStore {
  @writes('items')
  async addItems({items}, ...itemArray:object[]):Promise<number[]> {
    return items.adds(itemArray);
    /** 
     * equivalent to:
     * 
     * const ids = [];
     * for(const it of itemArray) {
     *  ids.push(await items.add(it));
     * }
     * return ids;
    */
  }

  @writes('items')
  async editItem({items}, item_id:number, attributes:object):Promise<number> {
    return await items.put(attributes, item_id);
  }

  @reads('items')
  async getAllItems({items}):Promise<object[]> {
    return await items.getAll();
  }

  @reads('items')
  async findItem({items}, item_id:number):Promise<object> {
    return await items.get(item_id);
  }
}
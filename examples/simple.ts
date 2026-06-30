import { idb, reads, writes } from '../dist'
// import migration from './simple.migration'

/**
 * Definition
 */
@idb('items', {
  version: 1,
  stores: { items: 'id' }
})
class MixedItems {
  // @writes('items')
  // public async addItems(tx, ...toAdds:any[]) {
  //   console.log('try to add items', this, arguments);
  //   return Promise.all(toAdds.map((it)=>tx.items.add(it)));
  // }

  // @reads('items')
  // async find(tx, id:any) {
  //   console.log('try to find a item', this, arguments);
  //   return await tx.items.get(id);
  // }

  // @reads('items')
  // async listAll(tx) {
  //   console.log('try to list all items', this, arguments);
  //   return await tx.items.getAll();
  // }

  // @reads('items')
  // async itemGen(tx) {
  //   console.log('try to get generator items', this, arguments);
  //   return tx.items.valueGenerator();
  // }
}

export default MixedItems;
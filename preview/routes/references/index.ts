import Layout from './.Layout.vue'
import Database from './Database.vue'
import Migration from './Migration.vue'
import ObjectStore from './ObjectStore.vue'
import Transaction from './Transaction.vue'


export default {
  component: Layout,
  children: [
    // TODO: 
    // - query/state
    { title: 'Transaction', path: 'transaction', component: Transaction },
    { title: 'ObjectStore', path: 'store', component: ObjectStore },
    { title: 'Migration', path: 'migration', component: Migration },
    { title: 'Database', path: 'database', component: Database },
  ]
}
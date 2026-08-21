import Layout from './.Layout.vue'
import suiteLocal from './LocalEnv.vue'
import suiteBasic from './Basic.vue'
import suiteQueries from './Queries.vue'

export default {
  component: Layout,
  children: [
    { title: 'Query', path: 'query', component: suiteQueries },
    { title: 'Basic', path: 'basic', component: suiteBasic },
    { title: 'LocalENV', path: '', component:suiteLocal },
  ]
}
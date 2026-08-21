import Layout from './.Layout.vue'
import About from './About.vue'
import Install from './Install.vue'

export default {
  component: Layout,
  children: [
    { title: 'Install', path: 'install', component: Install },
    { title: 'About', path: '', component: About },
  ]
}
import { computed, createApp, ref, shallowReactive } from 'vue'
import App from './components/App.vue'
import router from './router';
import vuetify from './vuetify';

const app = createApp(App);
// plugins
app.use(router);
app.use(vuetify);
// providing in common cofnig
app.provide('config', shallowReactive({
  title: '@dxnlab/idb',
  subtitle: null,
  lang: globalThis.navigator.language || 'en',
  showNavigation: true,
  theme: undefined,
}))
app.provide('activePath', computed(()=>{
  return app.config.globalProperties.$router.currentRoute
    ?.value?.fullPath;
}));
app.mount('#app');
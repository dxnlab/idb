<template>
  <v-navigation-drawer :model-value="config.showNavigation">
    <!-- breadcrumbs -->
    <v-breadcrumbs :items="currentRoute" />
    <!-- route links -->
    <v-list>
      <template v-for="{ title, path, items } in appRoutes" :key="`app-route-${path}`">
        <v-list-group :value="title">
          <template #activator="{ props }">
            <route-list-item v-bind="props" :title="title" :path="path" />
          </template>
          <route-list-item 
            v-for="it in items" :key="`app-route-${path}.${it.path}`"
            :title="it.title" :path="joinPath(path, it.path)" />
        </v-list-group>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { AppConfig } from '../types/App';
import RouteListItem from './RouteListItem.vue'
const config = inject('config') as AppConfig;
</script>

<script lang="ts">
import routes from '../routes'

const revIter = (iterable:Iterable<any>):any[]=>Array.from(iterable).reverse();
export default {
  methods: {
    joinPath(...pathes:string[]) {
      const splitted = pathes.map((pts)=>pts.split(/\//g)).flat().filter((t)=>t && 0<t.length);
      return '/'+splitted.join('/');
    }
  },
  computed: {
    appRoutes() {
      return revIter(routes)
        .map(({ title, path, children })=>({ 
          title, 
          path,
          items: revIter(children).map(({path, title})=>({ path, title })) 
        }))
    },
    currentRoute() {
      const passage = this.$router.currentRoute.value.fullPath.split(/\//g)
        .filter(Boolean);
      return 0<passage.length ? passage : ['@dxnlab/idb']
    }
  }
}
</script>
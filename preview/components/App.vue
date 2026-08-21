<template>
  <v-app>
    <app-navigation ></app-navigation>
    <app-bar />
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import appNavigation from './AppNavigation.vue';
import appBar from './AppBar.vue'
</script>
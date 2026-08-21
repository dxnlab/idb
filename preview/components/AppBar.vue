<template>
  <v-app-bar flat>
    <v-app-bar-nav-icon @click="toggleUpdate"></v-app-bar-nav-icon>
    <div>
      <v-app-bar-title>{{ config.title }}</v-app-bar-title>
      <span v-if="config.subtitle">{{ config.subtitle }}</span>
    </div>
  </v-app-bar>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { AppConfig } from '../types/App';

const config = inject('config') as AppConfig;
function toggleUpdate() {
  config.showNavigation = !config.showNavigation;
}
</script>
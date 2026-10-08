<template>
  <router-view>

  </router-view>
</template>

<script setup lang="ts">
import { provide } from 'vue';
import { RouterView } from 'vue-router'
import { registerServiceWorker } from '@dxnlab/workers/service'
import suiteWorker from './suites/base?url'

/**
 * register & provide suite worker
 */
provide('testCore', registerServiceWorker(suiteWorker, {
  type: 'module',
  onMessage({data}) {
    console.log('[SERVICE] messaged', data);
  }
}));
</script>
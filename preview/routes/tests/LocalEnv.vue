<template>
  <h2>LocalEnv</h2>
</template>

<script setup lang="ts">
import { registerWorker } from '@dxnlab/workers'
import idbTestSuite from './suites/indexeddb?url'
import { onMounted } from 'vue';

const worker = registerWorker(idbTestSuite, {
  type: 'module',
  onError: console.error,
  onMessageError: console.error,
  onMessage: (event:Event) => {
    console.log('[TEST SUITE]', event);
  }
});

onMounted(()=>{
  // start worker
  worker.post({ start: true });
})

</script>
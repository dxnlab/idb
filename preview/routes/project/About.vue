<template>
  <v-toolbar title="README.md">
    <v-spacer />
    <v-toolbar-items>
      <!-- npmjs button -->
      <v-btn
        icon="mdi-npm"
        href="https://www.npmjs.com/package/@dxnlab/idb"
        v-bind="btnOptions"
      />
      <!-- github button -->
      <v-btn
        icon="mdi-github"
        href="https://github.com/dxnlab/idb"
        v-bind="btnOptions"
      />
    </v-toolbar-items>
  </v-toolbar>
  <markdown-view :url="readme.url" :model-value="readme?.value" />
</template>

<script setup lang="ts">
import { inject } from 'vue';
import MarkdownView from '../../components/MarkdownView.vue';

const readme = inject<{ url?: string | URL; value?: string }>('readme', {});
const btnOptions = {
  target: '_blank',
  rel: 'noopener noreferrer',
};
</script>
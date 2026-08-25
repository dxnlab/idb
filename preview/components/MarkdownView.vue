<template>
  <v-alert v-if="alerts" v-bind="alerts">
  </v-alert>
  <v-progress-linear v-if="progress" v-bind="progress" />
  <article class="md-viewer" v-html="output" />
</template>

<script setup lang="ts">
import { marked } from 'marked';
import { onMounted, ref } from 'vue';

const props = defineProps<{
  url?: string | URL;
  modelValue?: string;
}>();

const output = ref('');
const alerts = ref<{ type: 'error' | 'success' | 'info' | 'warning'; title: string; text: string } | null>(null);
const progress = ref<{ indeterminate: boolean; color: string; active: boolean } | null>({
  indeterminate: true,
  color: 'primary',
  active: true,
});

async function renderMarkdown() {
  alerts.value = null;
  if (props.url) {
    const response = await fetch(props.url.toString());
    const body = await response.text();

    if (!response.ok) {
      alerts.value = {
        type: 'error',
        title: `[${response.statusText}] ${props.url.toString()}`,
        text: body,
      };
      progress.value = null;
      return;
    }
    output.value = await marked(body);
  } else {
    output.value = await marked(props.modelValue || '');
  }
  // complete the progress
  progress.value = null;
}

onMounted(renderMarkdown);

</script>

<style lang="sass" scoped>
.md-viewer
  max-width: 1012px
  margin: 0 auto
  padding: 32px
  background-color: rgb(var(--v-theme-background))
  color: rgb(var(--v-theme-on-background))
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
  font-size: 16px
  line-height: 1.5
  overflow-wrap: break-word

  :deep(a)
    color: rgb(var(--v-theme-primary))
    text-decoration: none

    &:hover
      text-decoration: underline

  :deep(h1), :deep(h2)
    padding-bottom: 0.3em
    border-bottom: 1px solid currentColor

  :deep(h1)
    font-size: 2em

  :deep(h2)
    font-size: 1.5em

  :deep(h3)
    font-size: 1.25em

  :deep(h4)
    font-size: 1em

  :deep(h5)
    font-size: 0.875em

  :deep(h6)
    font-size: 0.85em

  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6)
    margin-top: 24px
    margin-bottom: 16px
    font-weight: 600
    line-height: 1.25

  :deep(p), :deep(blockquote), :deep(ul), :deep(ol), :deep(dl), :deep(table), :deep(pre)
    margin-top: 0
    margin-bottom: 16px

  :deep(blockquote)
    padding: 0 1em
    border-left: 0.25em solid currentColor

  :deep(ul), :deep(ol)
    padding-left: 2em

  :deep(li + li)
    margin-top: 0.25em

  :deep(img)
    max-width: 100%
    box-sizing: content-box

  :deep(hr)
    height: 0.25em
    margin: 24px 0
    padding: 0
    border: 0
    border-top: 1px solid currentColor

  :deep(code), :deep(pre)
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace

  :deep(code)
    padding: 0.2em 0.4em
    font-size: 85%

  :deep(pre)
    padding: 16px
    overflow: auto

  :deep(pre code)
    padding: 0
    font-size: 100%

  :deep(table)
    display: block
    width: max-content
    max-width: 100%
    overflow: auto
    border-spacing: 0
    border-collapse: collapse

  :deep(th), :deep(td)
    padding: 6px 13px
    border: 1px solid currentColor

  :deep(tr)
    background-color: inherit

@media (max-width: 600px)
  .md-viewer
    padding: 20px 16px

</style>
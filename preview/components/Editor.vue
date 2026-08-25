<template>
  <div class="editor" ref="editor"></div>
</template>

<script setup lang="ts">
// @ts-nocheck
import * as monaco from 'monaco-editor'
import { languages, editor } from 'monaco-editor';
import { onMounted, ref, useTemplateRef, watch } from 'vue';

const editorEl = useTemplateRef('editor');
const props = defineProps({
  options: Object,
  language: String,
  readOnly: Boolean,
  theme: String,
  modelValue: String,
});
const value = ref(props.modelValue || '');

monaco.languages.register({ id: props.language });
const model = editor.createModel(
  value.value,
  props.language
);

onMounted(()=>{
  editor.create(editorEl.value!, {
    roundedSelection: true,
    lineNumbers: 'off',
    scrollBeyondLastLine: false,
    readOnly: true,
    ...props.options,
    model,
  });
});
</script>

<style lang="sass" scoped>
.editor
  width: auto;
  min-height: 5*19px;
  height: 20vh;

  .monaco-editor 
    .overflow-guard
      width: auto !important;
      height: auto !important;
      
</style>
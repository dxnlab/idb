<template>
  <div class="d-block content">
    <v-card tile flat :image="image?.src">
      <v-card-item>
        <v-card-title class="block-title" v-html="title"/>
        <v-card-subtitle v-if="subtitle" v-html="subtitle" />
      </v-card-item>
      <slot>
        <v-card-text>
          <p v-for="ln, li in contents" :key="`bc-${li}`" v-html="ln" />
        </v-card-text>
      </slot>
    </v-card>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  title: String,
  subtitle: String,
  image: Object,
  contents: Array,
})

</script>

<style lang="sass" scoped>
.content 
  .block-title
    font-weight: bold;

    .accent
      text-decoration: italic underlined;
      color: #000;

  align-content: start;
      

</style>
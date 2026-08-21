<template>
  <v-list-item :active="active">
    <v-list-item-title @click="onClick">{{ title }}</v-list-item-title>
  </v-list-item>
</template>

<script lang="ts">
import { inject } from 'vue';

export default {
  props: {
    title: {type: String, required: true},
    path: {type: String, required: true},
  },
  computed: {
    active(){ 
      const fullPath = inject('activePath');
      return fullPath && fullPath == this.path
    },
  },
  methods: {
    onClick() {
      this.$router.push(this.path);
    }
  },
  data() {
    return {};
  }
}

</script>
<template>
  <v-card>
    <!-- controls (+suite progress) -->
    <v-toolbar>
      <!-- test suite status indicator (true/false/null)-->
      <v-spacer />
      <!-- show/hide progress in detail -->
      <!-- action button stop (on running) / restart (on stopped) -->
    </v-toolbar>
    <!-- suite case sequences running -->
    <v-list>
      <!-- first-level depth tests are sequential -->
      <!-- secondary depth tests are parallel within the suite -->
    </v-list>
    <!-- log/error panel: show selected testCase logs -->

  </v-card>
</template>

<script lang="ts">
import { computed, shallowReactive } from 'vue';
import { TestCase, TestSuite } from '../routes/tests/types';
import { suite } from 'node:test';

export default {
  props: {
    modelValue: Object,
  },
  methods: {
    async runCases(...caseArgs:any[]) {
      for(const cs of this.cases) {
        try {
          const passing = Promise.all(
            cs.items?.map(async (unit)=>await unit.test(...caseArgs))
          );
        } catch {

        } finally {

        }
      }
    }

  },
  computed: {
    suite():TestSuite{ return this.modelValue as TestSuite },
    cases():TestCase[]{ return this.suite.items },
    numCases():number { return this.cases.length },
    caseIndex():number {
      return this.caseCursor!=null 
        ? this.cases.indexOf(this.caseCursor)
        : null;
    },
    progress() { 
      return this.caseIndex!=null 
        ? (this.caseIndex + 1) / this.numCases
        : null;
    },
  },
  data() {
    return {
      runner: null,
      caseCursor: null,
      selectable: true,
    }
  }
}

const progress = computed(()=>{
  if(!status.caseCursor) { return -1 }
  return (status.caseCursor+1)/cases.length;
});

</script>
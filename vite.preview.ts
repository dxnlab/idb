import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import babel from '@rolldown/plugin-babel'
import babelConfig from './babel.config.json' with { type: 'json' }

export default defineConfig({
  base: './',
  mode: 'development',
  build: {
    rolldownOptions: {
      tsconfig: './tsconfig.preview.json'
    },
    outDir: './docs',
  },
  plugins: [
    vue(),
    babel({ 
      // @ts-ignore
      presets: [{ 
        preset: ()=>(babelConfig),
        rolldown: { filter: { code: "@" }},
      }] 
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
})
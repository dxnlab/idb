import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import babel from '@rolldown/plugin-babel'
import tsconfigPath from 'vite-tsconfig-paths'

export default defineConfig({
  server: {
    headers: {
      'Service-Worker-Allowed': "/",
    },
  },
  plugins: [
    tsconfigPath({ 
      projects: ['./tsconfig.preview.json'],
    }),
    babel({ 
      presets: [{
        preset: ()=>({
          plugins: [[
              "@babel/plugin-proposal-decorators", 
              { "version": "2023-11" }
          ]]
        }),
        rolldown: { filter: { code: '@' } }
      }]
    }),
  ],
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      // https://vitest.dev/config/browser/playwright
      instances: [
        { browser: 'chromium' }
      ],
    },
  },
})

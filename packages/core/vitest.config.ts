import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    name: '@ktd-cesium/core',
    environment: 'happy-dom',
    globals: true,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        'test/',
        '**/index.ts' // Exclude index.ts files (re-export only)
      ]
    },

    include: ['src/**/*.{test,spec}.{js,ts}', 'test/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache']
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ktd-cesium/shared': path.resolve(__dirname, '../shared/src')
    }
  }
})

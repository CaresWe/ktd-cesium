import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    name: '@auto-cesium/plugins',
    environment: 'happy-dom',
    globals: true,
    // Limit concurrency to avoid "too many open files" error
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },

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
      '@auto-cesium/core': path.resolve(__dirname, '../core/src'),
      '@auto-cesium/shared': path.resolve(__dirname, '../shared/src'),
      // Mock optional dependencies for testing
      vue: path.resolve(__dirname, './test/__mocks__/vue.ts'),
      react: path.resolve(__dirname, './test/__mocks__/react.ts'),
      'react-dom/client': path.resolve(__dirname, './test/__mocks__/react-dom-client.ts')
    }
  }
})

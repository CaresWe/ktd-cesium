import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*'],
      outDir: 'dist',
      rollupTypes: false,
      compilerOptions: {
        composite: false
      }
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'KtdCesiumPlugins',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs')
    },
    rollupOptions: {
      external: ['cesium', '@auto-cesium/core', '@auto-cesium/shared', 'vue', 'react', 'react-dom', 'react-dom/client'],
      output: {
        globals: {
          cesium: 'Cesium',
          '@auto-cesium/core': 'KtdCesiumCore',
          '@auto-cesium/shared': 'KtdCesiumShared',
          vue: 'Vue',
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
    sourcemap: true
  },
  resolve: {
    preserveSymlinks: true
  }
})

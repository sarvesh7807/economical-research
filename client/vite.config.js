import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Generate .gz compressed production assets
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
      deleteOriginFile: false
    }),
    // Generate .br (Brotli) compressed production assets
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false
    }),
    // Generate bundle analysis report (stats.html) in the client project root
    visualizer({
      filename: 'stats.html',
      title: 'Economical Research Bundle Analyzer Report',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Chunk splitting strategy to keep the main bundle under 300 KB (gzip)
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            if (id.includes('chart.js')) {
              return 'chartjs-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'lucide-vendor';
            }
            if (id.includes('react') || id.includes('scheduler')) {
              return 'react-core-vendor';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})

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
            if (id.includes('echarts')) {
              return 'echarts-vendor';
            }
            if (id.includes('lightweight-charts')) {
              return 'tradingview-vendor';
            }
            if (id.includes('docx')) {
              return 'docx-vendor';
            }
            if (id.includes('pptxgenjs')) {
              return 'pptx-vendor';
            }
            if (id.includes('xlsx')) {
              return 'excel-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'lucide-vendor';
            }
            if (
              /node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)
            ) {
              return 'react-core-vendor';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})

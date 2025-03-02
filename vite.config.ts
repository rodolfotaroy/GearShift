import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  server: {
    host: true, // Listen on all network interfaces
    port: 5174, // Use your preferred port
  },
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split node_modules into separate chunks
          if (id.includes('node_modules')) {
            // Group large libraries into their own chunks
            if (id.includes('@heroicons')) return 'heroicons';
            if (id.includes('react-big-calendar')) return 'calendar';
            if (id.includes('moment')) return 'moment';
            if (id.includes('supabase')) return 'supabase';
            return 'vendor';
          }
          // Split components and pages
          if (id.includes('/src/components/') || id.includes('/src/pages/')) {
            return 'app';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Increase chunk size warning limit
    sourcemap: true // Enable source maps for better debugging
  }
})

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@client': path.resolve(__dirname, './src/client'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase') || id.includes('supabase-js')) {
              return 'supabase-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            if (id.includes('react-router') || id.includes('react-router-dom')) {
              return 'router-vendor';
            }
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) {
              return 'charts-vendor';
            }
            if (id.includes('date-fns') || id.includes('dayjs') || id.includes('moment')) {
              return 'date-vendor';
            }
            return 'vendor';
          }
        }
      }
    }
  }
});

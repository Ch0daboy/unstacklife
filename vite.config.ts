import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      external: [
        // Exclude Node.js-only services from browser build
        /^node:/,
        'child_process',
        'util',
        'fs',
        'path'
      ]
    }
  },
  define: {
    // Make sure Node.js globals are not available in browser
    global: 'globalThis',
  }
});

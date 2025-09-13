import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
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
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      reporter: ['text', 'html', 'lcov'],
    },
  },
});

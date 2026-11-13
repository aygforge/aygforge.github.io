import { defineConfig } from 'vite';

// base './' : dist klasörü herhangi bir alt dizinden (ör. GitHub Pages) çalışır.
export default defineConfig({
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 2500 },
  server: { port: 5173 },
  test: { include: ['tests/**/*.test.js'], testTimeout: 180000 }
});

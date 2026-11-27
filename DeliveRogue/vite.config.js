import { defineConfig } from 'vite';

// Relative base so the dist/ build runs from any static server or an Android WebView file:// / asset loader.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', target: 'es2020', assetsInlineLimit: 0, sourcemap: false },
  server: { host: true, port: 5173 },
});

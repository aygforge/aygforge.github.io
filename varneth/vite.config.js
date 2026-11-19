import { defineConfig } from 'vite';

// base './' => relative asset paths, so the build works from any folder (itch.io ZIP).
export default defineConfig({
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'js',
    target: 'es2022',
    chunkSizeWarningLimit: 2500,
  },
  optimizeDeps: { exclude: ['@electric-sql/pglite'] },
  worker: { format: 'es' },
});

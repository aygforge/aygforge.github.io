/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
  const standalone = mode === 'standalone';
  return {
    base: './',
    build: {
      outDir: standalone ? 'dist/standalone-tmp' : 'dist/web',
      emptyOutDir: true,
      assetsInlineLimit: standalone ? 100_000_000 : 4096,
      chunkSizeWarningLimit: 4000,
      cssCodeSplit: false,
      rollupOptions: {
        input: standalone
          ? { main: resolve(__dirname, 'index.html') }
          : { main: resolve(__dirname, 'index.html'), catalog: resolve(__dirname, 'catalog.html') },
        output: standalone ? { inlineDynamicImports: true } : undefined,
      },
    },
    test: {
      include: ['tests/**/*.test.ts'],
      testTimeout: 120000,
    },
  };
});

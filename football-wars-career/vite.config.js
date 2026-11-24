import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
export default defineConfig({
  base: './',
  plugins: [viteSingleFile({ removeViteModuleLoader: true })],
  worker: { format: 'iife' }, // classic worker: also starts from file:// (module blob workers do not)
  build: { target: 'es2020', assetsInlineLimit: 100000000, cssCodeSplit: false, chunkSizeWarningLimit: 4000, outDir: 'dist', emptyOutDir: true }
});

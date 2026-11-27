// Ayrı derleme: claude.ai Artifact önizlemesi için tek dosyalık IIFE paket (game.js).
// Phaser ve matter-js harici bırakılır (window.Phaser / window.Matter). Normal derleme: vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: 'public',
  build: {
    outDir: process.env.ARTIFACT_OUT || 'artifact-dist',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    lib: { entry: 'src/main.artifact.js', formats: ['iife'], name: 'KepceUstasi', fileName: () => 'game.js' },
    rollupOptions: {
      external: ['phaser', 'matter-js'],
      output: { globals: { phaser: 'Phaser', 'matter-js': 'Matter' } },
    },
  },
});

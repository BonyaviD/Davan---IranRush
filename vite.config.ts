import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base so the built bundle works inside Capacitor's WebView (file/capacitor:// scheme).
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 900, // three.js is ~600KB minified
    // One JS file: simpler for the Capacitor WebView and for single-file previews.
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});

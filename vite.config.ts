import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base so the built bundle works inside Capacitor's WebView (file/capacitor:// scheme).
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1600, // Phaser alone is ~1.2MB minified
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});

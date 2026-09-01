import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  test: {
    environment: 'node',
    exclude: ['tests/e2e/**', '**/node_modules/**', '.pnpm-store/**', 'dist/**', 'worker/**/dist-worker/**'],
    coverage: { reporter: ['text', 'html'] },
  },
});

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
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    coverage: { reporter: ['text', 'html'] },
  },
});

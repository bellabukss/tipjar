import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'TipJar',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        entryFileNames: 'widget.js',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: true,
  },
});

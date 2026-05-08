import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      // TipJar is exposed as window.TipJar in IIFE builds
      name: 'TipJar',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        // Produce a single widget.js — no format suffix
        entryFileNames: 'widget.js',
      },
    },
    // Output alongside index.html so Vercel serves both from apps/demo
    outDir: resolve(__dirname, '../../apps/demo'),
    emptyOutDir: false,
    minify: true,
  },
});

import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'src',
  base: '/modules/fftweaks/',
  publicDir: path.resolve(__dirname, 'public'),
  server: {
    port: 30001,
    open: false,
    cors: true,
    proxy: {
      '^(?!/modules/fftweaks/)': 'http://localhost:30000/',
      '/socket.io': {
        target: 'ws://localhost:30000',
        ws: true
      }
    }
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      name: 'fftweaks',
      entry: path.resolve(__dirname, 'src/main.ts'),
      formats: ['es'],
      fileName: 'main'
    },
    rollupOptions: {
      output: {
        assetFileNames: "style.css",
      },
    }
  }
});

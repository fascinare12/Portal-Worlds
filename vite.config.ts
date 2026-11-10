import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Relative base so the built site works from any static host or subfolder.
// Each world is its own page in its own folder; add new worlds to `input`.
export default defineConfig({
  base: './',
  build: {
    // Modern browsers only: the Shibuya world waits for its textures before building the street.
    target: 'es2022',
    rollupOptions: {
      input: {
        wood: resolve(__dirname, 'index.html'),
        desert: resolve(__dirname, 'worlds/desert/index.html'),
        shibuya: resolve(__dirname, 'worlds/shibuya/index.html'),
      },
    },
  },
});

import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  // Keep existing build files: this Windows environment blocks recursive cleanup.
  build: { chunkSizeWarningLimit: 1600, emptyOutDir: false },
});

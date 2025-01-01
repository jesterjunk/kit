// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures relative paths for static deployment
  build: {
    outDir: 'dist', // Output directory for the build
  },
});

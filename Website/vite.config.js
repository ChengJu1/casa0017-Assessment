// vite.config.js (repo root)
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, 'app/client'),            // where index.html is
  publicDir: path.resolve(__dirname, 'app/client/public'),
  base: './',                    // <== fixes 404s in production (relative paths)
  build: {
    outDir: path.resolve(__dirname, 'dist'), // output in Website/dist
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'app/client/index.html'),
        about: path.resolve(__dirname, 'app/client/about.html'),
        timeline: path.resolve(__dirname, 'app/client/timeline.html'),
        country: path.resolve(__dirname, 'app/client/country.html'),
      },
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});

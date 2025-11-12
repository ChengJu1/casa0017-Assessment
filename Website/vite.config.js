// vite.config.js (repo root)
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'app/client',            // where index.html is
  publicDir: 'app/client/public',
  base: './',                    // <== fixes 404s in production (relative paths)
  build: {
    outDir: '../../dist/client', // output in your-repo/dist/client
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173,
  },
});

// Website/client/vite.config.js
export default {
  server: {
    host: true,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
};

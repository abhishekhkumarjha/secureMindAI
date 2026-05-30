import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true, secure: false },
        '/login': { target: 'http://127.0.0.1:8000', changeOrigin: true, secure: false },
        '/register': { target: 'http://127.0.0.1:8000', changeOrigin: true, secure: false },
        '/profile': { target: 'http://127.0.0.1:8000', changeOrigin: true, secure: false },
        '/logs': { target: 'http://127.0.0.1:8000', changeOrigin: true, secure: false },
        '/threats': { target: 'http://127.0.0.1:8000', changeOrigin: true, secure: false },
        '/incidents': { target: 'http://127.0.0.1:8000', changeOrigin: true, secure: false },
        '/investigate': { target: 'http://127.0.0.1:8000', changeOrigin: true, secure: false },
        '/detect': { target: 'http://127.0.0.1:8000', changeOrigin: true, secure: false },
      },
    },
  };
});

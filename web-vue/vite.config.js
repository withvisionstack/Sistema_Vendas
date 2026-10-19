import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: '0.0.0.0',          // ✅ aceita conexões da rede local
    allowedHosts: true,        // ✅ aceita ngrok e qualquer domínio
    proxy: {
      '/api': {
        target: 'http://localhost:9090',
        changeOrigin: true,
      },
      '/tiles': {
        target: 'http://localhost:9090',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,  // esconde aviso de chunk grande
  },
});
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    server: {
        port: 5173,
        host: '0.0.0.0',
        allowedHosts: true,
        headers: {
            'Cache-Control': 'no-store',
        },
        hmr: {
            clientPort: 443,
        },
        proxy: {
            '/api': {
                target: 'http://localhost:9090',
                changeOrigin: true,
            },
            // ✅ AGORA dentro do proxy
            '/uploads': {
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
        chunkSizeWarningLimit: 1500,
    },
});
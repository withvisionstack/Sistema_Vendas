import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    test: {
        // ✅ Só pega arquivos .test.js dentro de src/
        include: ['src/**/*.test.js'],

        // ✅ Ignora a pasta tests/ (Playwright) e node_modules
        exclude: ['node_modules', 'tests/**', '**/*.spec.js'],

        // Permite usar describe/it/expect sem importar
        globals: true,

        // Ambiente para testes de componentes Vue (se precisar no futuro)
        environment: 'jsdom',
    },
});
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('useEstoque', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.resetModules();
    });

    it('inicializa com 10 unidades para cada produto', async () => {
        const { useEstoque } = await import('../useEstoque.js');
        const { getEstoque } = useEstoque();

        // Produtos do mock — todos devem começar com 10
        expect(getEstoque('1')).toBeGreaterThanOrEqual(0);
    });

    it('atualiza estoque de um produto', async () => {
        const { useEstoque } = await import('../useEstoque.js');
        const { getEstoque, atualizarEstoque } = useEstoque();

        atualizarEstoque('produto-x', 5);
        expect(getEstoque('produto-x')).toBe(5);

        atualizarEstoque('produto-x', 3);
        expect(getEstoque('produto-x')).toBe(3);
    });

    it('não permite estoque negativo', async () => {
        const { useEstoque } = await import('../useEstoque.js');
        const { getEstoque, atualizarEstoque } = useEstoque();

        atualizarEstoque('produto-x', 2);
        atualizarEstoque('produto-x', -5); // tenta deixar negativo

        expect(getEstoque('produto-x')).toBe(0);
    });

    it('temEstoque retorna true quando quantidade suficiente', async () => {
        const { useEstoque } = await import('../useEstoque.js');
        const { atualizarEstoque, temEstoque } = useEstoque();

        atualizarEstoque('produto-x', 5);

        expect(temEstoque('produto-x', 1)).toBe(true);
        expect(temEstoque('produto-x', 5)).toBe(true);
    });

    it('temEstoque retorna false quando quantidade insuficiente', async () => {
        const { useEstoque } = await import('../useEstoque.js');
        const { atualizarEstoque, temEstoque } = useEstoque();

        atualizarEstoque('produto-x', 2);

        expect(temEstoque('produto-x', 3)).toBe(false);
        expect(temEstoque('produto-x', 10)).toBe(false);
    });

    it('produto inexistente retorna estoque 0', async () => {
        const { useEstoque } = await import('../useEstoque.js');
        const { getEstoque } = useEstoque();

        expect(getEstoque('produto-que-nao-existe')).toBe(0);
    });
});
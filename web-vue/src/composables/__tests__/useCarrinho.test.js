import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('useCarrinho', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.resetModules();
    });

    it('começa com carrinho vazio', async () => {
        const { useCarrinho } = await import('../useCarrinho.js');
        const { itens, totalItens, valorTotal } = useCarrinho();

        expect(itens.value).toEqual([]);
        expect(totalItens.value).toBe(0);
        expect(valorTotal.value).toBe(0);
    });

    it('adiciona item corretamente', async () => {
        const { useCarrinho } = await import('../useCarrinho.js');
        const { itens, adicionarItem, totalItens } = useCarrinho();

        adicionarItem({
            produtoId: '1',
            nome: 'X-Burger',
            quantidade: 2,
            precoTotal: 50
        });

        expect(itens.value.length).toBe(1);
        expect(totalItens.value).toBe(2);
    });

    it('soma total de múltiplos itens', async () => {
        const { useCarrinho } = await import('../useCarrinho.js');
        const { adicionarItem, valorTotal, totalItens } = useCarrinho();

        adicionarItem({ nome: 'X-Burger', quantidade: 2, precoTotal: 50 });
        adicionarItem({ nome: 'Coca', quantidade: 1, precoTotal: 8 });

        expect(valorTotal.value).toBe(58);
        expect(totalItens.value).toBe(3);
    });

    it('remove item pelo id', async () => {
        const { useCarrinho } = await import('../useCarrinho.js');
        const { itens, adicionarItem, removerItem } = useCarrinho();

        adicionarItem({ nome: 'X-Burger', quantidade: 1, precoTotal: 25 });
        const idDoItem = itens.value[0].id;

        removerItem(idDoItem);

        expect(itens.value.length).toBe(0);
    });

    it('limpar carrinho remove tudo', async () => {
        const { useCarrinho } = await import('../useCarrinho.js');
        const { itens, adicionarItem, limparCarrinho } = useCarrinho();

        adicionarItem({ nome: 'A', quantidade: 1, precoTotal: 10 });
        adicionarItem({ nome: 'B', quantidade: 1, precoTotal: 20 });

        limparCarrinho();

        expect(itens.value.length).toBe(0);
    });

    it('persiste no localStorage', async () => {
        const { useCarrinho } = await import('../useCarrinho.js');
        const { adicionarItem } = useCarrinho();

        adicionarItem({ nome: 'X-Burger', quantidade: 1, precoTotal: 25 });

        // Aguarda o watch (que é async) rodar
        await new Promise(r => setTimeout(r, 10));

        const salvo = JSON.parse(localStorage.getItem('@delivery:carrinho'));
        expect(salvo.length).toBe(1);
        expect(salvo[0].nome).toBe('X-Burger');
    });
});
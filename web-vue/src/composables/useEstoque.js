import { computed } from 'vue';
import { useProdutos } from './useProdutos.js';

/**
 * useEstoque
 * ────────────────────────────────────────────────────────────
 * Camada de compatibilidade sobre o useProdutos.
 *
 * - Os dados reais vêm da API (via useProdutos → GET /api/produtos)
 * - Não usa localStorage nem cardapio-mock.js
 * - Atualização é assíncrona (chama PUT /api/produtos/:id/estoque)
 *
 * ⚠️ IMPORTANTE: `atualizarEstoque` agora é ASYNC.
 *    Quem chama precisa usar `await`.
 */
export function useEstoque() {
    const {
        produtos,
        carregarProdutos,
        atualizarEstoque: atualizarProdutoAPI
    } = useProdutos();

    // ─── Mapa reativo { produtoId: estoque } ───
    // Mantém a API antiga (`estoque.value[id]`), mas o valor
    // é derivado do produto (vem da API).
    const estoque = computed(() => {
        const map = {};
        for (const p of produtos.value) {
            map[p.id] = Number(p.estoque) || 0;
        }
        return map;
    });

    // ─── Consulta síncrona ───
    const getEstoque = (produtoId) => {
        if (!produtoId) return 0;
        const produto = produtos.value.find(p => p.id === produtoId);
        return produto ? Number(produto.estoque) || 0 : 0;
    };

    // ─── Atualização (async, chama a API) ───
    const atualizarEstoque = async (produtoId, quantidade) => {
        if (!produtoId) return;

        const novoValor = Math.max(0, Number(quantidade) || 0);
        await atualizarProdutoAPI(produtoId, novoValor);
    };

    // ─── Verificação de disponibilidade ───
    const temEstoque = (produtoId, qtdDesejada = 1) => {
        return getEstoque(produtoId) >= qtdDesejada;
    };

    return {
        estoque,
        getEstoque,
        atualizarEstoque,
        temEstoque,
        // Repassa carregarProdutos pra quem quiser forçar refresh
        carregarProdutos
    };
}
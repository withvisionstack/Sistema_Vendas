import { ref, watch } from 'vue';
import { produtos } from '../data/cardapio-mock.js';

// Inicializa o estoque com os produtos do mock (padrão: 10 unidades)
const estoque = ref(JSON.parse(localStorage.getItem('@delivery:estoque')) || {});

// Se for a primeira vez, popula o estoque
if (Object.keys(estoque.value).length === 0) {
    produtos.forEach(p => {
        estoque.value[p.id] = 10; // Estoque inicial de 10 para cada
    });
}

export function useEstoque() {
    watch(estoque, (novo) => {
        localStorage.setItem('@delivery:estoque', JSON.stringify(novo));
    }, { deep: true });

    const getEstoque = (produtoId) => {
        return estoque.value[produtoId] ?? 0;
    };

    const atualizarEstoque = (produtoId, quantidade) => {
        estoque.value[produtoId] = Math.max(0, quantidade);
    };

    const temEstoque = (produtoId, qtdDesejada = 1) => {
        return getEstoque(produtoId) >= qtdDesejada;
    };

    return {
        estoque,
        getEstoque,
        atualizarEstoque,
        temEstoque
    };
}
import { ref, watch, computed } from 'vue';
import { produtos as produtosMock } from '../data/cardapio-mock.js';

// ✅ Carrega com validação (evita dados corrompidos)
const carregarProdutos = () => {
    try {
        const salvo = localStorage.getItem('@delivery:produtos');
        if (salvo) {
            const parsed = JSON.parse(salvo);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn('Erro ao carregar produtos do localStorage:', e);
    }
    return [...produtosMock]; // Cópia segura do mock
};

const produtos = ref(carregarProdutos());

export function useProdutos() {
    watch(produtos, (novo) => {
        try {
            localStorage.setItem('@delivery:produtos', JSON.stringify(novo));
        } catch (e) {
            alert("Erro ao salvar. O localStorage pode estar cheio (imagem muito grande).");
        }
    }, { deep: true });

    // ✅ Sempre retorna um array, mesmo que algo dê errado
    const listaProdutos = computed(() => {
        return Array.isArray(produtos.value) ? produtos.value : [];
    });

    const adicionarProduto = (produto) => {
        produtos.value.push({ ...produto, id: Date.now().toString() });
    };

    const editarProduto = (id, dadosAtualizados) => {
        const index = produtos.value.findIndex(p => p.id === id);
        if (index !== -1) {
            produtos.value[index] = { ...produtos.value[index], ...dadosAtualizados };
        }
    };

    const removerProduto = (id) => {
        produtos.value = produtos.value.filter(p => p.id !== id);
    };

    return {
        produtos,
        listaProdutos, // ✅ Use este para arrays filtrados
        adicionarProduto,
        editarProduto,
        removerProduto
    };
}
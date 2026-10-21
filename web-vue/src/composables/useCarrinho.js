import { ref, computed, watch } from 'vue';

// ⚠️ IMPORTANTE: O 'itens' DEVE ficar FORA da função para ser compartilhado!
const itens = ref(JSON.parse(localStorage.getItem('@delivery:carrinho')) || []);

export function useCarrinho() {
    console.log('🟢 useCarrinho foi chamado. Itens atuais:', itens.value);

    watch(itens, (novoValor) => {
        localStorage.setItem('@delivery:carrinho', JSON.stringify(novoValor));
        console.log('💾 Salvou no localStorage:', novoValor);
    }, { deep: true });

    const totalItens = computed(() => {
        return itens.value.reduce((acc, item) => acc + item.quantidade, 0);
    });

    const valorTotal = computed(() => {
        return itens.value.reduce((acc, item) => acc + item.precoTotal, 0);
    });

    const adicionarItem = (item) => {
        console.log('📥 Recebendo item para adicionar:', item);
        const novoItem = { ...item, id: Date.now().toString() };
        itens.value.push(novoItem);
        console.log('✅ Item adicionado! Novo array:', itens.value);
    };

    const removerItem = (id) => {
        itens.value = itens.value.filter(item => item.id !== id);
    };

    const limparCarrinho = () => {
        itens.value = [];
    };

    return {
        itens,
        totalItens,
        valorTotal,
        adicionarItem,
        removerItem,
        limparCarrinho
    };
}
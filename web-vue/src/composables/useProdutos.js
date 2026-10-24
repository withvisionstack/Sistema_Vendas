import { ref, computed } from 'vue';

// ═══════════════════════════════════════════════════════════
// ESTADO GLOBAL (singleton — compartilhado entre componentes)
// ═══════════════════════════════════════════════════════════
const produtos = ref([]);
const carregando = ref(false);
const erro = ref(null);
const carregado = ref(false); // evita carregar 2x ao abrir múltiplos componentes

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

const API_URL = '/api/produtos';

const handleResponse = async (res) => {
    if (!res.ok) {
        let msg = `Erro ${res.status}`;
        try {
            const data = await res.json();
            msg = data.erro || msg;
        } catch { /* ignora */ }
        throw new Error(msg);
    }
    return res.json();
};

// ═══════════════════════════════════════════════════════════
// API PÚBLICA
// ═══════════════════════════════════════════════════════════

export function useProdutos() {
    // ─────────────────────────────────────────────
    // LISTAR (carrega da API)
    // ─────────────────────────────────────────────
    const carregarProdutos = async (forcar = false) => {
        if (carregado.value && !forcar) return;

        carregando.value = true;
        erro.value = null;
        try {
            const res = await fetch(API_URL);
            const data = await handleResponse(res);
            produtos.value = data || [];
            carregado.value = true;
        } catch (e) {
            erro.value = e.message;
            console.error('[useProdutos] Erro ao carregar:', e);
        } finally {
            carregando.value = false;
        }
    };

    // ─────────────────────────────────────────────
    // CRIAR
    // ─────────────────────────────────────────────
    const adicionarProduto = async (produto) => {
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produto)
            });
            const novo = await handleResponse(res);
            produtos.value.push(novo);
            return novo;
        } catch (e) {
            console.error('[useProdutos] Erro ao criar:', e);
            throw e;
        }
    };

    // ─────────────────────────────────────────────
    // EDITAR
    // ─────────────────────────────────────────────
    const editarProduto = async (id, dados) => {
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            const atualizado = await handleResponse(res);

            // Substitui na lista reativa
            const index = produtos.value.findIndex(p => p.id === id);
            if (index !== -1) {
                produtos.value[index] = atualizado;
            }
            return atualizado;
        } catch (e) {
            console.error('[useProdutos] Erro ao editar:', e);
            throw e;
        }
    };

    // ─────────────────────────────────────────────
    // REMOVER (soft delete)
    // ─────────────────────────────────────────────
    const removerProduto = async (id) => {
        try {
            const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            await handleResponse(res);

            // Remove da lista reativa
            produtos.value = produtos.value.filter(p => p.id !== id);
        } catch (e) {
            console.error('[useProdutos] Erro ao remover:', e);
            throw e;
        }
    };

    // ─────────────────────────────────────────────
    // ATUALIZAR ESTOQUE (endpoint dedicado)
    // ─────────────────────────────────────────────
    const atualizarEstoque = async (id, novoEstoque) => {
        try {
            const res = await fetch(`${API_URL}/${id}/estoque`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estoque: novoEstoque })
            });
            const atualizado = await handleResponse(res);

            const index = produtos.value.findIndex(p => p.id === id);
            if (index !== -1) {
                produtos.value[index] = atualizado;
            }
            return atualizado;
        } catch (e) {
            console.error('[useProdutos] Erro ao atualizar estoque:', e);
            throw e;
        }
    };

    // ─────────────────────────────────────────────
    // COMPUTED
    // ─────────────────────────────────────────────
    const listaProdutos = computed(() => {
        return Array.isArray(produtos.value) ? produtos.value : [];
    });

    // ─────────────────────────────────────────────
    // RETORNO (compatível com o código antigo)
    // ─────────────────────────────────────────────
    return {
        // Estado
        produtos,
        listaProdutos,
        carregando,
        erro,

        // Ações
        carregarProdutos,
        adicionarProduto,
        editarProduto,
        removerProduto,
        atualizarEstoque
    };
}
import { ref } from 'vue';

// ═══════════════════════════════════════════════════════════
// ESTADO GLOBAL (singleton)
// ═══════════════════════════════════════════════════════════
const entregadores = ref([]);
const carregando = ref(false);
const erro = ref(null);
const carregado = ref(false);

// ═══════════════════════════════════════════════════════════
// API PÚBLICA
// ═══════════════════════════════════════════════════════════
export function useEntregadores() {
    // ─────────────────────────────────────────────
    // CARREGAR
    // ─────────────────────────────────────────────
    const carregarEntregadores = async (forcar = false) => {
        if (carregado.value && !forcar) return;

        carregando.value = true;
        erro.value = null;

        try {
            const res = await fetch('/api/entregadores');
            if (!res.ok) throw new Error(`Erro ${res.status}`);

            const data = await res.json();
            entregadores.value = Array.isArray(data) ? data : [];
            carregado.value = true;
        } catch (e) {
            erro.value = e.message;
            console.error('[useEntregadores] Erro ao carregar:', e);
        } finally {
            carregando.value = false;
        }
    };

    // ─────────────────────────────────────────────
    // CRIAR (backend gera ID + código automaticamente)
    // ─────────────────────────────────────────────
    const adicionarEntregador = async (dados) => {
        try {
            const res = await fetch('/api/entregadores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: dados.nome,
                    cpf: dados.cpf || '',
                    placa: dados.placa || '',
                    modelo: dados.modelo || '',
                    ano: dados.ano || '',
                    whatsapp: dados.whatsapp || '',
                    foto: dados.foto || '',
                    status: dados.status || 'ativo',
                    dataRegistro: dados.dataRegistro || new Date().toISOString().split('T')[0],
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.erro || `Erro ${res.status}`);
            }

            const novo = await res.json();
            entregadores.value.push(novo);
            entregadores.value.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

            return novo;
        } catch (e) {
            console.error('[useEntregadores] Erro ao criar:', e);
            throw e;
        }
    };

    // ─────────────────────────────────────────────
    // ATUALIZAR
    // ─────────────────────────────────────────────
    const atualizarEntregador = async (id, dados) => {
        try {
            const res = await fetch(`/api/entregadores/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: dados.nome,
                    cpf: dados.cpf || '',
                    placa: dados.placa || '',
                    modelo: dados.modelo || '',
                    ano: dados.ano || '',
                    whatsapp: dados.whatsapp || '',
                    foto: dados.foto || '',
                    status: dados.status || 'ativo',
                    dataRegistro: dados.dataRegistro || '',
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.erro || `Erro ${res.status}`);
            }

            const atualizado = await res.json();
            const index = entregadores.value.findIndex(e => e.id === id);
            if (index !== -1) {
                entregadores.value[index] = atualizado;
            }

            return atualizado;
        } catch (e) {
            console.error('[useEntregadores] Erro ao atualizar:', e);
            throw e;
        }
    };

    // ─────────────────────────────────────────────
    // REMOVER (soft delete)
    // ─────────────────────────────────────────────
    const removerEntregador = async (id) => {
        try {
            const res = await fetch(`/api/entregadores/${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.erro || `Erro ${res.status}`);
            }

            entregadores.value = entregadores.value.filter(e => e.id !== id);
        } catch (e) {
            console.error('[useEntregadores] Erro ao remover:', e);
            throw e;
        }
    };

    // ─────────────────────────────────────────────
    // REGENERAR CÓDIGO (backend gera novo código único)
    // ─────────────────────────────────────────────
    const regenerarCodigo = async (id) => {
        try {
            const res = await fetch(`/api/entregadores/${id}/regenerar-codigo`, {
                method: 'POST'
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.erro || `Erro ${res.status}`);
            }

            const atualizado = await res.json();
            const index = entregadores.value.findIndex(e => e.id === id);
            if (index !== -1) {
                entregadores.value[index] = atualizado;
            }

            return atualizado.codigoAcesso;
        } catch (e) {
            console.error('[useEntregadores] Erro ao regenerar código:', e);
            throw e;
        }
    };

    // ─────────────────────────────────────────────
    // BUSCAR POR CÓDIGO (usado pelo login do entregador)
    // ─────────────────────────────────────────────
    const buscarPorCodigo = (codigo) => {
        return entregadores.value.find(
            e => e.codigoAcesso === codigo && e.status === 'ativo'
        ) || null;
    };

    return {
        entregadores,
        carregando,
        erro,
        carregarEntregadores,
        adicionarEntregador,
        atualizarEntregador,
        removerEntregador,
        regenerarCodigo,
        buscarPorCodigo,
    };
}
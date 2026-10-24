import { ref } from 'vue';

// ═══════════════════════════════════════════════════════════
// ESTADO GLOBAL (singleton)
// ═══════════════════════════════════════════════════════════
const taxas = ref([]);
const carregando = ref(false);
const erro = ref(null);
const carregado = ref(false);

// ═══════════════════════════════════════════════════════════
// API PÚBLICA
// ═══════════════════════════════════════════════════════════
export function useTaxasEntrega() {
    // ─────────────────────────────────────────────
    // CARREGAR
    // ─────────────────────────────────────────────
    const carregarTaxas = async (forcar = false) => {
        if (carregado.value && !forcar) return;

        carregando.value = true;
        erro.value = null;

        try {
            const res = await fetch('/api/taxas');
            if (!res.ok) throw new Error(`Erro ${res.status}`);

            const data = await res.json();
            taxas.value = Array.isArray(data) ? data : [];
            carregado.value = true;
        } catch (e) {
            erro.value = e.message;
            console.error('[useTaxasEntrega] Erro:', e);
        } finally {
            carregando.value = false;
        }
    };

    // ─────────────────────────────────────────────
    // SALVAR (cria ou atualiza — backend é upsert)
    // ─────────────────────────────────────────────
    const salvarTaxa = async (bairro, valor) => {
        try {
            const res = await fetch('/api/taxas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bairro: bairro.trim(),
                    taxa: Number(valor)
                })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.erro || `Erro ${res.status}`);
            }

            const salva = await res.json();

            // Atualiza ou adiciona no array local
            const index = taxas.value.findIndex(t =>
                t.bairro.toLowerCase() === salva.bairro.toLowerCase()
            );
            if (index >= 0) {
                taxas.value[index] = salva;
            } else {
                taxas.value.push(salva);
            }

            // Ordena alfabeticamente para manter consistência com o backend
            taxas.value.sort((a, b) =>
                a.bairro.localeCompare(b.bairro, 'pt-BR')
            );

            return salva;
        } catch (e) {
            console.error('[useTaxasEntrega] Erro ao salvar:', e);
            throw e;
        }
    };

    // ─────────────────────────────────────────────
    // REMOVER
    // ─────────────────────────────────────────────
    const removerTaxa = async (bairro) => {
        try {
            const res = await fetch(`/api/taxas/${encodeURIComponent(bairro)}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.erro || `Erro ${res.status}`);
            }

            taxas.value = taxas.value.filter(t =>
                t.bairro.toLowerCase() !== bairro.toLowerCase()
            );
        } catch (e) {
            console.error('[useTaxasEntrega] Erro ao remover:', e);
            throw e;
        }
    };

    // ─────────────────────────────────────────────
    // CONSULTAR (síncrono — usa array local)
    // ─────────────────────────────────────────────
    const obterTaxaPorBairro = (bairro) => {
        if (!bairro) return 0;

        const encontrada = taxas.value.find(t =>
            t.bairro.toLowerCase() === bairro.toLowerCase()
        );

        if (!encontrada) return 0;

        // ⚠️ decimal do Go vem como string ("5.00") → converter
        return parseFloat(encontrada.taxa) || 0;
    };

    return {
        taxas,
        carregando,
        erro,
        carregarTaxas,
        salvarTaxa,
        removerTaxa,
        obterTaxaPorBairro
    };
}
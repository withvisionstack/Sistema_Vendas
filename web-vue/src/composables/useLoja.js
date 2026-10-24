import { ref, computed, watch } from 'vue';

// ═══════════════════════════════════════════════════════════
// CONFIG PADRÃO (enquanto a API carrega)
// ═══════════════════════════════════════════════════════════
const CONFIG_PADRAO = {
    id: 0,
    nome: 'Hamburgueria',
    logo: '🍔',
    capas: [],
    cnpj: '',
    chavePix: '',
    nomeBeneficiario: '',
    cidadeBeneficiario: '',
    aberto: true,
    horarioAbertura: '18:00',
    horarioFechamento: '23:59',
    coordenadas: { lat: -23.5507, lng: -51.4607 },
    emailContato: '',
    cidadeSede: '',
    nomeDPO: '',
    emailDPO: '',
    tempoEntregaPadrao: 30,
};

// ═══════════════════════════════════════════════════════════
// ESTADO GLOBAL
// ═══════════════════════════════════════════════════════════
const configLoja = ref({ ...CONFIG_PADRAO });
const carregando = ref(false);
const erro = ref(null);
const carregado = ref(false);

// Relógio reativo (recalcula lojaEstaAberta a cada 30s)
const agora = ref(new Date());
setInterval(() => {
    agora.value = new Date();
}, 30000);

// ═══════════════════════════════════════════════════════════
// API PÚBLICA
// ═══════════════════════════════════════════════════════════
export function useLoja() {
    // ─────────────────────────────────────────────
    // CARREGAR DA API
    // ─────────────────────────────────────────────
    const carregarLoja = async (forcar = false) => {
        if (carregado.value && !forcar) return;

        carregando.value = true;
        erro.value = null;

        try {
            const res = await fetch('/api/loja');
            if (!res.ok) throw new Error(`Erro ${res.status}`);

            const data = await res.json();
            configLoja.value = { ...CONFIG_PADRAO, ...data };
            carregado.value = true;
        } catch (e) {
            erro.value = e.message;
            console.error('[useLoja] Erro ao carregar:', e);
        } finally {
            carregando.value = false;
        }
    };

    // ─────────────────────────────────────────────
    // SALVAR NA API
    // ─────────────────────────────────────────────
    const salvarConfiguracoes = async (dados) => {
        try {
            const res = await fetch('/api/loja', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.erro || `Erro ${res.status}`);
            }

            const atualizado = await res.json();
            configLoja.value = { ...CONFIG_PADRAO, ...atualizado };
            agora.value = new Date();

            return atualizado;
        } catch (e) {
            console.error('[useLoja] Erro ao salvar:', e);
            throw e;
        }
    };

    // ─────────────────────────────────────────────
    // LOJA ABERTA (computed)
    // ─────────────────────────────────────────────
    const lojaEstaAberta = computed(() => {
        if (!configLoja.value.aberto) return false;

        const horaAtual = agora.value.getHours() * 60 + agora.value.getMinutes();

        const [hAberta, mAberta] = (configLoja.value.horarioAbertura || '00:00')
            .split(':')
            .map(Number);
        const [hFecha, mFecha] = (configLoja.value.horarioFechamento || '23:59')
            .split(':')
            .map(Number);

        const minutosAbertura = hAberta * 60 + mAberta;
        const minutosFechamento = hFecha * 60 + mFecha;

        // Horário que vira a madrugada (ex: 18:00 às 02:00)
        if (minutosAbertura <= minutosFechamento) {
            return horaAtual >= minutosAbertura && horaAtual <= minutosFechamento;
        } else {
            return horaAtual >= minutosAbertura || horaAtual <= minutosFechamento;
        }
    });

    return {
        configLoja,
        carregando,
        erro,
        lojaEstaAberta,
        carregarLoja,
        salvarConfiguracoes,
    };
}
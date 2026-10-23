import { ref, watch } from 'vue';

const entregadores = ref(JSON.parse(localStorage.getItem('@delivery:entregadores')) || []);

export function useEntregadores() {
    watch(entregadores, (novo) => {
        localStorage.setItem('@delivery:entregadores', JSON.stringify(novo));
    }, { deep: true });

    // ═══════════════════════════════════════════════════════
    // ✅ NOVO: Gera código de 6 dígitos único
    // ═══════════════════════════════════════════════════════
    const gerarCodigoAcesso = () => {
        let codigo, existe;
        do {
            codigo = Math.floor(100000 + Math.random() * 900000).toString();
            existe = entregadores.value.some(e => e.codigoAcesso === codigo);
        } while (existe);
        return codigo;
    };

    // ═══════════════════════════════════════════════════════
    // ✅ MODIFICADO: Adiciona código automaticamente ao cadastrar
    // ═══════════════════════════════════════════════════════
    const adicionarEntregador = (dados) => {
        entregadores.value.push({
            id: Date.now().toString(),
            ...dados,
            // Se o admin não passou um código, gera automaticamente
            codigoAcesso: dados.codigoAcesso || gerarCodigoAcesso()
        });
    };

    const removerEntregador = (id) => {
        entregadores.value = entregadores.value.filter(e => e.id !== id);
    };

    const atualizarEntregador = (id, dados) => {
        const index = entregadores.value.findIndex(e => e.id === id);
        if (index !== -1) {
            entregadores.value[index] = { ...entregadores.value[index], ...dados };
        }
    };

    // ═══════════════════════════════════════════════════════
    // ✅ NOVO: Gera um novo código (caso o entregador perca o antigo)
    // ═══════════════════════════════════════════════════════
    const regenerarCodigo = (id) => {
        const index = entregadores.value.findIndex(e => e.id === id);
        if (index !== -1) {
            const novoCodigo = gerarCodigoAcesso();
            entregadores.value[index].codigoAcesso = novoCodigo;
            return novoCodigo;
        }
        return null;
    };

    // ═══════════════════════════════════════════════════════
    // ✅ NOVO: Migração — gera código para entregadores antigos
    // Roda uma vez ao carregar o composable, corrige quem não tem
    // ═══════════════════════════════════════════════════════
    entregadores.value.forEach(ent => {
        if (!ent.codigoAcesso) {
            ent.codigoAcesso = gerarCodigoAcesso();
        }
    });

    return {
        entregadores,
        adicionarEntregador,
        removerEntregador,
        atualizarEntregador,
        regenerarCodigo // ✅ Nova
    };
}
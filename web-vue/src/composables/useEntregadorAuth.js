import { ref } from 'vue';
import { useEntregadores } from './useEntregadores.js';

const entregadorLogado = ref(
    JSON.parse(sessionStorage.getItem('@delivery:entregador') || 'null')
);

export function useEntregadorAuth() {
    const {
        entregadores,
        carregarEntregadores
    } = useEntregadores();

    // ═══════════════════════════════════════════════════════════
    // LOGIN POR CÓDIGO (agora async — busca da API)
    // ═══════════════════════════════════════════════════════════
    const loginPorCodigo = async (codigo) => {
        if (!codigo || codigo.length !== 6) return false;

        // ✅ Se o array não foi carregado ainda, busca da API
        // (garante que funciona mesmo se o usuário abrir direto /entregador/login)
        if (!entregadores.value.length) {
            await carregarEntregadores(true);
        }

        const entregador = entregadores.value.find(
            e => e.codigoAcesso === codigo && e.status === 'ativo'
        );

        if (!entregador) return false;

        // ✅ Salva só dados necessários (não guarda o código completo no sessionStorage)
        entregadorLogado.value = {
            id: entregador.id,
            nome: entregador.nome,
            foto: entregador.foto,
            placa: entregador.placa
        };

        sessionStorage.setItem(
            '@delivery:entregador',
            JSON.stringify(entregadorLogado.value)
        );

        return true;
    };

    // ═══════════════════════════════════════════════════════════
    // LOGOUT
    // ═══════════════════════════════════════════════════════════
    const logout = () => {
        entregadorLogado.value = null;
        sessionStorage.removeItem('@delivery:entregador');
    };

    return { entregadorLogado, loginPorCodigo, logout };
}
import { ref } from 'vue';
import { useEntregadores } from './useEntregadores.js';

const entregadorLogado = ref(
    JSON.parse(sessionStorage.getItem('@delivery:entregador') || 'null')
);

export function useEntregadorAuth() {
    const { entregadores } = useEntregadores();

    const loginPorCodigo = (codigo) => {
        const entregador = entregadores.value.find(
            e => e.codigoAcesso === codigo && e.status === 'ativo'
        );

        if (entregador) {
            entregadorLogado.value = {
                id: entregador.id,
                nome: entregador.nome,
                foto: entregador.foto,
                placa: entregador.placa
            };
            sessionStorage.setItem('@delivery:entregador', JSON.stringify(entregadorLogado.value));
            return true;
        }
        return false;
    };

    const logout = () => {
        entregadorLogado.value = null;
        sessionStorage.removeItem('@delivery:entregador');
    };

    return { entregadorLogado, loginPorCodigo, logout };
}
// src/composables/useNotificacoes.js
import { ref, computed, watch } from 'vue';

// Estado global
const notificacoes = ref(JSON.parse(localStorage.getItem('@delivery:notificacoes')) || []);

export function useNotificacoes() {
    // Salva no localStorage sempre que mudar
    watch(notificacoes, (novoValor) => {
        localStorage.setItem('@delivery:notificacoes', JSON.stringify(novoValor));
    }, { deep: true });

    // Quantidade de notificações não lidas (para o balãozinho)
    const naoLidas = computed(() => {
        return notificacoes.value.filter(n => !n.lida).length;
    });

    // Adicionar nova notificação
    const adicionar = (titulo, mensagem) => {
        notificacoes.value.unshift({
            id: Date.now().toString(),
            titulo,
            mensagem,
            lida: false,
            data: new Date().toISOString()
        });
    };

    // Marcar todas como lidas (quando abre a caixa de notificações)
    const marcarTodasLidas = () => {
        notificacoes.value.forEach(n => n.lida = true);
    };

    // Limpar histórico (opcional)
    const limpar = () => {
        notificacoes.value = [];
    };

    return {
        notificacoes,
        naoLidas,
        adicionar,
        marcarTodasLidas,
        limpar
    };
}
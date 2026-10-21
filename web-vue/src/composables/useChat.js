import { ref, watch } from 'vue';

const mensagens = ref(JSON.parse(localStorage.getItem('@delivery:chat')) || []);

export function useChat() {
    watch(mensagens, (novo) => {
        localStorage.setItem('@delivery:chat', JSON.stringify(novo));
    }, { deep: true });

    const enviarMensagem = (texto, pedidoId, clienteNome, deLoja) => {
        mensagens.value.push({
            id: Date.now().toString(),
            pedidoId: pedidoId || 'geral',
            clienteNome: clienteNome || 'Cliente',
            texto,
            deLoja, // true se for do admin, false se for do cliente
            hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        });
    };

    return { mensagens, enviarMensagem };
}
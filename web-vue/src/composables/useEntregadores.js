import { ref, watch } from 'vue';

const entregadores = ref(JSON.parse(localStorage.getItem('@delivery:entregadores')) || []);

export function useEntregadores() {
    watch(entregadores, (novo) => {
        localStorage.setItem('@delivery:entregadores', JSON.stringify(novo));
    }, { deep: true });

    const adicionarEntregador = (dados) => {
        entregadores.value.push({
            id: Date.now().toString(),
            ...dados
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

    return {
        entregadores,
        adicionarEntregador,
        removerEntregador,
        atualizarEntregador
    };
}
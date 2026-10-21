import { ref, watch } from 'vue';

const taxas = ref(JSON.parse(localStorage.getItem('@delivery:taxas_entrega')) || [
    { bairro: 'Centro', taxa: 5.00 },
    { bairro: 'Gleba Palhano', taxa: 8.00 },
    { bairro: 'Zona Sul', taxa: 0.00 } // Exemplo de Grátis
]);

export function useTaxasEntrega() {
    watch(taxas, (novo) => {
        localStorage.setItem('@delivery:taxas_entrega', JSON.stringify(novo));
    }, { deep: true });

    // Adiciona ou atualiza um bairro
    const salvarTaxa = (bairro, valor) => {
        const index = taxas.value.findIndex(t => t.bairro.toLowerCase() === bairro.toLowerCase());
        if (index >= 0) {
            taxas.value[index].taxa = valor; // Atualiza se já existir
        } else {
            taxas.value.push({ bairro, taxa: valor }); // Adiciona novo
        }
    };

    const removerTaxa = (bairro) => {
        taxas.value = taxas.value.filter(t => t.bairro !== bairro);
    };

    // Busca o valor do bairro (ignora maiúsculas/minúsculas)
    const obterTaxaPorBairro = (bairro) => {
        if (!bairro) return 0;
        const encontrada = taxas.value.find(t => t.bairro.toLowerCase() === bairro.toLowerCase());
        return encontrada ? encontrada.taxa : 0; // Se não achar, é grátis ou indefinido
    };

    return {
        taxas,
        salvarTaxa,
        removerTaxa,
        obterTaxaPorBairro
    };
}
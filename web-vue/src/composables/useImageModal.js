import { ref } from 'vue';

const aberto = ref(false);
const produtoAtual = ref(null);

export function useImageModal() {
    function abrir(produto) {
        produtoAtual.value = produto;
        aberto.value = true;
        // Bloqueia o scroll do body
        document.body.style.overflow = 'hidden';
    }

    function fechar() {
        aberto.value = false;
        produtoAtual.value = null;
        document.body.style.overflow = '';
    }

    return { aberto, produtoAtual, abrir, fechar };
}
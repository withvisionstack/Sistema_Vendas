<script setup>
import { ref, computed } from 'vue';
import { Minus, Plus, ShoppingCart } from 'lucide-vue-next';
import { useImageModal } from '../../composables/useImageModal.js';
import { useCarrinho } from '../../composables/useCarrinho.js';
import { useLoja } from '../../composables/useLoja.js';
import { useEstoque } from '../../composables/useEstoque.js';
import ModalLojaFechada from './ModalLojaFechada.vue';

const props = defineProps({
    produto: { type: Object, required: true }
});

const quantidade = ref(1);
const { abrir } = useImageModal();
const { adicionarItem } = useCarrinho();
const { lojaEstaAberta } = useLoja();
const { getEstoque } = useEstoque();

const modalFechado = ref(false);

// ✅ Variáveis de Estoque
const estoqueDisponivel = computed(() => getEstoque(props.produto.id));
const temEstoque = computed(() => estoqueDisponivel.value > 0);

function formatarPreco(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

const diminuir = () => {
    if (quantidade.value > 1) quantidade.value--;
};

// ✅ Função que trava o botão de + no limite do estoque
const aumentar = () => {
    if (quantidade.value < estoqueDisponivel.value) {
        quantidade.value++;
    }
};

const adicionar = () => {
    if (!lojaEstaAberta.value) {
        modalFechado.value = true;
        return;
    }

    if (!temEstoque.value) {
        alert('Desculpe, esta bebida está esgotada!');
        return;
    }

    if (quantidade.value > estoqueDisponivel.value) {
        alert(`Só temos ${estoqueDisponivel.value} unidades em estoque.`);
        return;
    }

    const itemCarrinho = {
        produtoId: props.produto.id,
        nome: props.produto.nome,
        descricao: props.produto.descricao,
        imagem: props.produto.imagem,
        quantidade: quantidade.value,
        acompanhamentos: [],
        observacao: '',
        precoTotal: props.produto.preco * quantidade.value
    };

    adicionarItem(itemCarrinho);
    quantidade.value = 1;
};
</script>

<template>
    <div class="bebida-card">
        <!-- Imagem e Tag de Esgotado -->
        <div class="bebida-img-wrap" @click="abrir(produto)">
            <img :src="produto.imagem" :alt="produto.nome" class="bebida-img" />
            <div class="icone-zoom">🔍</div>
            <div v-if="!temEstoque" class="tag-esgotado">ESGOTADO</div>
        </div>

        <!-- Informações -->
        <div class="bebida-info">
            <h3>{{ produto.nome }}</h3>
            <p class="desc">{{ produto.descricao }}</p>
            <div class="preco">{{ formatarPreco(produto.preco) }}</div>
        </div>

        <!-- Ações (Estoque, Quantidade e Botão) -->
        <div class="bebida-acoes">
            <!-- Mostra o estoque disponível -->
            <span class="info-estoque" v-if="temEstoque">
                Estoque: {{ estoqueDisponivel }} un.
            </span>

            <!-- Controle de Quantidade (só aparece se tiver estoque) -->
            <div class="qtd-controle" v-if="temEstoque">
                <button
                    @click="diminuir"
                    class="btn-qtd"
                    :disabled="quantidade <= 1"
                    aria-label="Diminuir quantidade"
                >
                    <Minus :size="14" />
                </button>
                <span>{{ quantidade }}</span>
                <button
                    @click="aumentar"
                    class="btn-qtd"
                    :disabled="quantidade >= estoqueDisponivel"
                    aria-label="Aumentar quantidade"
                >
                    <Plus :size="14" />
                </button>
            </div>

            <!-- Botão de Adicionar -->
            <button
                class="btn-adicionar"
                @click="adicionar"
                :disabled="!temEstoque"
            >
                <ShoppingCart :size="16" />
                <span v-if="temEstoque">Adicionar • {{ formatarPreco(produto.preco * quantidade) }}</span>
                <span v-else>Esgotado</span>
            </button>
        </div>

        <!-- Modal de Loja Fechada -->
        <ModalLojaFechada
            v-if="modalFechado"
            @fechar="modalFechado = false"
        />
    </div>
</template>

<style scoped>
/* ─── ESTRUTURA GERAL ─── */
.bebida-card {
    display: flex;
    flex-direction: column;
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    border: 1px solid rgba(0,0,0,0.04);
    height: 100%;
}

/* ─── IMAGEM ─── */
.bebida-img-wrap {
    position: relative;
    width: 100%;
    height: 120px;
    background: #f5f5f5;
    cursor: zoom-in;
    overflow: hidden;
}

.bebida-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 8px;
    transition: transform 0.3s;
}

.bebida-img-wrap:hover .bebida-img {
    transform: scale(1.05);
}

.icone-zoom {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
}

.bebida-img-wrap:hover .icone-zoom {
    opacity: 1;
}

/* Tag Esgotado */
.tag-esgotado {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0,0,0,0.75);
    color: #fff;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1px;
    pointer-events: none;
}

/* ─── INFORMAÇÕES ─── */
.bebida-info {
    padding: 12px;
    display: flex;
    flex-direction: column;
    flex: 1;
}

.bebida-info h3 {
    font-size: 14px;
    margin: 0 0 4px 0;
    color: #1a1a1a;
    font-weight: 700;
}

.bebida-info .desc {
    font-size: 11px;
    color: #777;
    margin: 0 0 8px 0;
    line-height: 1.3;
    flex: 1;
}

.bebida-info .preco {
    font-size: 16px;
    font-weight: 700;
    color: #dc2626;
    margin-bottom: 12px;
}

/* ─── AÇÕES (ESTOQUE E BOTÕES) ─── */
.bebida-acoes {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: auto;
}

.info-estoque {
    font-size: 11px;
    font-weight: 600;
    color: #16a34a;
    background: #dcfce7;
    padding: 2px 8px;
    border-radius: 4px;
    width: fit-content;
}

.qtd-controle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f5f5f5;
    padding: 4px;
    border-radius: 8px;
}

.qtd-controle span {
    font-weight: 700;
    font-size: 14px;
    min-width: 20px;
    text-align: center;
}

.btn-qtd {
    background: #fff;
    border: 1px solid #ddd;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #333;
}

.btn-qtd:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.btn-adicionar {
    background: #dc2626;
    color: #fff;
    border: none;
    width: 100%;
    padding: 10px 8px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: background 0.2s;
}

.btn-adicionar:hover:not(:disabled) {
    background: #b91c1c;
}

.btn-adicionar:disabled {
    background: #a1a1aa;
    cursor: not-allowed;
    opacity: 0.7;
}
</style>
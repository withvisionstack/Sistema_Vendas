<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Plus, Minus } from 'lucide-vue-next';
import HeaderCliente from '../components/cliente/HeaderCliente.vue';
import SkeletonDetail from '../components/cliente/SkeletonDetail.vue';
import ModalLojaFechada from '../components/cliente/ModalLojaFechada.vue';
import { acompanhamentos } from '../data/cardapio-mock.js';
import { useImageModal } from '../composables/useImageModal.js';
import { useCarrinho } from '../composables/useCarrinho.js';
import { useLoja } from '../composables/useLoja.js';
import { useProdutos } from '../composables/useProdutos.js';
import { useEstoque } from '../composables/useEstoque.js';

const route = useRoute();
const router = useRouter();
const { abrir } = useImageModal();
const { adicionarItem } = useCarrinho();
const { lojaEstaAberta } = useLoja();
const { produtos } = useProdutos(); // ✅ Importação correta
const { getEstoque } = useEstoque();

const carregando = ref(true);
const produto = ref(null);

const quantidade = ref(1);
const selecionados = ref([]);
const observacao = ref('');
const obsSalva = ref(false);
const modalFechado = ref(false);

onMounted(() => {
    setTimeout(() => {
        // ✅ Busca o produto na lista reativa
        produto.value = produtos.value.find(p => p.id === route.params.id) ?? null;
        carregando.value = false;
    }, 1000);
});

const ehBebida = computed(() => produto.value?.categoriaId === 'bebidas');

// ✅ ESTOQUE
const estoqueDisponivel = computed(() => {
    if (!produto.value) return 0;
    if (ehBebida.value) return getEstoque(produto.value.id);
    return 999; // Lanches e porções não têm controle de estoque por enquanto
});

// ✅ PREÇO COM DESCONTO
const precoComDesconto = computed(() => {
    if (!produto.value) return 0;
    const desc = produto.value.desconto || 0;
    return produto.value.preco * (1 - desc / 100);
});

// ✅ TOTAL
const total = computed(() => {
    if (!produto.value) return 0;
    let precoUnitario = precoComDesconto.value;

    if (!ehBebida.value) {
        for (const acId of selecionados.value) {
            const ac = acompanhamentos.find(a => a.id === acId);
            if (ac) precoUnitario += ac.preco;
        }
    }
    return precoUnitario * quantidade.value;
});

watch(observacao, () => {
    obsSalva.value = false;
});

function formatarPreco(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

const voltar = () => router.back();

const diminuirQuantidade = () => {
    if (quantidade.value > 1) quantidade.value--;
};

const aumentarQuantidade = () => {
    if (quantidade.value < estoqueDisponivel.value) {
        quantidade.value++;
    }
};

const toggleAcompanhamento = (id) => {
    const index = selecionados.value.indexOf(id);
    if (index >= 0) selecionados.value.splice(index, 1);
    else selecionados.value.push(id);
};

const salvarObservacao = () => {
    if (!observacao.value.trim()) return;
    obsSalva.value = true;
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }
};

const adicionarAoCarrinho = () => {
    if (!produto.value) return;

    if (!lojaEstaAberta.value) {
        modalFechado.value = true;
        return;
    }

    if (ehBebida.value && quantidade.value > estoqueDisponivel.value) {
        alert(`Só temos ${estoqueDisponivel.value} unidades em estoque.`);
        return;
    }

    const acompCompletos = selecionados.value
        .map(id => acompanhamentos.find(a => a.id === id))
        .filter(Boolean);

    const itemCarrinho = {
        produtoId: produto.value.id,
        nome: produto.value.nome,
        descricao: produto.value.descricao,
        imagem: produto.value.imagem,
        quantidade: quantidade.value,
        acompanhamentos: ehBebida.value ? [] : acompCompletos,
        observacao: ehBebida.value ? '' : observacao.value,
        precoTotal: total.value
    };

    adicionarItem(itemCarrinho);
    router.back();
};
</script>

<template>
    <div class="detalhe-page">
        <HeaderCliente />

        <main class="conteudo">
            <div class="topo">
                <button class="btn-voltar" @click="voltar" aria-label="Voltar">
                    <ArrowLeft :size="24" />
                </button>
            </div>

            <SkeletonDetail v-if="carregando" />

            <div v-else-if="produto">
                <!-- Imagem Principal -->
                <div class="produto-hero" role="button" tabindex="0" @click="abrir(produto)">
                    <img :src="produto.imagem" :alt="produto.nome" class="hero-img" />
                </div>

                <!-- Dados Principais -->
                <div class="produto-detalhes">
                    <h1>{{ produto.nome }}</h1>
                    <p class="desc">{{ produto.descricao }}</p>

                    <!-- ✅ Preço com desconto -->
                    <div class="precos">
                        <template v-if="produto.desconto > 0">
                            <span class="preco-original">{{ formatarPreco(produto.preco) }}</span>
                            <span class="preco-final">{{ formatarPreco(precoComDesconto) }}</span>
                        </template>
                        <span v-else class="preco-final">{{ formatarPreco(produto.preco) }}</span>
                    </div>
                </div>

                <!-- Acompanhamentos (Lanches/Porções) -->
                <template v-if="!ehBebida">
                    <div class="secao-acompanhamentos">
                        <h2>Acompanhamentos</h2>
                        <p class="sub">Escolha os adicionais para o seu lanche</p>
                        <div class="lista-acompanhamentos">
                            <label v-for="ac in acompanhamentos" :key="ac.id" class="item-ac">
                                <input
                                    type="checkbox"
                                    class="checkbox-custom"
                                    :value="ac.id"
                                    :checked="selecionados.includes(ac.id)"
                                    @change="toggleAcompanhamento(ac.id)"
                                />
                                <span class="ac-nome">{{ ac.nome }}</span>
                                <span class="ac-preco">+ {{ formatarPreco(ac.preco) }}</span>
                            </label>
                        </div>
                    </div>

                    <div class="secao-observacao">
                        <h2>Alguma observação?</h2>
                        <p class="sub">Ex: Sem cebola, ponto da carne, etc.</p>
                        <textarea
                            v-model="observacao"
                            placeholder="Digite aqui o que deseja tirar ou alterar..."
                            maxlength="150"
                        ></textarea>
                        <button
                            class="btn-add-obs"
                            :class="{ salvo: obsSalva }"
                            type="button"
                            :disabled="!observacao.trim()"
                            @click="salvarObservacao"
                        >
                            {{ obsSalva ? '✓ Observação Salva' : 'Adicionar Observação' }}
                        </button>
                    </div>
                </template>

                <!-- Quantidade Bebida -->
                <template v-else>
                    <div class="secao-quantidade-bebida">
                        <h2>Quantidade</h2>
                        <p class="sub">Quantas unidades você deseja? (Estoque: {{ estoqueDisponivel }})</p>
                        <div class="seletor-qtd-bebida">
                            <button type="button" :disabled="quantidade <= 1" @click="diminuirQuantidade">
                                <Minus :size="24" />
                            </button>
                            <span>{{ quantidade }}</span>
                            <button type="button" :disabled="quantidade >= estoqueDisponivel" @click="aumentarQuantidade">
                                <Plus :size="24" />
                            </button>
                        </div>
                    </div>
                </template>

                <!-- Rodapé de Ação Fixo -->
                <div class="footer-acao">
                    <div v-if="!ehBebida" class="controle-qtd">
                        <button type="button" :disabled="quantidade <= 1" @click="diminuirQuantidade">
                            <Minus :size="18" />
                        </button>
                        <span>{{ quantidade }}</span>
                        <button type="button" @click="aumentarQuantidade">
                            <Plus :size="18" />
                        </button>
                    </div>

                    <button class="btn-add-carrinho" type="button" @click="adicionarAoCarrinho">
                        Adicionar • {{ formatarPreco(total) }}
                    </button>
                </div>
            </div>
        </main>

        <!-- Modal de Loja Fechada -->
        <ModalLojaFechada v-if="modalFechado" @fechar="modalFechado = false" />
    </div>
</template>

<style scoped>
/* ═══════════════ SEUS ESTILOS PERMANECEM IGUAIS ═══════════════ */
.detalhe-page { min-height: 100vh; background: #f5f0e8; display: flex; flex-direction: column; }
.conteudo { flex: 1; padding: 16px; max-width: 600px; margin: 0 auto; width: 100%; padding-bottom: 100px; }
.topo { margin-bottom: 16px; }
.btn-voltar { background: #fff; border: 1px solid #eee; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
.produto-hero { width: 100%; height: 220px; border-radius: 20px; overflow: hidden; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); cursor: zoom-in; outline: none; }
.hero-img { width: 100%; height: 100%; object-fit: cover; }
.produto-detalhes h1 { font-size: 24px; margin: 0 0 8px 0; color: #1a1a1a; }
.produto-detalhes .desc { font-size: 14px; color: #666; margin: 0 0 12px 0; line-height: 1.5; }

.precos { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
.preco-original { font-size: 16px; color: #a1a1aa; text-decoration: line-through; }
.preco-final { font-size: 22px; font-weight: 800; color: #dc2626; }

h2 { font-size: 18px; margin: 0 0 4px 0; color: #1a1a1a; }
.sub { font-size: 13px; color: #777; margin: 0 0 16px 0; }

.secao-acompanhamentos { background: #fff; padding: 16px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin-bottom: 16px; }
.lista-acompanhamentos { display: flex; flex-direction: column; gap: 12px; }
.item-ac { display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 1px solid #eee; border-radius: 8px; cursor: pointer; }
.item-ac:has(input:checked) { border-color: #dc2626; background: #fef2f2; }
.checkbox-custom { width: 20px; height: 20px; accent-color: #dc2626; margin-right: 12px; }
.ac-nome { flex: 1; font-size: 14px; font-weight: 600; color: #333; }
.ac-preco { font-size: 13px; color: #dc2626; font-weight: 700; }

.secao-observacao { background: #fff; padding: 16px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin-bottom: 16px; }
.secao-observacao textarea { width: 100%; border: 1px solid #ddd; border-radius: 8px; padding: 12px; font-family: inherit; font-size: 14px; resize: none; outline: none; background: #fafafa; }
.secao-observacao textarea:focus { border-color: #dc2626; background: #fff; }
.btn-add-obs { margin-top: 12px; width: 100%; padding: 12px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; color: #333; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s ease; }
.btn-add-obs:hover:not(:disabled) { background: #eee; }
.btn-add-obs:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-add-obs.salvo { background: #dcfce7; border-color: #16a34a; color: #16a34a; }

.secao-quantidade-bebida { background: #fff; padding: 20px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin-bottom: 16px; text-align: center; }
.seletor-qtd-bebida { display: inline-flex; align-items: center; gap: 24px; background: #f5f5f5; padding: 12px 24px; border-radius: 16px; margin-top: 8px; }
.seletor-qtd-bebida button { background: #fff; border: 1px solid #ddd; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #dc2626; transition: transform 0.1s ease; }
.seletor-qtd-bebida button:active:not(:disabled) { transform: scale(0.9); }
.seletor-qtd-bebida button:disabled { opacity: 0.4; cursor: not-allowed; }
.seletor-qtd-bebida span { font-size: 24px; font-weight: 800; min-width: 30px; }

.footer-acao { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; padding: 16px; display: flex; gap: 12px; align-items: center; box-shadow: 0 -4px 12px rgba(0,0,0,0.05); padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px)); z-index: 100; }
.controle-qtd { display: flex; align-items: center; gap: 12px; background: #f5f5f5; padding: 8px 12px; border-radius: 8px; }
.controle-qtd button { background: #fff; border: 1px solid #ddd; width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.controle-qtd button:disabled { opacity: 0.4; cursor: not-allowed; }
.controle-qtd span { font-weight: 700; font-size: 16px; min-width: 20px; text-align: center; }
.btn-add-carrinho { flex: 1; background: #dc2626; color: #fff; border: none; padding: 16px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 8px rgba(220,38,38,0.3); }
</style>
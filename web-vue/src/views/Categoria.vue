<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft } from 'lucide-vue-next';
import HeaderCliente from '../components/cliente/HeaderCliente.vue';
import BottomNav from '../components/cliente/BottomNav.vue';
import ProdutoCard from '../components/cliente/ProdutoCard.vue';
import BebidaCard from '../components/cliente/BebidaCard.vue';
import SkeletonCard from '../components/cliente/SkeletonCard.vue';
import { useProdutos } from '../composables/useProdutos.js';
import { categorias } from '../data/cardapio-mock.js'; // ✅ O CULPADO ERA A FALTA DESSA LINHA

const props = defineProps({
    categoriaFixa: { type: String, default: null }
});

const route = useRoute();
const router = useRouter();

const { produtos, carregarProdutos } = useProdutos();
const carregando = ref(true);


const categoriaId = computed(() => props.categoriaFixa || route.params.id);
const categoriaAtual = computed(() => categorias.find(c => c.id === categoriaId.value));

// Produtos filtrados pela categoria atual
const produtosDaCategoria = computed(() => 
    produtos.value.filter(p => p.categoriaId === categoriaId.value)
);


// Verifica se a tela atual é de bebidas
const ehBebida = computed(() => categoriaId.value === 'bebidas');


onMounted(async () => {
    await carregarProdutos();
    carregando.value = false;
});

const voltar = () => router.back();

// Apenas para navegar para a tela de detalhes (onde o usuário escolhe os adicionais)
const selecionarProduto = (produto) => router.push(`/produto/${produto.id}`);
</script>
<template>
    <div class="categoria-page">
        <HeaderCliente />

        <main class="conteudo">
            <div class="topo-categoria">
                <button class="btn-voltar" @click="voltar">
                    <ArrowLeft :size="24" />
                </button>
                <h1 v-if="categoriaAtual">{{ categoriaAtual.emoji }} {{ categoriaAtual.nome }}</h1>
            </div>

            <!-- SKELETON (Se estiver carregando) -->
            <div v-if="carregando" class="grid-produtos">
                <SkeletonCard v-for="i in 4" :key="'sk-'+i" />
            </div>

            <!-- CONTEÚDO REAL -->
            <div v-else-if="produtosDaCategoria.length > 0" class="grid-produtos">

                <!-- Se for BEBIDA, usa BebidaCard -->
                <template v-if="ehBebida">
                    <BebidaCard
                        v-for="prod in produtosDaCategoria"
                        :key="prod.id"
                        :produto="prod"
                    />
                </template>

                <!-- Se for LANCHE/PORÇÃO, usa ProdutoCard -->
                <template v-else>
                    <ProdutoCard
                        v-for="prod in produtosDaCategoria"
                        :key="prod.id"
                        :produto="prod"
                        @selecionar="selecionarProduto"
                    />
                </template>

            </div>

            <div v-else class="vazio">
                <p>Nenhum produto encontrado nesta categoria.</p>
            </div>
        </main>

        <!-- ✅ Limpo: O BottomNav não precisa mais receber essas props -->
        <BottomNav />
    </div>
</template>




<style scoped>
/* Estilos mantidos iguais */
.categoria-page { min-height: 100vh; background: #ffffff; display: flex; flex-direction: column; }
.conteudo { flex: 1; padding: 16px; max-width: 800px; margin: 0 auto; width: 100%; }
.topo-categoria { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
.btn-voltar { background: #fff; border: 1px solid #eee; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #1a1a1a; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
.topo-categoria h1 { font-size: 20px; margin: 0; color: #1a1a1a; }

.grid-produtos { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
@media (min-width: 600px) { .grid-produtos { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 900px) { .grid-produtos { grid-template-columns: repeat(4, 1fr); } }

.vazio { text-align: center; color: #777; margin-top: 40px; }
@media (max-width: 767px) { .conteudo { padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); } }
</style>
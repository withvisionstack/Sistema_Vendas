<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProdutos } from '../composables/useProdutos.js'; // ✅ Novo import
import { useLoja } from '../composables/useLoja.js';

import HeaderCliente from '../components/cliente/HeaderCliente.vue';
import ProdutoCard from '../components/cliente/ProdutoCard.vue';
import FooterCliente from '../components/cliente/FooterCliente.vue';
import BottomNav from '../components/cliente/BottomNav.vue';
import CookieConsentBanner from '../components/cliente/CookieConsentBanner.vue';
import SkeletonCardapio from '../components/cliente/SkeletonCardapio.vue';
import ModalLojaFechada from '../components/cliente/ModalLojaFechada.vue';

const router = useRouter();
const { lojaEstaAberta, configLoja } = useLoja();
const { produtos } = useProdutos(); // ✅ Puxa do composable

const carregando = ref(true);
const mostrarModalFechado = ref(false);

// ✅ CORRIGIDO: Use produtos.value.filter (com .value)
const lanches = computed(() => produtos.value.filter(p => p.categoriaId === 'lanches'));
const porcoes = computed(() => produtos.value.filter(p => p.categoriaId === 'porcoes'));


const selecionarProduto = (produto) => router.push(`/produto/${produto.id}`);

// ─── CARROSSEL DE CAPAS ───
const capas = computed(() => configLoja.value?.capas || []);
const capaAtiva = ref(0);
let carrosselInterval = null;

// ─── MODAL EXCLUSIVO DA CAPA ───
const coverModalAberta = ref(false);
const coverUrlAtiva = ref('');

const abrirCapa = (urlCapa) => {
    coverUrlAtiva.value = urlCapa;
    coverModalAberta.value = true;
};

onMounted(() => {
    setTimeout(() => { carregando.value = false; }, 800);

    const jaViuModal = sessionStorage.getItem('modalLojaFechadaVisto');
    if (!lojaEstaAberta.value && !jaViuModal) {
        mostrarModalFechado.value = true;
    }

    if (capas.value.length > 1) {
        carrosselInterval = setInterval(() => {
            capaAtiva.value = (capaAtiva.value + 1) % capas.value.length;
        }, 4000);
    }
});

onUnmounted(() => {
    if (carrosselInterval) clearInterval(carrosselInterval);
});

const fecharModal = () => {
    mostrarModalFechado.value = false;
    sessionStorage.setItem('modalLojaFechadaVisto', 'true');
};
</script>

<template>
    <div class="cliente">
        <HeaderCliente @abrir-capa="abrirCapa" />

        <!-- CARROSSEL DE CAPAS -->
        <div v-if="capas.length > 0" class="carrossel-container">
            <div
                v-for="(capa, index) in capas"
                :key="index"
                class="carrossel-slide"
                :class="{ active: index === capaAtiva }"
            >
                <img :src="capa" alt="Capa da loja" @click="abrirCapa(capa)" />
            </div>

            <div v-if="capas.length > 1" class="carrossel-dots">
                <span
                    v-for="(capa, index) in capas"
                    :key="index"
                    :class="{ active: index === capaAtiva }"
                    @click="capaAtiva = index"
                ></span>
            </div>
        </div>

        <main class="conteudo">
            <div class="boas-vindas">
                <h1>Olá! O que você quer comer hoje?</h1>
            </div>

            <SkeletonCardapio v-if="carregando" />

            <template v-else>
                <section class="secao-produtos">
                    <div class="secao-header">
                        <h2>🍔 Lanches</h2>
                    </div>
                    <div class="grid-produtos">
                        <ProdutoCard
                            v-for="prod in lanches"
                            :key="prod.id"
                            :produto="prod"
                            @selecionar="selecionarProduto"
                        />
                    </div>
                </section>

                <section class="secao-produtos">
                    <div class="secao-header">
                        <h2>🍟 Porções</h2>
                    </div>
                    <div class="grid-produtos">
                        <ProdutoCard
                            v-for="prod in porcoes"
                            :key="prod.id"
                            :produto="prod"
                            @selecionar="selecionarProduto"
                        />
                    </div>
                </section>
            </template>
        </main>

        <FooterCliente />
        <BottomNav />
        <CookieConsentBanner />

        <ModalLojaFechada
            v-if="mostrarModalFechado"
            @fechar="fecharModal"
        />

        <!-- MODAL EXCLUSIVO DA CAPA (só imagem, sem textos) -->
        <Teleport to="body">
            <div v-if="coverModalAberta" class="cover-modal-overlay" @click="coverModalAberta = false">
                <img :src="coverUrlAtiva" class="cover-modal-img" alt="Capa da loja ampliada" />
            </div>
        </Teleport>
    </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════ */
/* LAYOUT GERAL                                               */
/* ═══════════════════════════════════════════════════════════ */
.cliente {
    min-height: 100vh;
    background: #ffffff;
    display: flex;
    flex-direction: column;
}

.conteudo {
    flex: 1;
    padding: 16px;
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
}

.boas-vindas h1 {
    font-size: 24px;
    color: #1a1a1a;
    margin: 0 0 24px 0;
    font-weight: 700;
}

/* ═══════════════════════════════════════════════════════════ */
/* CARROSSEL DE CAPAS                                         */
/* Descolado do header (margem no topo e nas laterais) e      */
/* alinhado com as bordas do conteúdo (800px - 2×16px = 768). */
/* ═══════════════════════════════════════════════════════════ */
.carrossel-container {
    position: relative;
    width: calc(100% - 32px);
    max-width: 768px;
    height: 200px;
    margin: 16px auto 0;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
}

.carrossel-slide {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.8s ease-in-out;
    cursor: zoom-in;
}

.carrossel-slide.active {
    opacity: 1;
    z-index: 1;
}

.carrossel-slide img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.carrossel-dots {
    position: absolute;
    bottom: 12px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: 6px;
    z-index: 2;
}

.carrossel-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.3s;
}

.carrossel-dots span.active {
    background: #fff;
    width: 20px;
    border-radius: 4px;
}

@media (min-width: 768px) {
    .carrossel-container {
        height: 300px;
        margin-top: 24px; 
        border-radius: 24px;
    }
}

/* ═══════════════════════════════════════════════════════════ */
/* SEÇÕES DE PRODUTOS                                         */
/* ═══════════════════════════════════════════════════════════ */
.secao-produtos { margin-bottom: 32px; }
.secao-header { margin-bottom: 16px; }
.secao-header h2 { font-size: 20px; color: #1a1a1a; margin: 0; }

.grid-produtos {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

@media (min-width: 600px) { .grid-produtos { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 900px) { .grid-produtos { grid-template-columns: repeat(4, 1fr); } }

/* ═══════════════════════════════════════════════════════════ */
/* MODAL EXCLUSIVO DA CAPA                                    */
/* ═══════════════════════════════════════════════════════════ */
.cover-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.92);
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: zoom-out;
    padding: 16px;
    backdrop-filter: blur(4px);
    animation: fadeIn 0.2s ease-out;
}

.cover-modal-img {
    max-width: 100%;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    animation: zoomIn 0.3s ease-out;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes zoomIn { from { transform: scale(0.9); } to { transform: scale(1); } }

/* ═══════════════════════════════════════════════════════════ */
/* RESPONSIVIDADE MOBILE                                      */
/* ═══════════════════════════════════════════════════════════ */
@media (max-width: 767px) {
    .conteudo { padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); }
}
</style>
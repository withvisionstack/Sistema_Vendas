<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCarrinho } from '../composables/useCarrinho.js';
import { useLoja } from '../composables/useLoja.js'; // ✅ NOVO
import HeaderCliente from '../components/cliente/HeaderCliente.vue';
import SkeletonCarrinho from '../components/cliente/SkeletonCarrinho.vue';
import ModalLojaFechada from '../components/cliente/ModalLojaFechada.vue'; // ✅ NOVO
import { ArrowLeft, Trash2 } from 'lucide-vue-next';

const router = useRouter();
const { itens, valorTotal, removerItem, totalItens } = useCarrinho();
const { lojaEstaAberta } = useLoja(); // ✅ NOVO

// Estado de carregamento simulado
const carregando = ref(true);

// ✅ NOVO: Estado do Modal
const modalFechado = ref(false);

onMounted(() => {
    setTimeout(() => {
        carregando.value = false;
    }, 600);
});

const voltar = () => router.back();

function formatarPreco(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

const irParaCheckout = () => {
    if (itens.value.length === 0) return;

    // ✅ BLOQUEIO: Se a loja estiver fechada, abre o modal e para o avanço
    if (!lojaEstaAberta.value) {
        modalFechado.value = true;
        return;
    }

    router.push('/checkout');
};
</script>

<template>
    <div class="carrinho-page">
        <HeaderCliente />

        <main class="conteudo">
            <div class="topo">
                <button class="btn-voltar" @click="voltar">
                    <ArrowLeft :size="24" />
                </button>
                <h1>Seu Carrinho</h1>
            </div>

            <!-- ✅ CORRIGIDO: Ordem lógica de carregamento e vazio -->
            <SkeletonCarrinho v-if="carregando" />

            <template v-else>
                <!-- Carrinho Vazio -->
                <div v-if="itens.length === 0" class="vazio">
                    <div class="emoji">🛒</div>
                    <h2>Seu carrinho está vazio</h2>
                    <p>Que tal adicionar um lanche delicioso?</p>
                    <button class="btn-voltar-menu" @click="router.push('/')">Ver Cardápio</button>
                </div>

                <!-- Lista de Itens -->
                <div v-else class="lista-itens">
                    <div v-for="item in itens" :key="item.id" class="item-card">
                        <img :src="item.imagem" :alt="item.nome" class="item-img" />

                        <div class="item-info">
                            <div class="item-header">
                                <h3>{{ item.nome }}</h3>
                                <span class="qtd">x{{ item.quantidade }}</span>
                            </div>

                            <!-- Acompanhamentos -->
                            <p v-if="item.acompanhamentos && item.acompanhamentos.length > 0" class="detalhe-ac">
                                <strong>Adicionais:</strong>
                                {{ item.acompanhamentos.map(a => a.nome).join(', ') }}
                            </p>

                            <!-- Observação -->
                            <p v-if="item.observacao" class="detalhe-obs">
                                <strong>Obs:</strong> {{ item.observacao }}
                            </p>

                            <div class="item-footer">
                                <span class="preco">{{ formatarPreco(item.precoTotal) }}</span>
                                <button class="btn-remover" @click="removerItem(item.id)">
                                    <Trash2 :size="16" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </main>

        <!-- Rodapé Fixo -->
        <footer v-if="itens.length > 0 && !carregando" class="footer-carrinho">
            <div class="resumo">
                <span>Total ({{ totalItens }} itens)</span>
                <strong>{{ formatarPreco(valorTotal) }}</strong>
            </div>
           <button class="btn-checkout" @click="irParaCheckout">
               Continuar para Entrega
           </button>
        </footer>

        <!-- ✅ MODAL DE LOJA FECHADA -->
        <ModalLojaFechada
            v-if="modalFechado"
            @fechar="modalFechado = false"
        />
    </div>
</template>

<style scoped>
/* Seu CSS continua igual */
.carrinho-page { min-height: 100vh; background: #ffffff; display: flex; flex-direction: column; padding-bottom: 100px; }
.conteudo { flex: 1; padding: 16px; max-width: 600px; margin: 0 auto; width: 100%; }

.topo { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.topo h1 { font-size: 24px; margin: 0; color: #1a1a1a; }
.btn-voltar { background: #fff; border: 1px solid #eee; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }

/* Vazio */
.vazio { text-align: center; margin-top: 60px; }
.vazio .emoji { font-size: 64px; margin-bottom: 16px; } 
.vazio h2 { color: #1a1a1a; margin-bottom: 8px; }
.vazio p { color: #666; margin-bottom: 24px; }
.btn-voltar-menu { background: #dc2626; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; }

/* Itens */
.lista-itens { display: flex; flex-direction: column; gap: 16px; }
.item-card { background: #fff; border-radius: 16px; padding: 12px; display: flex; gap: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.item-img { width: 80px; height: 80px; border-radius: 12px; object-fit: cover; }
.item-info { flex: 1; display: flex; flex-direction: column; }
.item-header { display: flex; justify-content: space-between; align-items: flex-start; }
.item-header h3 { margin: 0; font-size: 16px; color: #1a1a1a; }
.qtd { background: #f5f5f5; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }

.detalhe-ac, .detalhe-obs { font-size: 12px; color: #666; margin: 8px 0 0 0; line-height: 1.4; }
.detalhe-obs { color: #dc2626; }

.item-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 12px; }
.preco { font-weight: bold; color: #1a1a1a; font-size: 16px; }
.btn-remover { background: #ffffff; border: none; color: #dc2626; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

/* Footer fixo */
.footer-carrinho { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; padding: 16px; padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px)); box-shadow: 0 -4px 12px rgba(0,0,0,0.05); z-index: 100; max-width: 600px; margin: 0 auto; border-radius: 16px 16px 0 0; }
.resumo { display: flex; justify-content: space-between; margin-bottom: 16px; color: #666; }
.resumo strong { font-size: 20px; color: #1a1a1a; }
.btn-checkout { width: 100%; background: #dc2626; color: white; border: none; padding: 16px; border-radius: 12px; font-size: 16px; font-weight: bold; cursor: pointer; }
</style>
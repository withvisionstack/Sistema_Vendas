<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'


import {
  ArrowLeft,
  CreditCard,
  Banknote,
  QrCode,
  Clock,
  ChefHat,
  MessageCircle,
  Bike
} from 'lucide-vue-next'

import HeaderCliente from '../components/cliente/HeaderCliente.vue'
import SkeletonPedidos from '../components/cliente/SkeletonPedidos.vue'
import { useNotificacoes } from '../composables/useNotificacoes.js'

const STORAGE_KEY = '@delivery:pedidos'

const router = useRouter()
const { adicionar } = useNotificacoes()

const pedidos = ref([])
const carregando = ref(true)

const STATUS = {
  PREPARO: 'Em preparo',
  ENTREGA: 'Saiu para entrega',
  ENTREGUE: 'Entregue'
}

const STATUS_CONFIG = {
  [STATUS.PREPARO]: {
    cor: '#f59e0b',
    icone: ChefHat
  },
  [STATUS.ENTREGA]: {
    cor: '#3b82f6',
    icone: Bike
  },
  [STATUS.ENTREGUE]: {
    cor: '#16a34a',
    icone: Clock
  }
}

const METODOS_PAGAMENTO = {
  pix: {
    texto: 'Pix',
    icone: QrCode
  },
  cartao: {
    texto: 'Cartão na entrega',
    icone: CreditCard
  },
  dinheiro: {
    texto: 'Dinheiro',
    icone: Banknote
  }
}

onMounted(carregarPedidos)

function carregarPedidos() {
  setTimeout(() => {
    pedidos.value = obterPedidos()
    carregando.value = false
  }, 800)
}

function obterPedidos() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
}

function salvarPedidos(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista))
}

function voltar() {
  router.back()
}

function irParaCardapio() {
  router.push('/')
}

function formatarPreco(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

function formatarData(data) {
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function obterInfoStatus(status) {
  return (
    STATUS_CONFIG[status] || {
      cor: '#6b7280',
      icone: Clock
    }
  )
}

function obterPagamento(tipo) {
  return (
    METODOS_PAGAMENTO[tipo] || {
      texto: tipo,
      icone: QrCode
    }
  )
}

function obterProximoStatus(status) {
  const fluxo = {
    [STATUS.PREPARO]: STATUS.ENTREGA,
    [STATUS.ENTREGA]: STATUS.ENTREGUE
  }

  return fluxo[status]
}

function notificarMudancaStatus(status) {
  const notificacoes = {
    [STATUS.ENTREGA]: {
      titulo: 'Seu pedido saiu! 🛵',
      mensagem: 'O entregador está a caminho com o seu lanche.'
    },

    [STATUS.ENTREGUE]: {
      titulo: 'Pedido Entregue! ✅',
      mensagem: 'Bom apetite! Esperamos que goste.'
    }
  }

  const notificacao = notificacoes[status]

  if (notificacao) {
    adicionar(
      notificacao.titulo,
      notificacao.mensagem
    )
  }
}

function avancarStatus(pedido) {
  const lista = obterPedidos()

  const index = lista.findIndex(
    item => item.id === pedido.id
  )

  if (index < 0) return

  const proximoStatus = obterProximoStatus(
    lista[index].status
  )

  if (!proximoStatus) return

  lista[index].status = proximoStatus

  salvarPedidos(lista)

  pedidos.value[index].status = proximoStatus

  notificarMudancaStatus(proximoStatus)
}
</script>

<template>
  <div class="pedidos-page">
    <HeaderCliente />

    <SkeletonPedidos v-if="carregando" />

    <main v-else class="conteudo">
      <div class="topo">
        <button class="btn-voltar" @click="voltar">
          <ArrowLeft :size="24" />
        </button>

        <h1>Meus Pedidos</h1>
      </div>

      <div
        v-if="!pedidos.length"
        class="vazio"
      >
        <div class="emoji">🍔</div>

        <h2>Nenhum pedido ainda</h2>

        <p>
          Você ainda não fez nenhum pedido.
          Que tal matar a fome agora?
        </p>

        <button
          class="btn-voltar-menu"
          @click="irParaCardapio"
        >
          Ver Cardápio
        </button>
      </div>

      <div
        v-else
        class="lista-pedidos"
      >
        <article
          v-for="pedido in pedidos"
          :key="pedido.id"
          class="card-pedido"
        >
          <header class="card-header">
            <div class="info-pedido">
              <span class="numero-pedido">
                Pedido #{{ String(pedido.id).slice(-4) }}
              </span>

              <RouterLink :to="`/acompanhar/${pedido.id}`" class="btn-acompanhar">
                  <Clock :size="16" /> Acompanhar Pedido
              </RouterLink>

              <span class="data-pedido">
                {{
                  formatarData(
                    pedido.dataPedido ||
                    pedido.dataCriacao
                  )
                }}
              </span>
               <RouterLink to="/chat" class="btn-chat-flutuante" title="Falar com a loja">
                          <MessageCircle :size="28" color="#fff" />
                      </RouterLink>

                      <BottomNav />
              <button
                class="btn-teste-status"
                @click="avancarStatus(pedido)"
              >
                ⚙️ Simular avanço de status
              </button>
            </div>

            <div
              class="status-badge"
              :style="{
                color: obterInfoStatus(pedido.status).cor,
                borderColor: obterInfoStatus(pedido.status).cor
              }"
            >
              <component
                :is="obterInfoStatus(pedido.status).icone"
                :size="14"
              />

              {{ pedido.status }}
            </div>
          </header>

          <div class="lista-itens">
            <div
              v-for="item in pedido.itens"
              :key="item.id"
              class="item-resumo"
            >
              <span class="qtd">
                {{ item.quantidade }}x
              </span>

              <span class="nome">
                {{ item.nome }}
              </span>

              <span class="preco">
                {{ formatarPreco(item.precoTotal) }}
              </span>
            </div>
          </div>

          <footer class="card-footer">
            <div class="forma-pagamento">
              <component
                :is="obterPagamento(pedido.pagamento).icone"
                :size="18"
                class="icone-pagamento"
              />

              <span class="txt-pagamento">
                Pagamento:

                <strong>
                  {{ obterPagamento(pedido.pagamento).texto }}
                </strong>
              </span>
            </div>

            <div class="total-pedido">
              <span>Total:</span>

              <strong>
                {{
                  formatarPreco(
                    pedido.valorFinal ||
                    pedido.total
                  )
                }}
              </strong>
            </div>
          </footer>
        </article>
      </div>
    </main>
  </div>
</template>
<style scoped>
/* ═══════════════════════════════════════════════════════════ */
/* 1. LAYOUT GERAL                                            */
/* ═══════════════════════════════════════════════════════════ */
.pedidos-page { min-height: 100vh; background: #ffffff; display: flex; flex-direction: column; padding-bottom: 40px; }
.conteudo { flex: 1; padding: 16px; max-width: 600px; margin: 0 auto; width: 100%; }

.topo { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
.topo h1 { font-size: 22px; margin: 0; color: #1a1a1a; }
.btn-voltar { background: #fff; border: 1px solid #eee; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }

/* ═══════════════════════════════════════════════════════════ */
/* 2. ESTADO VAZIO                                            */
/* ═══════════════════════════════════════════════════════════ */
.vazio { text-align: center; margin-top: 60px; }
.vazio .emoji { font-size: 64px; margin-bottom: 16px; }
.vazio h2 { color: #1a1a1a; margin-bottom: 8px; font-size: 20px; }
.vazio p { color: #666; margin-bottom: 24px; font-size: 14px; line-height: 1.5; }
.btn-voltar-menu { background: #dc2626; color: white; border: none; padding: 14px 24px; border-radius: 12px; font-weight: bold; font-size: 15px; cursor: pointer; }

/* ═══════════════════════════════════════════════════════════ */
/* 3. CARDS DE PEDIDO                                         */
/* ═══════════════════════════════════════════════════════════ */
.lista-pedidos { display: flex; flex-direction: column; gap: 16px; }
.card-pedido { background: #fff; border-radius: 16px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }

/* Cabeçalho */
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #eee; }
.info-pedido { display: flex; flex-direction: column; }
.numero-pedido { font-weight: 800; font-size: 16px; color: #1a1a1a; }
.data-pedido { font-size: 12px; color: #777; margin-top: 4px; }

.status-badge { display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; border: 1px solid; font-size: 12px; font-weight: 700; background: #fff; }

/* Itens */
.lista-itens { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.item-resumo { display: flex; align-items: center; font-size: 14px; color: #333; }
.item-resumo .qtd { color: #dc2626; font-weight: 700; width: 30px; }
.item-resumo .nome { flex: 1; }
.item-resumo .preco { font-weight: 600; color: #555; }

/* Rodapé */
.card-footer { display: flex; justify-content: space-between; align-items: center; background: #fafafa; padding: 12px; border-radius: 12px; }
.forma-pagamento { display: flex; align-items: center; gap: 8px; color: #555; font-size: 13px; }
.icone-pagamento { color: #777; }
.txt-pagamento strong { color: #333; }

.total-pedido { display: flex; align-items: center; gap: 8px; }
.total-pedido span { font-size: 13px; color: #777; }
.total-pedido strong { font-size: 18px; color: #dc2626; }

.btn-chat-flutuante {
    position: fixed;
    bottom: 90px; /* Fica acima da barra de navegação */
    left: 20px;   /* Canto esquerdo */
    width: 56px;
    height: 56px;
    background: #dc2626;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
    z-index: 999;
    transition: transform 0.2s, background 0.2s;
    animation: flutuar 3s ease-in-out infinite;
}

.btn-chat-flutuante:hover {
    background: #b91c1c;
    transform: scale(1.05);
}

/* Animação sutil para chamar a atenção */
@keyframes flutuar {
    0% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
    100% { transform: translateY(0); }
}

/* Ajuste para o Desktop (para não sobrepor a sidebar, se houver) */
@media (min-width: 768px) {
    .btn-chat-flutuante {
        bottom: 30px; /* No PC não tem BottomNav, então desce mais */
    }
}

.btn-acompanhar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    background: #fef2f2;
    color: #dc2626;
    border: 1px dashed #fecaca;
    padding: 10px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    margin-bottom: 12px;
    transition: background 0.2s;
}
.btn-acompanhar:hover {
    background: #fee2e2;
}

</style>
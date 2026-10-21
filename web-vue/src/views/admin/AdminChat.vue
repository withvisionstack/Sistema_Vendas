<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { Send, User, ArrowLeft } from 'lucide-vue-next';
import { useChat } from '../../composables/useChat.js';
import SkeletonAdminChat from './SkeletonAdminChat.vue';

const { mensagens, enviarMensagem } = useChat();

const carregando = ref(true);
const pedidoIdAtivo = ref(null);
const novaMensagem = ref('');
const chatContainer = ref(null);
let timerSkeleton = null;

// Últimos 4 dígitos do pedido, usados na lista e no cabeçalho
const codigoPedido = (id) => String(id).slice(-4);

const ehDesktop = () => window.matchMedia('(min-width: 769px)').matches;

// ─── CONVERSAS (uma por pedido, da mais recente para a mais antiga) ───
const conversas = computed(() => {
    const agrupadas = new Map();

    for (const msg of mensagens.value) {
        const anterior = agrupadas.get(msg.pedidoId);

        // Remove e reinsere para que a ordem do Map siga a última mensagem de cada pedido
        agrupadas.delete(msg.pedidoId);
        agrupadas.set(msg.pedidoId, {
            pedidoId: msg.pedidoId,
            clienteNome: anterior?.clienteNome ?? msg.clienteNome,
            ultimaMensagem: msg.texto,
            hora: msg.hora
        });
    }

    return [...agrupadas.values()].reverse();
});

// Derivada da lista, então o nome e a última mensagem nunca ficam desatualizados
const conversaAtiva = computed(
    () => conversas.value.find((c) => c.pedidoId === pedidoIdAtivo.value) ?? null
);

const mensagensAtivas = computed(() =>
    pedidoIdAtivo.value === null
        ? []
        : mensagens.value.filter((m) => m.pedidoId === pedidoIdAtivo.value)
);

const podeEnviar = computed(() => novaMensagem.value.trim().length > 0 && !!conversaAtiva.value);

// ─── SCROLL ───
const rolarParaBaixo = async () => {
    await nextTick();
    const el = chatContainer.value;
    if (el) el.scrollTop = el.scrollHeight;
};

// Rola só quando chega mensagem nova ou a conversa muda (sem forçar o scroll
// enquanto você lê mensagens antigas, como o intervalo de 2s fazia).
watch(() => mensagensAtivas.value.length, rolarParaBaixo);

// ─── AÇÕES ───
const selecionarConversa = (conversa) => {
    pedidoIdAtivo.value = conversa.pedidoId;
    rolarParaBaixo();
};

const voltarParaLista = () => {
    pedidoIdAtivo.value = null;
};

const enviar = () => {
    if (!podeEnviar.value) return;

    enviarMensagem(novaMensagem.value.trim(), pedidoIdAtivo.value, 'Loja', true);
    novaMensagem.value = '';
    rolarParaBaixo();
};

// No desktop, abre a primeira conversa assim que ela existir (mesmo que carregue depois)
watch(
    conversas,
    (lista) => {
        if (pedidoIdAtivo.value === null && lista.length > 0 && ehDesktop()) {
            selecionarConversa(lista[0]);
        }
    },
    { immediate: true }
);

onMounted(() => {
    timerSkeleton = setTimeout(() => { carregando.value = false; }, 600);
});

onUnmounted(() => clearTimeout(timerSkeleton));
</script>

<template>
    <div class="admin-chat-wrapper" :class="{ 'mobile-aberto': conversaAtiva }">
        <SkeletonAdminChat v-if="carregando" />

        <template v-else>
            <!-- LISTA DE CONTATOS -->
            <aside class="lista-contatos-wrapper">
                <div class="header-contatos">
                    <h2>Mensagens</h2>
                </div>

                <div v-if="conversas.length === 0" class="vazio">
                    Nenhuma conversa ativa.
                </div>

                <div v-else class="lista-contatos">
                    <div
                        v-for="conv in conversas"
                        :key="conv.pedidoId"
                        class="contato"
                        :class="{ ativo: conv.pedidoId === pedidoIdAtivo }"
                        role="button"
                        tabindex="0"
                        @click="selecionarConversa(conv)"
                        @keydown.enter.prevent="selecionarConversa(conv)"
                    >
                        <div class="avatar"><User :size="18" /></div>
                        <div class="info-contato">
                            <div class="linha1">
                                <strong>Pedido #{{ codigoPedido(conv.pedidoId) }}</strong>
                                <span>{{ conv.hora }}</span>
                            </div>
                            <p>{{ conv.ultimaMensagem }}</p>
                        </div>
                    </div>
                </div>
            </aside>

            <!-- ÁREA DO CHAT -->
            <main class="area-chat">
                <div v-if="!conversaAtiva" class="chat-vazio">
                    <p>Selecione uma conversa para responder.</p>
                </div>

                <template v-else>
                    <!-- Topo do chat -->
                    <div class="chat-header">
                        <!-- Botão voltar (só aparece no mobile) -->
                        <button type="button" class="btn-voltar-mobile" aria-label="Voltar para a lista" @click="voltarParaLista">
                            <ArrowLeft :size="24" />
                        </button>
                        <div class="info-header">
                            <h3>Pedido #{{ codigoPedido(conversaAtiva.pedidoId) }}</h3>
                            <span>Cliente: {{ conversaAtiva.clienteNome }}</span>
                        </div>
                    </div>

                    <!-- Mensagens -->
                    <div ref="chatContainer" class="chat-mensagens">
                        <div
                            v-for="msg in mensagensAtivas"
                            :key="msg.id"
                            class="msg-wrapper"
                            :class="msg.deLoja ? 'minha' : 'deles'"
                        >
                            <div class="balao">
                                <p>{{ msg.texto }}</p>
                                <span class="hora">{{ msg.hora }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Input -->
                    <div class="chat-input">
                        <input
                            v-model="novaMensagem"
                            type="text"
                            placeholder="Digite sua resposta..."
                            autocomplete="off"
                            enterkeyhint="send"
                            @keyup.enter="enviar"
                        />
                        <button type="button" aria-label="Enviar mensagem" :disabled="!podeEnviar" @click="enviar">
                            <Send :size="18" />
                        </button>
                    </div>
                </template>
            </main>
        </template>
    </div>
</template>

<style scoped>
/* Base */
.admin-chat-wrapper {
    display: flex;
    flex: 1;
    background: #fff;
    border-radius: 12px;
    border: 1px solid #e4e4e7;
    overflow: hidden;
    height: calc(100vh - 120px); /* Ajuste para caber na tela do admin */
}

/* Contatos */
.lista-contatos-wrapper {
    width: 320px;
    border-right: 1px solid #e4e4e7;
    display: flex;
    flex-direction: column;
    background: #fafafa;
}

.header-contatos { padding: 20px; border-bottom: 1px solid #e4e4e7; }
.header-contatos h2 { font-size: 18px; margin: 0; color: #18181b; }

.lista-contatos { flex: 1; overflow-y: auto; }

.contato { display: flex; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #f4f4f5; cursor: pointer; transition: background 0.2s; }
.contato:hover { background: #f4f4f5; }
.contato.ativo { background: #fef2f2; border-left: 4px solid #dc2626; }

.avatar { width: 40px; height: 40px; border-radius: 50%; background: #e4e4e7; color: #71717a; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.info-contato { flex: 1; overflow: hidden; }
.linha1 { display: flex; justify-content: space-between; margin-bottom: 4px; }
.linha1 strong { font-size: 14px; color: #18181b; }
.linha1 span { font-size: 11px; color: #a1a1aa; }
.info-contato p { margin: 0; font-size: 13px; color: #71717a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Área de Chat */
.area-chat { flex: 1; display: flex; flex-direction: column; background: #f9fafb; }
.chat-vazio { flex: 1; display: flex; align-items: center; justify-content: center; color: #a1a1aa; }

.chat-header { padding: 16px 24px; border-bottom: 1px solid #e4e4e7; background: #fff; display: flex; align-items: center; gap: 12px; }
.btn-voltar-mobile { display: none; background: transparent; border: none; color: #18181b; cursor: pointer; padding: 4px; margin-left: -8px; }
.chat-header h3 { margin: 0 0 4px 0; font-size: 16px; color: #18181b; }
.chat-header span { font-size: 13px; color: #71717a; }

.chat-mensagens { flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
.msg-wrapper { display: flex; width: 100%; }
.msg-wrapper.minha { justify-content: flex-end; }
.msg-wrapper.deles { justify-content: flex-start; }

.balao { max-width: 70%; padding: 12px 16px; border-radius: 12px; position: relative; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.minha .balao { background: #dcf8c6; border-bottom-right-radius: 2px; }
.deles .balao { background: #fff; border-bottom-left-radius: 2px; }
.balao p { margin: 0 0 4px 0; font-size: 14px; color: #18181b; }
.balao .hora { font-size: 10px; color: #888; float: right; margin-top: 4px; }

.chat-input { display: flex; gap: 12px; padding: 16px 24px; border-top: 1px solid #e4e4e7; background: #fff; }
.chat-input input { flex: 1; padding: 12px 16px; border: 1px solid #e4e4e7; border-radius: 24px; outline: none; font-size: 14px; }
.chat-input input:focus { border-color: #dc2626; }
.chat-input button { width: 44px; height: 44px; border-radius: 50%; background: #dc2626; color: #fff; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.chat-input button:disabled { opacity: 0.5; cursor: not-allowed; }

/* ═══════════════════════════════════════════════════════════ */
/* RESPONSIVIDADE (MOBILE)                                    */
/* ═══════════════════════════════════════════════════════════ */
@media (max-width: 768px) {
    .admin-chat-wrapper {
        height: calc(100vh - 140px); /* Ajusta a altura pro mobile */
        border: none;
        border-radius: 0;
    }

    /* Se não tiver conversa aberta, mostra só a lista */
    .area-chat {
        display: none;
    }

    .lista-contatos-wrapper {
        width: 100%;
        border-right: none;
    }

    /* Se tiver conversa aberta, esconde a lista e mostra o chat */
    .admin-chat-wrapper.mobile-aberto .lista-contatos-wrapper {
        display: none;
    }
    .admin-chat-wrapper.mobile-aberto .area-chat {
        display: flex;
    }

    /* Mostra o botão de voltar no chat mobile */
    .btn-voltar-mobile {
        display: flex;
    }

    .chat-mensagens {
        padding: 16px;
    }
}
</style>
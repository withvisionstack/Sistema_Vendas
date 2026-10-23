<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Send, Store } from 'lucide-vue-next';
import HeaderCliente from '../components/cliente/HeaderCliente.vue';
import { useChat } from '../composables/useChat.js';

const route = useRoute();
const router = useRouter();

// Pega o ID do pedido da URL (ex: /chat?pedido=123)
const pedidoId = route.query.pedido || 'geral';

// ✅ Puxa as mensagens do cérebro global (Chat)
const { mensagens, enviarMensagem } = useChat();

const novaMensagem = ref('');
const chatContainer = ref(null);
let pollingInterval = null;

// Filtra apenas as mensagens deste pedido específico
const minhasMensagens = computed(() => {
    return mensagens.value.filter(m => m.pedidoId === pedidoId);
});

const rolarParaBaixo = async () => {
    await nextTick();
    if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
};

const enviar = () => {
    if (!novaMensagem.value.trim()) return;

    // enviaMensagem(texto, pedidoId, nomeCliente, éDaLoja?)
    enviarMensagem(novaMensagem.value, pedidoId, 'Cliente', false);
    novaMensagem.value = '';
    rolarParaBaixo();
};

onMounted(() => {
    rolarParaBaixo();
    // Polling para puxar as respostas do admin a cada 2 segundos
    pollingInterval = setInterval(() => {
        rolarParaBaixo();
    }, 2000);
});

onUnmounted(() => {
    if (pollingInterval) clearInterval(pollingInterval);
});

const voltar = () => router.back();
</script>

<template>
    <div class="chat-page">
        <HeaderCliente />

        <!-- Topo fixo do chat -->
        <div class="chat-topo">
            <button class="btn-voltar" @click="voltar"><ArrowLeft :size="24" /></button>
            <div class="info-loja">
                <div class="avatar-loja"><Store :size="20" /></div>
                <div class="textos">
                    <h2>Hamburgueria</h2>
                    <span>Online agora</span>
                </div>
            </div>
        </div>

        <!-- Área de Mensagens -->
        <main class="chat-mensagens" ref="chatContainer">
            <div
              v-for="msg in minhasMensagens"
                  :key="msg.id"
                  class="msg-wrapper"
                  :class="{ 'minha': !msg.deLoja, 'deles': msg.deLoja }"
            >
                <div class="balao">
                    <p>{{ msg.texto }}</p>
                    <span class="hora">{{ msg.hora }}</span>
                </div>
            </div>

            <!-- Indicador de digitando -->
            <div v-if="digitando" class="msg-wrapper deles">
                <div class="balao digitando">
                    <span></span><span></span><span></span>
                </div>
            </div>
        </main>

        <!-- Barra de digitar -->
        <footer class="chat-input-area">
            <input
                v-model="novaMensagem"
                type="text"
                placeholder="Digite sua mensagem..."
                @keyup.enter="enviarMensagem"
            />
            <button class="btn-enviar" @click="enviar" :disabled="!novaMensagem.trim()">
                <Send :size="20" />
            </button>
        </footer>
    </div>
</template>

<style scoped>
.chat-page {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #ffffff;
}

/* Topo do Chat */
.chat-topo {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: #fff;
    border-bottom: 1px solid #eee;
    z-index: 10;
}

.btn-voltar {
    background: transparent;
    border: none;
    cursor: pointer;
    color: #1a1a1a;
}

.info-loja {
    display: flex;
    align-items: center;
    gap: 12px;
}

.avatar-loja {
    width: 40px; height: 40px;
    background: #fef2f2; color: #dc2626;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
}

.textos h2 { margin: 0; font-size: 16px; color: #1a1a1a; }
.textos span { font-size: 12px; color: #16a34a; font-weight: 600; }

/* Área de Mensagens */
.chat-mensagens {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: #e5ddd5; /* Cor de fundo clássica de chat */
}

.msg-wrapper {
    display: flex;
    width: 100%;
}

.msg-wrapper.minha { justify-content: flex-end; }
.msg-wrapper.deles { justify-content: flex-start; }

.balao {
    max-width: 80%;
    padding: 10px 14px;
    border-radius: 12px;
    position: relative;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.minha .balao {
    background: #dcf8c6; /* Verde claro do WhatsApp */
    border-bottom-right-radius: 2px;
}

.deles .balao {
    background: #fff;
    border-bottom-left-radius: 2px;
}

.balao p { margin: 0 0 4px 0; font-size: 14px; color: #1a1a1a; line-height: 1.4; word-break: break-word; }
.balao .hora { font-size: 10px; color: #888; float: right; margin-top: 4px; margin-left: 8px; }

/* Indicador Digitando */
.digitando { display: flex; gap: 4px; align-items: center; padding: 14px 18px; }
.digitando span {
    width: 6px; height: 6px; background: #aaa; border-radius: 50%;
    animation: pular 1.4s infinite ease-in-out both;
}
.digitando span:nth-child(1) { animation-delay: -0.32s; }
.digitando span:nth-child(2) { animation-delay: -0.16s; }
@keyframes pular {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
}

/* Barra de Digitar */
.chat-input-area {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
    background: #f0f0f0;
}

.chat-input-area input {
    flex: 1;
    padding: 14px;
    border: none;
    border-radius: 24px;
    font-size: 15px;
    outline: none;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.btn-enviar {
    width: 48px; height: 48px;
    background: #dc2626; color: #fff;
    border: none; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: opacity 0.2s;
}

.btn-enviar:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
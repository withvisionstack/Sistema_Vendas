<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Bell, CheckCircle2, Package } from 'lucide-vue-next';
import { useNotificacoes } from '../../composables/useNotificacoes.js';

const { notificacoes, naoLidas, marcarTodasLidas } = useNotificacoes();
const painelAberto = ref(false);
const containerRef = ref(null);

// Função para abrir/fechar o painel e marcar como lidas
const togglePainel = () => {
    painelAberto.value = !painelAberto.value;
    if (painelAberto.value && naoLidas.value > 0) {
        marcarTodasLidas();
    }
};

// Fecha o painel se clicar fora dele
const clicarFora = (event) => {
    if (containerRef.value && !containerRef.value.contains(event.target)) {
        painelAberto.value = false;
    }
};

onMounted(() => document.addEventListener('click', clicarFora));
onUnmounted(() => document.removeEventListener('click', clicarFora));

const formatarData = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};
</script>

<template>
    <div class="notificacoes-container" ref="containerRef">
        <!-- Botão do Sino -->
        <button class="btn-sino" @click="togglePainel" aria-label="Notificações">
            <Bell :size="20" />
            <span v-if="naoLidas > 0" class="badge-notificacao">
                {{ naoLidas }}
            </span>
        </button>

        <!-- Painel Dropdown -->
        <div v-if="painelAberto" class="painel-notificacoes">
            <div class="painel-header">
                <h3>Notificações</h3>
            </div>

            <div class="painel-lista">
                <div v-if="notificacoes.length === 0" class="vazio">
                    <p>Nenhuma notificação por aqui.</p>
                </div>

                <div
                    v-for="notif in notificacoes"
                    :key="notif.id"
                    class="item-notificacao"
                    :class="{ 'nao-lida': !notif.lida }"
                >
                    <div class="icone">
                        <Package :size="16" />
                    </div>
                    <div class="texto">
                        <h4>{{ notif.titulo }}</h4>
                        <p>{{ notif.mensagem }}</p>
                        <span class="hora">{{ formatarData(notif.data) }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.notificacoes-container { position: relative; }

.btn-sino {
    position: relative;
    background: transparent;
    border: none;
    width: 40px; height: 40px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #333;
    transition: background 0.2s;
}
.btn-sino:hover { background: #f5f5f5; }

.badge-notificacao {
    position: absolute; top: 0; right: 0;
    background: #dc2626; color: #fff;
    font-size: 10px; font-weight: 800;
    min-width: 16px; height: 16px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    padding: 0 4px;
    border: 2px solid #fff;
}

/* Painel Dropdown */
.painel-notificacoes {
    position: absolute; top: 50px; right: -10px;
    width: 320px; background: #fff;
    border-radius: 16px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    border: 1px solid #eee;
    z-index: 999;
    overflow: hidden;
    animation: fadeIn 0.2s ease-out;
}

.painel-header {
    padding: 16px; border-bottom: 1px solid #eee;
    background: #fafafa;
}
.painel-header h3 { margin: 0; font-size: 15px; color: #1a1a1a; }

.painel-lista { max-height: 300px; overflow-y: auto; }

.vazio { padding: 24px; text-align: center; color: #777; font-size: 13px; }

.item-notificacao {
    display: flex; gap: 12px; padding: 16px;
    border-bottom: 1px solid #f5f5f5;
    transition: background 0.2s;
}
.item-notificacao:hover { background: #fafafa; }
.item-notificacao.nao-lida { background: #fef2f2; }

.icone {
    width: 32px; height: 32px; border-radius: 50%;
    background: #fee2e2; color: #dc2626;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
}

.texto { flex: 1; }
.texto h4 { margin: 0 0 4px 0; font-size: 13px; color: #1a1a1a; }
.texto p { margin: 0 0 4px 0; font-size: 12px; color: #555; line-height: 1.4; }
.hora { font-size: 11px; color: #999; }

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 400px) {
    .painel-notificacoes { width: 280px; right: -60px; }
}
</style>
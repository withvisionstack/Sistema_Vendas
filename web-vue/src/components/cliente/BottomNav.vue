<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
// ✅ Importação única e correta com todos os ícones necessários
import { Utensils, CupSoda, ClipboardList, User } from 'lucide-vue-next';
import { useNotificacoes } from '../../composables/useNotificacoes.js';

defineProps({
    enderecoDefinido: { type: Boolean, default: false }
});

const { naoLidas } = useNotificacoes();

// ─── CONTADOR DE PEDIDOS ATIVOS ───
const pedidosAtivos = ref(0);

const atualizarPedidosAtivos = () => {
    const pedidos = JSON.parse(localStorage.getItem('@delivery:pedidos')) || [];
    pedidosAtivos.value = pedidos.filter(p => p.status !== 'Entregue').length;
};

onMounted(() => {
    atualizarPedidosAtivos();
    window.addEventListener('pedidos-atualizados', atualizarPedidosAtivos);
});

onUnmounted(() => {
    window.removeEventListener('pedidos-atualizados', atualizarPedidosAtivos);
});

const badgeCount = computed(() => pedidosAtivos.value);
</script>

<template>
    <nav class="navigation-bar">
        <!-- Cardápio -->
        <RouterLink to="/" class="nav-item" title="Cardápio">
            <div class="icone-wrapper">
                <Utensils :size="24" />
            </div>
            <span>Cardápio</span>
        </RouterLink>

        <!-- Bebidas -->
        <RouterLink to="/bebidas" class="nav-item" title="Bebidas">
            <div class="icone-wrapper">
                <CupSoda :size="24" />
            </div>
            <span>Bebidas</span>
        </RouterLink>

        <!-- Pedidos (Com Badge Reativo) -->
        <RouterLink to="/pedidos" class="nav-item" title="Meus Pedidos">
            <div class="icone-wrapper">
                <ClipboardList :size="24" />
                <span v-if="badgeCount > 0" class="badge-bottom-nav">
                    {{ badgeCount }}
                </span>
            </div>
            <span>Pedidos</span>
        </RouterLink>

        <!-- Perfil -->
        <RouterLink to="/perfil" class="nav-item" title="Meu Perfil">
            <div class="icone-wrapper">
                <User :size="24" />
            </div>
            <span>Perfil</span>
        </RouterLink>
    </nav>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════ */
/* 1. MOBILE (Barra Inferior)                                 */
/* ═══════════════════════════════════════════════════════════ */
.navigation-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #fff;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    padding: 8px 0;
    padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    z-index: 1000;
}

.nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-decoration: none;
    color: #777;
    font-size: 11px;
    font-weight: 500;
    padding: 6px 12px;
    transition: color 0.2s;
}

.nav-item.router-link-active {
    color: #dc2626;
}

.icone-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.badge-bottom-nav {
    position: absolute;
    top: -6px;
    right: -8px;
    background: #dc2626;
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    min-width: 16px;
    height: 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    border: 2px solid #fff;
    box-sizing: border-box;
}

/* ═══════════════════════════════════════════════════════════ */
/* 2. DESKTOP (Esconde a barra inferior)                      */
/* ═══════════════════════════════════════════════════════════ */
@media (min-width: 768px) {
    .navigation-bar {
        display: none;
    }
}
</style>
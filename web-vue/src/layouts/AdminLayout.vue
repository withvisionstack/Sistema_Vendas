<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router';
import {
    ClipboardList, Settings, LogOut, Store, MessageCircle,
    MapPin, LayoutDashboard, Package, Bike
} from 'lucide-vue-next';

const router = useRouter();

// Fonte única de verdade para os itens de navegação
const menuItems = [
    { to: '/admin/dashboard',     label: 'Dashboard',     short: 'Dash',      icon: LayoutDashboard },
    { to: '/admin/pedidos',       label: 'Pedidos',       short: 'Pedidos',   icon: ClipboardList },
    { to: '/admin/monitoramento', label: 'Monitoramento', short: 'Mapa',      icon: MapPin },
    { to: '/admin/entregadores', label: 'Entregadores', short: 'Entregas', icon: Bike },
    { to: '/admin/chat',          label: 'Chat',          short: 'Chat',      icon: MessageCircle },
    { to: '/admin/produtos',      label: 'Produtos',      short: 'Produtos',  icon: Package },
    { to: '/admin/configuracoes', label: 'Configurações', short: 'Ajustes',   icon: Settings },
];



const fazerLogout = () => router.push('/');
</script>

<template>
    <div class="admin-layout">
        <!-- SIDEBAR (desktop) -->
        <aside class="sidebar-desktop">
            <div class="logo">
                <Store :size="24" class="logo-icon" />
                <span>Painel da Loja</span>
            </div>

            <nav class="menu" aria-label="Navegação principal">
                <RouterLink
                    v-for="item in menuItems"
                    :key="item.to"
                    :to="item.to"
                    class="menu-item"
                >
                    <component :is="item.icon" :size="20" />
                    <span>{{ item.label }}</span>
                </RouterLink>
            </nav>

            <button class="btn-logout" @click="fazerLogout">
                <LogOut :size="20" />
                <span>Sair</span>
            </button>
        </aside>

        <!-- CONTEÚDO -->
        <main class="admin-content">
            <header class="mobile-header">
                <div class="logo">
                    <Store :size="20" class="logo-icon" />
                    <span>Painel da Loja</span>
                </div>
                <button class="btn-logout-mobile" aria-label="Sair" @click="fazerLogout">
                    <LogOut :size="20" />
                </button>
            </header>

            <div class="view-container">
                <RouterView />
            </div>
        </main>

        <!-- BOTTOM NAV (mobile) -->
        <nav class="bottom-nav-admin" aria-label="Navegação principal">
            <RouterLink
                v-for="item in menuItems"
                :key="item.to"
                :to="item.to"
                class="nav-item"
            >
                <component :is="item.icon" :size="22" />
                <span>{{ item.short }}</span>
            </RouterLink>
        </nav>
    </div>
</template>

<style scoped>
/* ───────────── Tokens ───────────── */
.admin-layout {
    --color-bg: #f4f4f5;
    --color-sidebar: #18181b;
    --color-surface-hover: #27272a;
    --color-text-muted: #a1a1aa;
    --color-text-muted-light: #71717a;
    --color-accent: #dc2626;
    --color-danger: #ef4444;
    --sidebar-width: 260px;

    display: flex;
    min-height: 100vh;
    background: var(--color-bg);
    box-sizing: border-box;
}

/* ✅ RESET GLOBAL INTERNO */
.admin-layout *,
.admin-layout *::before,
.admin-layout *::after {
    box-sizing: border-box;
}

.logo { display: flex; align-items: center; font-weight: 800; }
.logo-icon { color: var(--color-accent); }

/* ───────────── Desktop ───────────── */
.sidebar-desktop {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 100;
    width: var(--sidebar-width);
    display: flex;
    flex-direction: column;
    padding: 24px 16px;
    background: var(--color-sidebar);
    color: #fff;
}

.sidebar-desktop .logo {
    gap: 12px;
    font-size: 18px;
    margin-bottom: 40px;
    padding-left: 8px;
}

.menu {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 8px;
    color: var(--color-text-muted);
    text-decoration: none;
    font-weight: 600;
    transition: background 0.2s, color 0.2s;
}

.menu-item:hover,
.menu-item.router-link-active {
    background: var(--color-surface-hover);
    color: #fff;
}

.menu-item.router-link-active { border-left: 4px solid var(--color-accent); }

.btn-logout {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: auto;
    padding: 12px 16px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: var(--color-danger);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.btn-logout:hover { background: var(--color-surface-hover); }

.admin-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-left: var(--sidebar-width);
    padding: 32px;
    min-width: 0; /* ✅ Permite encolher e não estourar */
    box-sizing: border-box;
}

.view-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.mobile-header,
.bottom-nav-admin {
    display: none;
}

/* ───────────── Mobile ───────────── */
@media (max-width: 768px) {
    .sidebar-desktop { display: none; }

    /* ✅ CORREÇÃO: Remove padding duplo e trava o scroll horizontal */
    .admin-content {
        margin-left: 0;
        padding: 80px 12px 100px; /* Topo pro header, fundo pro bottom nav */
        min-height: 100vh;
        overflow-x: hidden; /* ✅ Bloqueia o scroll horizontal */
        box-sizing: border-box;
        width: 100%;
    }

    .view-container {
        width: 100%;
        overflow-x: hidden;
    }

    .mobile-header {
        position: fixed;
        top: 0; left: 0; right: 0;
        z-index: 1000;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: var(--color-sidebar);
        color: #fff;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .mobile-header .logo { gap: 8px; font-size: 16px; }

    .btn-logout-mobile {
        background: transparent;
        border: none;
        color: var(--color-text-muted);
        cursor: pointer;
    }

    .bottom-nav-admin {
        position: fixed;
        inset: auto 0 0 0;
        z-index: 1000;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        padding: 8px 16px;
        padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
        background: #fff;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
        overflow-x: auto;
        scrollbar-width: none;
    }

    .bottom-nav-admin::-webkit-scrollbar { display: none; }

    .nav-item {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 6px 16px;
        color: var(--color-text-muted-light);
        text-decoration: none;
        font-size: 10px;
        font-weight: 600;
        transition: color 0.2s;
    }

    .nav-item.router-link-active { color: var(--color-accent); }
}
</style>
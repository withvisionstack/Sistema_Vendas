import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import AdminLayout from './layouts/AdminLayout.vue';
import { useAuth } from './composables/useAuth.js';
import { useEntregadorAuth } from './composables/useEntregadorAuth.js';


// ═══════════════════════════════════════════════════════════
// ROTAS
// ═══════════════════════════════════════════════════════════
const routes = [
    // ─────────────────────────────────────────────
    // CLIENTE
    // ─────────────────────────────────────────────
    {
        path: '/',
        component: () => import('./views/Cliente.vue')
    },
    {
        path: '/cliente',
        component: () => import('./views/Cliente.vue')
    },
    {
        path: '/categoria/:id',
        component: () => import('./views/Categoria.vue')
    },
    {
        path: '/produto/:id',
        component: () => import('./views/DetalheProduto.vue')
    },
    {
        path: '/bebidas',
        component: () => import('./views/Categoria.vue'),
        props: { categoriaFixa: 'bebidas' }
    },
    {
        path: '/carrinho',
        component: () => import('./views/Carrinho.vue')
    },
    {
        path: '/checkout',
        component: () => import('./views/Checkout.vue')
    },
    {
        path: '/pagamento',
        component: () => import('./views/Pagamento.vue')
    },
    {
        path: '/pedidos',
        component: () => import('./views/Pedidos.vue')
    },
    {
        path: '/acompanhar/:id',
        component: () => import('./views/AcompanharPedido.vue')
    },
    {
        path: '/chat',
        component: () => import('./views/Chat.vue')
    },
    {
        path: '/perfil',
        component: () => import('./views/Perfil.vue')
    },
    {
        path: '/politica-de-privacidade',
        component: () => import('./views/PoliticaPrivacidade.vue')
    },

    // ─────────────────────────────────────────────
    // ENTREGADOR
    // ─────────────────────────────────────────────
    {
        path: '/entregador/login',
        component: () => import('./views/EntregadorLogin.vue')
    },
    {
        path: '/entregador/painel',
        component: () => import('./views/EntregadorPainel.vue')
    },
    {
        path: '/entregador/rota/:id',
        component: () => import('./views/Entregador.vue')
    },
    {
        path: '/entregador',
        redirect: '/entregador/painel'
    },

    // ─────────────────────────────────────────────
    // ADMIN DA LOJA
    // ─────────────────────────────────────────────
    {
        path: '/admin/login',
        component: () => import('./views/admin/AdminLogin.vue')
    },
    {
        path: '/admin',
        component: AdminLayout,
        children: [
            { path: '', redirect: '/admin/pedidos' },
            {
                path: 'pedidos',
                component: () => import('./views/admin/AdminPedidos.vue')
            },
            {
                path: 'produtos',
                component: () => import('./views/admin/AdminProdutos.vue')
            },
            {
                path: 'configuracoes',
                component: () => import('./views/admin/AdminConfiguracoes.vue')
            },
            {
                path: 'chat',
                component: () => import('./views/admin/AdminChat.vue')
            },
            {
                path: 'entregadores',
                component: () => import('./views/admin/AdminEntregadores.vue')
            },
            {
                path: 'dashboard',
                component: () => import('./views/admin/AdminDashboard.vue')
            },
            {
                path: 'monitoramento',
                component: () => import('./views/admin/AdminMonitoramento.vue')
            }
        ]
    },

    // ─────────────────────────────────────────────
    // 404 (SEMPRE A ÚLTIMA)
    // ─────────────────────────────────────────────
    {
        path: '/:pathMatch(.*)*',
        component: () => import('./views/NotFound.vue')
    }
];

// ═══════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════
const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        return savedPosition || { top: 0 };
    }
});

// ═══════════════════════════════════════════════════════════
// GUARD (protege as rotas)
// ═══════════════════════════════════════════════════════════
router.beforeEach((to, from) => {
    const { estaLogado } = useAuth();
    const { entregadorLogado } = useEntregadorAuth();
  

    // Admin da Loja
    if (to.path.startsWith('/admin') && to.path !== '/admin/login') {
        if (!estaLogado.value) return '/admin/login';
    }
    if (to.path === '/admin/login' && estaLogado.value) {
        return '/admin/dashboard';
    }

    // Entregador
    if (to.path.startsWith('/entregador') && to.path !== '/entregador/login') {
        if (!entregadorLogado.value) return '/entregador/login';
    }
    if (to.path === '/entregador/login' && entregadorLogado.value) {
        return '/entregador/painel';
    }

    return true;
});

// ═══════════════════════════════════════════════════════════
// MOUNT
// ═══════════════════════════════════════════════════════════
createApp(App).use(router).mount('#app');

setTimeout(() => {
    const splash = document.getElementById('app-loading');
    if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => splash.remove(), 400);
    }
}, 600);
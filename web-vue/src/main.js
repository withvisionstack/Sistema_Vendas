import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import AdminLayout from './layouts/AdminLayout.vue';
import { useAuth } from './composables/useAuth.js';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        // ═══════════════════════════════════════════════════
        // AUTENTICAÇÃO DO ADMIN
        // ═══════════════════════════════════════════════════
        {
            path: '/admin/login',
            name: 'AdminLogin',
            component: () => import('./views/admin/AdminLogin.vue')
        },

        // ═══════════════════════════════════════════════════
        // ÁREA DO CLIENTE
        // ═══════════════════════════════════════════════════
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

        // ═══════════════════════════════════════════════════
        // ÁREA DO ENTREGADOR
        // ═══════════════════════════════════════════════════
        {
            path: '/entregador',
            component: () => import('./views/Entregador.vue')
        },
        {
            path: '/entregador/:token',
            component: () => import('./views/Entregador.vue')
        },

        // ═══════════════════════════════════════════════════
        // ÁREA DO ADMIN (LAYOUT COM SIDEBAR)
        // ═══════════════════════════════════════════════════
        {
            path: '/admin',
            component: AdminLayout,
            children: [
                // ✅ CORRIGIDO: paths relativos (sem /admin/)
                { path: '', redirect: '/admin/pedidos' },
                {
                    path: 'pedidos',
                    name: 'AdminPedidos',
                    component: () => import('./views/admin/AdminPedidos.vue')
                },
                {
                    path: 'produtos',
                    name: 'AdminProdutos',
                    component: () => import('./views/admin/AdminProdutos.vue')
                },
                {
                    path: 'configuracoes',
                    name: 'AdminConfiguracoes',
                    component: () => import('./views/admin/AdminConfiguracoes.vue')
                },
                {
                    path: 'chat',
                    name: 'AdminChat',
                    component: () => import('./views/admin/AdminChat.vue')
                },
                {
                    path: 'entregadores',
                    name: 'AdminEntregadores',
                    component: () => import('./views/admin/AdminEntregadores.vue')
                },
                {
                    path: 'dashboard',
                    name: 'AdminDashboard',
                    component: () => import('./views/admin/AdminDashboard.vue')
                },
                {
                    path: 'monitoramento',
                    name: 'AdminMonitoramento',
                    component: () => import('./views/admin/AdminMonitoramento.vue')
                }
            ]
        },

        // ═══════════════════════════════════════════════════
        // ROTA 404 (OPCIONAL)
        // ═══════════════════════════════════════════════════
        {
            path: '/:pathMatch(.*)*',
            redirect: '/'
        }
    ],
    scrollBehavior(to, from, savedPosition) {
        return savedPosition || { top: 0 };
    },
});

// ═══════════════════════════════════════════════════════════
// ✅ ROUTER GUARD: Protege todas as rotas /admin
// ═══════════════════════════════════════════════════════════
router.beforeEach((to, from, next) => {
    const { estaLogado } = useAuth();

    // Se está tentando acessar algo em /admin (exceto o login) e não está logado
    if (to.path.startsWith('/admin') && to.path !== '/admin/login') {
        if (!estaLogado.value) {
            next('/admin/login');
            return;
        }
    }

    // Se já está logado e tenta ir para o login, redireciona para o dashboard
    if (to.path === '/admin/login' && estaLogado.value) {
        next('/admin/dashboard');
        return;
    }

    next();
});

createApp(App).use(router).mount('#app');

// ═══════════════════════════════════════════════════════════
// SPLASH SCREEN (mantido do seu código original)
// ═══════════════════════════════════════════════════════════
setTimeout(() => {
    const splash = document.getElementById('app-loading');
    if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.remove();
        }, 400);
    }
}, 600);
import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import AdminLayout from './layouts/AdminLayout.vue';
import { useAuth } from './composables/useAuth.js';
import { useEntregadorAuth } from './composables/useEntregadorAuth.js'; 




// ✅ Inicializa o sistema de autenticação
const { inicializarSistema } = useAuth();
inicializarSistema();




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
    path: '/entregador/login',
    name: 'EntregadorLogin',
    component: () => import('./views/EntregadorLogin.vue')
},
{
    path: '/entregador/painel',
    name: 'EntregadorPainel',
    component: () => import('./views/EntregadorPainel.vue')
},
{
    path: '/entregador/rota/:id',
    name: 'EntregadorRota',
    component: () => import('./views/Entregador.vue') // ← sua tela existente
},
{
    path: '/entregador',
    redirect: '/entregador/painel'
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
router.beforeEach((to, from) => {
    const { estaLogado } = useAuth();
    const { entregadorLogado } = useEntregadorAuth();

    // Admin
    if (to.path.startsWith('/admin') && to.path !== '/admin/login') {
        if (!estaLogado.value) return '/admin/login';
    }
    if (to.path === '/admin/login' && estaLogado.value) {
        return '/admin/dashboard';
    }

    // ✅ Entregador
    if (to.path.startsWith('/entregador') && to.path !== '/entregador/login') {
        if (!entregadorLogado.value) return '/entregador/login';
    }
    if (to.path === '/entregador/login' && entregadorLogado.value) {
        return '/entregador/painel';
    }

    return true;
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
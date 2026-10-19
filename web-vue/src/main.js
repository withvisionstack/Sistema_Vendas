import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import Entregador from './views/Entregador.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: Entregador },
        { path: '/entregador', component: Entregador },
    ],
});

createApp(App).use(router).mount('#app');
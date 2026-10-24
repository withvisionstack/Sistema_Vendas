<script setup>
import { ref, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { MapPin, ChevronDown, ShoppingCart, User } from 'lucide-vue-next';
import NotificacoesHeader from './NotificacoesHeader.vue';
import { useCarrinho } from '../../composables/useCarrinho.js';
import { usePerfil } from '../../composables/usePerfil.js';
import { useLoja } from '../../composables/useLoja.js';

const { totalItens } = useCarrinho();
const { perfil, enderecoPrincipal } = usePerfil();
const { configLoja } = useLoja();

const lojaSegura = computed(() => configLoja.value || {});

const logoEhImagem = computed(() => {
    const logo = lojaSegura.value.logo;
    if (typeof logo !== 'string') return false;
    return logo.startsWith('http') || logo.startsWith('/') || logo.startsWith('data:image');
});

const textoEndereco = computed(() => {
    if (perfil.value?.nome) {
        return `Olá, ${perfil.value.nome.split(' ')[0]}`;
    }
    if (enderecoPrincipal.value) {
        return `${enderecoPrincipal.value.rua}, ${enderecoPrincipal.value.numero}`;
    }
    return 'Definir endereço';
});

const emit = defineEmits(['abrir-capa']);

const abrirCapaPelaLogo = (e) => {
    e.preventDefault();
    if (configLoja.value?.capas && configLoja.value.capas.length > 0) {
        emit('abrir-capa', configLoja.value.capas[0]);
    }
};
</script>

<template>
    <header class="header">
        <RouterLink to="/" class="logo" @click="abrirCapaPelaLogo">
            <div class="logo-emoji">
                <img v-if="logoEhImagem" :src="lojaSegura.logo" class="logo-img" alt="" />
                <span v-else>{{ lojaSegura.logo || '🍔' }}</span>
            </div>
            <span class="logo-nome">{{ lojaSegura.nome || 'Hamburgueria' }}</span>
        </RouterLink>

        <nav class="nav-desktop">
            <ul>
                <li><RouterLink to="/">Cardápio</RouterLink></li>
                <li><RouterLink to="/bebidas">Bebidas</RouterLink></li>
                <li><RouterLink to="/pedidos">Pedidos</RouterLink></li>
            </ul>
        </nav>

        <div class="acoes">
            <RouterLink to="/perfil" class="endereco-btn">
                <MapPin :size="14" class="icone" />
                <span class="endereco-texto">{{ textoEndereco }}</span>
                <ChevronDown :size="12" class="icone" />
            </RouterLink>

            <RouterLink to="/perfil" class="btn-perfil-desktop" aria-label="Meu Perfil">
                <User :size="20" />
            </RouterLink>

            <NotificacoesHeader />

            <RouterLink to="/carrinho" class="carrinho-btn" aria-label="Abrir carrinho">
                <ShoppingCart :size="20" class="icone-carrinho" />
                <span v-if="totalItens > 0" class="badge">{{ totalItens }}</span>
            </RouterLink>
        </div>
    </header>
</template>

<style scoped>
.header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #fff;
    color: #1a1a1a;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 16px;
    border-bottom: 1px solid #fee2e2;
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.08);
    width: 100%;
    box-sizing: border-box;
}

.logo {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    text-decoration: none;
    color: inherit;
}

.logo-emoji {
    width: 34px;
    height: 34px;
    background: linear-gradient(135deg, #dc2626, #f97316);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
    overflow: hidden;
}

.logo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

.logo-nome {
    font-weight: 800;
    font-size: 16px;
    color: #1a1a1a;
}

.nav-desktop {
    display: none;
}

.acoes {
    display: flex;
    align-items: center;
    gap: 12px;
}

.endereco-btn {
    display: none;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 16px;
    color: #dc2626;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    max-width: 180px;
    text-decoration: none;
    transition: background 0.2s;
}

.endereco-btn:hover {
    background: #fee2e2;
}

.endereco-texto {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.icone {
    flex-shrink: 0;
    color: #dc2626;
}

.btn-perfil-desktop {
    display: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #f5f5f5;
    color: #333;
    text-decoration: none;
    transition: background 0.2s;
}

.btn-perfil-desktop:hover {
    background: #eee;
}

.carrinho-btn {
    position: relative;
    width: 40px;
    height: 40px;
    background: #dc2626;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    text-decoration: none;
    transition: transform 0.1s ease;
}

.carrinho-btn:active {
    transform: scale(0.95);
}

.icone-carrinho {
    color: #fff;
}

.badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    background: #fff;
    color: #dc2626;
    border-radius: 9px;
    font-size: 10px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #dc2626;
    box-sizing: border-box;
}

@media (min-width: 768px) {
    .header {
        padding: 12px 32px;
    }

    .nav-desktop {
        display: flex;
        flex: 1;
        justify-content: center;
    }

    .nav-desktop ul {
        display: flex;
        gap: 32px;
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .nav-desktop a {
        color: #555;
        text-decoration: none;
        font-size: 15px;
        font-weight: 600;
        padding: 6px 2px;
        transition: color 0.2s;
    }

    .nav-desktop a:hover,
    .nav-desktop a.router-link-active {
        color: #dc2626;
    }

    .endereco-btn,
    .btn-perfil-desktop {
        display: flex;
    }
}
</style>
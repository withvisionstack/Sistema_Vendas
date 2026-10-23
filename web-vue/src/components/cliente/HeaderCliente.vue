<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { MapPin, ChevronDown, ShoppingCart, User } from 'lucide-vue-next';
import NotificacoesHeader from './NotificacoesHeader.vue';
import { useCarrinho } from '../../composables/useCarrinho.js';
import { usePerfil } from '../../composables/usePerfil.js';
import { useLoja } from '../../composables/useLoja.js';

const emit = defineEmits(['abrir-capa']);

const { totalItens } = useCarrinho();
const { perfil, enderecoPrincipal } = usePerfil();
const { configLoja } = useLoja();

// Protege contra configLoja ainda não carregado (undefined/null)
const loja = computed(() => configLoja.value || {});

const logoEhImagem = computed(() => {
    const logo = loja.value.logo;
    return typeof logo === 'string' && (logo.startsWith('http') || logo.startsWith('data:image'));
});

const navItems = [
    { to: '/', label: 'Cardápio', exact: true }, // "/" é prefixo de tudo, então só marca ativo quando exato
    { to: '/bebidas', label: 'Bebidas' },
    { to: '/pedidos', label: 'Pedidos' },
];

const textoPerfil = computed(() => {
    const nome = perfil.value?.nome?.trim();
    if (nome) return `Olá, ${nome.split(' ')[0]}`;

    const end = enderecoPrincipal.value;
    return end ? `${end.rua}, ${end.numero}` : 'Definir endereço';
});

const badgeCarrinho = computed(() => (totalItens.value > 99 ? '99+' : totalItens.value));

const abrirCapaPelaLogo = (event) => {
    const capa = loja.value.capas?.[0];
    if (!capa) return; // sem capa: o link segue normalmente para "/"

    event.preventDefault();
    emit('abrir-capa', capa);
};
</script>

<template>
    <header class="header">
        <!-- Logo (dinâmica) -->
        <RouterLink to="/" class="logo" @click="abrirCapaPelaLogo">
            <span class="logo-emoji">
                <img v-if="logoEhImagem" :src="loja.logo" class="logo-img" alt="" />
                <span v-else aria-hidden="true">{{ loja.logo || '🍔' }}</span>
            </span>
            <span class="logo-nome">{{ loja.nome }}</span>
        </RouterLink>

        <!-- Navegação desktop -->
        <nav class="nav-desktop" aria-label="Navegação principal">
            <ul>
                <li v-for="item in navItems" :key="item.to">
                    <RouterLink
                        :to="item.to"
                        :active-class="item.exact ? '' : 'ativo'"
                        exact-active-class="ativo"
                    >
                        {{ item.label }}
                    </RouterLink>
                </li>
            </ul>
        </nav>

        <!-- Ações à direita -->
        <div class="acoes">
            <RouterLink to="/perfil" class="endereco-btn">
                <MapPin :size="14" class="icone" />
                <span class="endereco-texto">{{ textoPerfil }}</span>
                <ChevronDown :size="12" class="icone" />
            </RouterLink>

            <RouterLink to="/perfil" class="btn-perfil-desktop" aria-label="Meu perfil">
                <User :size="20" />
            </RouterLink>

            <NotificacoesHeader />

            <RouterLink
                to="/carrinho"
                class="carrinho-btn"
                :aria-label="totalItens > 0 ? `Abrir carrinho, ${totalItens} itens` : 'Abrir carrinho'"
            >
                <ShoppingCart :size="20" class="icone-carrinho" />
                <span v-if="totalItens > 0" class="badge" aria-hidden="true">{{ badgeCarrinho }}</span>
            </RouterLink>
        </div>
    </header>
</template>

<style scoped>
.header {
    --color-accent: #dc2626;
    --color-accent-soft: #fef2f2;

    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    width: 100%;
    box-sizing: border-box;
    padding: 12px 16px;
    background: #fff;
    color: #1a1a1a;
    border-bottom: 1px solid #fee2e2;
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.08);
}

/* ───────────── Logo ───────────── */
.logo {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0; /* deixa o nome encolher em vez de empurrar as ações para fora */
    color: inherit;
    text-decoration: none;
}

.logo-emoji {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    overflow: hidden;
    background: linear-gradient(135deg, #dc2626, #f97316);
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
    font-size: 18px;
}

.logo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.logo-nome {
    overflow: hidden;
    font-size: 16px;
    font-weight: 800;
    color: #1a1a1a;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* ───────────── Navegação ───────────── */
.nav-desktop {
    display: none;
}

/* ───────────── Ações ───────────── */
.acoes {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 12px;
}

.endereco-btn {
    display: none;
    align-items: center;
    gap: 4px;
    max-width: 180px;
    padding: 6px 12px;
    background: var(--color-accent-soft);
    border: 1px solid #f8f3f3;
    border-radius: 16px;
    color: var(--color-accent);
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.2s;
}

.endereco-btn:hover {
    background: #fee2e2;
}

.endereco-texto {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.icone {
    flex-shrink: 0;
    color: var(--color-accent);
}

.btn-perfil-desktop {
    display: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: #f5f5f5;
    border-radius: 50%;
    color: #333;
    text-decoration: none;
    transition: background 0.2s;
}

.btn-perfil-desktop:hover {
    background: #eee;
}

.carrinho-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--color-accent);
    border-radius: 50%;
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
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    background: #fff;
    border: 2px solid var(--color-accent);
    border-radius: 9px;
    color: var(--color-accent);
    font-size: 10px;
    font-weight: 800;
}

/* ───────────── Foco (teclado) ───────────── */
.logo:focus-visible,
.endereco-btn:focus-visible,
.btn-perfil-desktop:focus-visible,
.carrinho-btn:focus-visible,
.nav-desktop a:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
}

/* ───────────── Desktop ───────────── */
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
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .nav-desktop a {
        padding: 6px 2px;
        color: #555;
        font-size: 15px;
        font-weight: 600;
        text-decoration: none;
        transition: color 0.2s;
    }

    .nav-desktop a:hover,
    .nav-desktop a.ativo {
        color: var(--color-accent);
    }

    .endereco-btn,
    .btn-perfil-desktop {
        display: flex;
    }
}
</style>
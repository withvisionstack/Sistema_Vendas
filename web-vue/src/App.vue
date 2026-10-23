<template>
    <router-view />
    <!-- Modal global de imagem -->
    <ImageModal />
</template>

<script setup>
import ImageModal from './components/cliente/ImageModal.vue';
</script>

<style>
* { box-sizing: border-box; }
:root {
    /* 🎨 Paleta principal */
    --bg-cliente: #ffffff;        /* ✅ fundo da área do cliente */
    --bg-cliente-secundario: #fafafa; /* fundo de cards */
    --bg-admin: #f4f4f5;          /* fundo da área do admin */
    --cor-primaria: #dc2626;      /* vermelho */
}
html, body, #app { height: 100%; margin: 0; font-family: system-ui, sans-serif; }
</style>
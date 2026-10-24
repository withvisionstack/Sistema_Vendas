<template>
    <router-view />
    <!-- Modal global de imagem -->
    <ImageModal />
</template>

<script setup>
import { onMounted } from 'vue';
import { useLoja } from './composables/useLoja.js';
import { useTaxasEntrega } from './composables/useTaxasEntrega.js'; // ✅ NOVO
import ImageModal from './components/cliente/ImageModal.vue';
import { useEntregadores } from './composables/useEntregadores.js'; // ✅ NOVO


const { carregarLoja } = useLoja();
const { carregarTaxas } = useTaxasEntrega(); // ✅ NOVO
const { carregarEntregadores } = useEntregadores(); // ✅ NOVO

onMounted(() => {
    carregarLoja(); // Carrega a loja 1x, todos os componentes veem
    carregarTaxas();
    carregarEntregadores();
});


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
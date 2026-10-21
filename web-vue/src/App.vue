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
html, body, #app { height: 100%; margin: 0; font-family: system-ui, sans-serif; }
</style>
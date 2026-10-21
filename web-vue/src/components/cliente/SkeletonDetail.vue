<script setup>
// Esqueleto específico para a tela de Detalhes do Produto
</script>

<template>
    <div class="skeleton-detalhe">
        <!-- Imagem grande (Hero) -->
        <div class="sk-hero"></div>

        <!-- Bloco de Título e Descrição -->
        <div class="sk-bloco-texto">
            <div class="sk-titulo-grande"></div>
            <div class="sk-texto"></div>
            <div class="sk-texto curto"></div>
            <div class="sk-preco"></div>
        </div>

        <!-- Bloco de Acompanhamentos -->
        <div class="sk-bloco-acompanhamentos">
            <div class="sk-subtitulo"></div>
            <div class="sk-caixa-ac"></div>
            <div class="sk-caixa-ac"></div>
            <div class="sk-caixa-ac"></div>
        </div>
    </div>
</template>

<style scoped>
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
}

.skeleton-detalhe {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.sk-hero {
    width: 100%;
    height: 220px;
    background: #e5e5e5;
    border-radius: 20px;
    animation: pulse 1.5s infinite;
}

.sk-bloco-texto {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.sk-titulo-grande {
    width: 70%;
    height: 28px;
    background: #e5e5e5;
    border-radius: 8px;
    animation: pulse 1.5s infinite;
}

.sk-texto {
    width: 100%;
    height: 16px;
    background: #e5e5e5;
    border-radius: 4px;
    animation: pulse 1.5s infinite;
}

.sk-texto.curto { width: 50%; }

.sk-preco {
    width: 100px;
    height: 24px;
    background: #e5e5e5;
    border-radius: 6px;
    margin-top: 8px;
    animation: pulse 1.5s infinite;
}

.sk-bloco-acompanhamentos {
    background: #fff;
    padding: 16px;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.sk-subtitulo {
    width: 40%;
    height: 20px;
    background: #e5e5e5;
    border-radius: 4px;
    margin-bottom: 8px;
    animation: pulse 1.5s infinite;
}

.sk-caixa-ac {
    width: 100%;
    height: 48px;
    background: #f0f0f0;
    border-radius: 8px;
    animation: pulse 1.5s infinite;
}
</style>
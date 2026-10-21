<template>
    <div class="skeleton-lista">
        <!-- Renderiza 3 esqueletos de itens para simular a lista -->
        <div v-for="i in 3" :key="i" class="skeleton-item-card">
            <!-- Esqueleto da Imagem -->
            <div class="sk-img"></div>

            <div class="sk-info">
                <!-- Esqueleto do Título e Quantidade -->
                <div class="sk-header">
                    <div class="sk-linha sk-titulo"></div>
                    <div class="sk-linha sk-qtd"></div>
                </div>

                <!-- Esqueleto da descrição/acompanhamentos -->
                <div class="sk-linha sk-desc"></div>
                <div class="sk-linha sk-desc-curta"></div>

                <!-- Esqueleto do Preço -->
                <div class="sk-footer">
                    <div class="sk-linha sk-preco"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.skeleton-lista {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.skeleton-item-card {
    background: #fff;
    border-radius: 16px;
    padding: 12px;
    display: flex;
    gap: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

/* Animação de pulsar */
@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

.sk-img {
    width: 80px;
    height: 80px;
    border-radius: 12px;
    background-color: #e5e7eb;
    animation: pulse 1.5s infinite ease-in-out;
    flex-shrink: 0;
}

.sk-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.sk-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
}

.sk-linha {
    background-color: #e5e7eb;
    border-radius: 4px;
    animation: pulse 1.5s infinite ease-in-out;
}

.sk-titulo {
    width: 60%;
    height: 16px;
}

.sk-qtd {
    width: 24px;
    height: 16px;
}

.sk-desc {
    width: 90%;
    height: 12px;
    margin-bottom: 6px;
}

.sk-desc-curta {
    width: 40%;
    height: 12px;
}

.sk-footer {
    margin-top: auto;
    padding-top: 12px;
}

.sk-preco {
    width: 30%;
    height: 16px;
}
</style>
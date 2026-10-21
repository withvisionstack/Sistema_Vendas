<template>
    <div class="skeleton-cardapio">
        <!-- Saudação -->
        <div class="sk-linha sk-saudacao"></div>

        <!-- Categorias (Pills) -->
        <div class="sk-categorias">
            <div v-for="i in 5" :key="i" class="sk-pill"></div>
        </div>

        <!-- Grade de Produtos -->
        <div class="sk-grade">
            <div v-for="i in 4" :key="i" class="sk-produto">
                <div class="sk-imagem"></div>
                <div class="sk-linha sk-nome"></div>
                <div class="sk-linha sk-desc"></div>
                <div class="sk-linha sk-preco"></div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.skeleton-cardapio {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding-top: 8px;
}

/* Animação */
@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

.sk-linha, .sk-pill, .sk-imagem, .sk-produto {
    background-color: #e5e7eb;
    animation: pulse 1.5s infinite ease-in-out;
}

/* Saudação */
.sk-saudacao {
    width: 60%;
    height: 24px;
    border-radius: 6px;
    margin-bottom: 4px;
}

/* Categorias */
.sk-categorias {
    display: flex;
    gap: 12px;
    overflow: hidden;
}

.sk-pill {
    min-width: 80px;
    height: 36px;
    border-radius: 18px;
    flex-shrink: 0;
}

/* Grade de Produtos */
.sk-grade {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
}

@media (min-width: 768px) {
    .sk-grade {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (min-width: 1024px) {
    .sk-grade {
        grid-template-columns: repeat(4, 1fr);
    }
}

.sk-produto {
    background: #fff;
    border-radius: 16px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.sk-imagem {
    width: 100%;
    height: 120px;
    border-radius: 12px;
    margin-bottom: 4px;
}

.sk-nome { width: 80%; height: 16px; border-radius: 4px; }
.sk-desc { width: 100%; height: 12px; border-radius: 4px; }
.sk-preco { width: 40%; height: 18px; border-radius: 4px; margin-top: 4px; }
</style>
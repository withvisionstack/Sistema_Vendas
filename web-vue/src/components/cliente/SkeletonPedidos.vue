<template>
    <div class="skeleton-lista">
        <div v-for="i in 3" :key="i" class="sk-card">
            <!-- Cabeçalho -->
            <div class="sk-header">
                <div class="sk-info">
                    <div class="sk-linha sk-titulo"></div>
                    <div class="sk-linha sk-data"></div>
                </div>
                <div class="sk-linha sk-badge"></div>
            </div>

            <!-- Itens -->
            <div class="sk-itens">
                <div class="sk-linha sk-item"></div>
                <div class="sk-linha sk-item-curto"></div>
            </div>

            <!-- Rodapé -->
            <div class="sk-footer">
                <div class="sk-linha sk-pagamento"></div>
                <div class="sk-linha sk-total"></div>
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

.sk-card {
    background: #fff;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

/* Animação */
@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

.sk-linha {
    background-color: #e5e7eb;
    border-radius: 4px;
    animation: pulse 1.5s infinite ease-in-out;
}

/* Cabeçalho */
.sk-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px dashed #eee;
}

.sk-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.sk-titulo { width: 100px; height: 16px; }
.sk-data { width: 80px; height: 12px; }
.sk-badge { width: 80px; height: 24px; border-radius: 20px; }

/* Itens */
.sk-itens {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
}

.sk-item { width: 80%; height: 14px; }
.sk-item-curto { width: 50%; height: 14px; }

/* Rodapé */
.sk-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fafafa;
    padding: 12px;
    border-radius: 12px;
}

.sk-pagamento { width: 120px; height: 14px; }
.sk-total { width: 70px; height: 18px; }
</style>
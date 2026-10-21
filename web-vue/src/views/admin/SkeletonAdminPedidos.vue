<template>
    <div class="skeleton-grid">
        <!-- Renderiza 4 cards falsos -->
        <div v-for="i in 4" :key="i" class="sk-card">

            <!-- Topo: Número e Status -->
            <div class="sk-top">
                <div class="sk-linha sk-titulo"></div>
                <div class="sk-linha sk-badge"></div>
            </div>

            <!-- Cliente -->
            <div class="sk-cliente">
                <div class="sk-linha sk-nome"></div>
                <div class="sk-linha sk-fone"></div>
                <div class="sk-linha sk-endereco"></div>
            </div>

            <!-- Item do Pedido (Foto + Texto) -->
            <div class="sk-item">
                <div class="sk-img"></div>
                <div class="sk-info">
                    <div class="sk-linha sk-item-nome"></div>
                    <div class="sk-linha sk-item-desc"></div>
                    <div class="sk-linha sk-item-adicional"></div>
                </div>
            </div>

            <!-- Rodapé (Total e Select) -->
            <div class="sk-footer">
                <div class="sk-linha sk-total"></div>
                <div class="sk-linha sk-select"></div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 16px;
}

.sk-card {
    background: #fff;
    border-radius: 12px;
    padding: 16px;
    border: 1px solid #e4e4e7;
    box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    display: flex;
    flex-direction: column;
}

/* Animação Pulsar */
@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

.sk-linha, .sk-img, .sk-badge {
    background-color: #e5e7eb;
    border-radius: 4px;
    animation: pulse 1.5s infinite ease-in-out;
}

/* Topo */
.sk-top { display: flex; justify-content: space-between; margin-bottom: 16px; }
.sk-titulo { width: 100px; height: 20px; }
.sk-badge { width: 80px; height: 24px; border-radius: 6px; }

/* Cliente */
.sk-cliente { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f4f4f5; }
.sk-nome { width: 60%; height: 16px; }
.sk-fone { width: 40%; height: 12px; }
.sk-endereco { width: 80%; height: 12px; }

/* Item */
.sk-item { display: flex; gap: 12px; background: #fafafa; padding: 12px; border-radius: 8px; border: 1px solid #f4f4f5; margin-bottom: 16px; }
.sk-img { width: 60px; height: 60px; border-radius: 6px; flex-shrink: 0; }
.sk-info { flex: 1; display: flex; flex-direction: column; gap: 8px; justify-content: center; }
.sk-item-nome { width: 70%; height: 16px; }
.sk-item-desc { width: 90%; height: 12px; }
.sk-item-adicional { width: 50%; height: 12px; }

/* Rodapé */
.sk-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
.sk-total { width: 80px; height: 24px; }
.sk-select { width: 140px; height: 38px; border-radius: 8px; }
</style>
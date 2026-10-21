<template>
    <div class="sk-dashboard">
        <!-- Header -->
        <div class="sk-header">
            <div class="sk-linha sk-titulo"></div>
            <div class="sk-linha sk-btn"></div>
        </div>

        <!-- Cards de Resumo -->
        <div class="sk-cards">
            <div v-for="i in 3" :key="i" class="sk-card">
                <div class="sk-icone"></div>
                <div class="sk-info">
                    <div class="sk-linha sk-label"></div>
                    <div class="sk-linha sk-valor"></div>
                </div>
            </div>
        </div>

        <!-- Grid (Gráfico + Estoque) -->
        <div class="sk-grid">
            <!-- Gráfico -->
            <div class="sk-painel">
                <div class="sk-linha sk-subtitulo"></div>
                <div class="sk-grafico">
                    <div v-for="i in 7" :key="i" class="sk-barra" :style="{ height: `${20 + Math.random() * 80}%` }"></div>
                </div>
            </div>

            <!-- Estoque -->
            <div class="sk-painel">
                <div class="sk-linha sk-subtitulo"></div>
                <div class="sk-lista">
                    <div v-for="i in 4" :key="i" class="sk-item">
                        <div class="sk-img"></div>
                        <div class="sk-item-texto">
                            <div class="sk-linha sk-nome"></div>
                            <div class="sk-linha sk-preco"></div>
                        </div>
                        <div class="sk-controle"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

.sk-linha, .sk-icone, .sk-barra, .sk-img, .sk-controle {
    background-color: #e5e7eb;
    border-radius: 4px;
    animation: pulse 1.5s infinite ease-in-out;
}

.sk-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.sk-titulo { width: 180px; height: 24px; }
.sk-btn { width: 120px; height: 36px; border-radius: 8px; }

.sk-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
@media (max-width: 900px) { .sk-cards { grid-template-columns: 1fr; } }
.sk-card { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e4e4e7; display: flex; gap: 16px; align-items: center; }
.sk-icone { width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0; }
.sk-info { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.sk-label { width: 60%; height: 12px; }
.sk-valor { width: 80%; height: 20px; }

.sk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
@media (max-width: 900px) { .sk-grid { grid-template-columns: 1fr; } }
.sk-painel { background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #e4e4e7; }
.sk-subtitulo { width: 150px; height: 18px; margin-bottom: 24px; }

.sk-grafico { display: flex; align-items: flex-end; justify-content: space-between; height: 200px; gap: 8px; }
.sk-barra { flex: 1; border-radius: 4px 4px 0 0; }

.sk-lista { display: flex; flex-direction: column; gap: 12px; }
.sk-item { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #f4f4f5; border-radius: 8px; }
.sk-img { width: 40px; height: 40px; border-radius: 6px; flex-shrink: 0; }
.sk-item-texto { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.sk-nome { width: 70%; height: 14px; }
.sk-preco { width: 40%; height: 12px; }
.sk-controle { width: 80px; height: 32px; border-radius: 6px; }
</style>
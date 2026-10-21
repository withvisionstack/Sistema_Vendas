<template>
    <div class="sk-monitoramento">
        <!-- Fundo do Mapa -->
        <div class="sk-mapa">
            <div class="sk-mapa-msg">Carregando mapa...</div>
        </div>

        <!-- Painel Flutuante -->
        <div class="sk-painel">
            <div class="sk-painel-header">
                <div class="sk-linha sk-titulo"></div>
                <div class="sk-linha sk-badge"></div>
            </div>
            <div class="sk-lista">
                <div v-for="i in 3" :key="i" class="sk-card">
                    <div class="sk-card-top">
                        <div class="sk-linha sk-id"></div>
                        <div class="sk-linha sk-status"></div>
                    </div>
                    <div class="sk-linha sk-info"></div>
                    <div class="sk-linha sk-info-curta"></div>
                    <div class="sk-acoes">
                        <div class="sk-btn"></div>
                        <div class="sk-btn"></div>
                        <div class="sk-btn"></div>
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

.sk-monitoramento {
    position: relative;
    width: 100%;
    height: calc(100vh - 64px);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e4e4e7;
    background: #1a1a1a;
}

.sk-mapa {
    width: 100%;
    height: 100%;
    background: #27272a;
    display: flex;
    align-items: center;
    justify-content: center;
}

.sk-mapa-msg { color: #52525b; font-weight: 600; font-size: 14px; animation: pulse 1.5s infinite; }

.sk-painel {
    position: absolute;
    top: 16px;
    left: 16px;
    width: 320px;
    max-height: calc(100% - 32px);
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.sk-painel-header {
    padding: 16px;
    background: #18181b;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.sk-linha, .sk-btn {
    background-color: #e5e7eb;
    border-radius: 4px;
    animation: pulse 1.5s infinite ease-in-out;
}

.sk-titulo { width: 140px; height: 16px; background-color: #3f3f46; }
.sk-badge { width: 30px; height: 20px; border-radius: 10px; background-color: #3f3f46; }

.sk-lista { padding: 16px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
.sk-card { border: 1px solid #e4e4e7; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.sk-card-top { display: flex; justify-content: space-between; margin-bottom: 4px; }
.sk-id { width: 60px; height: 14px; }
.sk-status { width: 50px; height: 14px; }
.sk-info { width: 90%; height: 12px; }
.sk-info-curta { width: 60%; height: 12px; }
.sk-acoes { display: flex; gap: 8px; margin-top: 8px; }
.sk-btn { flex: 1; height: 28px; }

@media (max-width: 768px) {
    .sk-monitoramento { height: calc(100vh - 120px); flex-direction: column; }
    .sk-painel { position: static; width: 100%; height: 50%; border-radius: 0; border-top: 1px solid #e4e4e7; }
}
</style>
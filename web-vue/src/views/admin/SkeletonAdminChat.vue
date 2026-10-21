<template>
    <div class="sk-chat-layout">
        <!-- Sidebar Contatos -->
        <aside class="sk-sidebar">
            <div class="sk-header"><div class="sk-linha sk-titulo"></div></div>
            <div class="sk-lista">
                <div v-for="i in 4" :key="i" class="sk-contato">
                    <div class="sk-avatar"></div>
                    <div class="sk-info">
                        <div class="sk-linha sk-nome"></div>
                        <div class="sk-linha sk-msg"></div>
                    </div>
                </div>
            </div>
        </aside>

        <!-- Área do Chat -->
        <main class="sk-main">
            <div class="sk-header-chat">
                <div class="sk-linha sk-titulo-chat"></div>
                <div class="sk-linha sk-sub"></div>
            </div>
            <div class="sk-mensagens">
                <div class="sk-balao esquerda"></div>
                <div class="sk-balao direita"></div>
                <div class="sk-balao esquerda"></div>
                <div class="sk-balao direita curto"></div>
                <div class="sk-balao esquerda"></div>
            </div>
            <div class="sk-input">
                <div class="sk-linha sk-campo"></div>
                <div class="sk-linha sk-btn-enviar"></div>
            </div>
        </main>
    </div>
</template>

<style scoped>
@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

.sk-linha, .sk-avatar, .sk-balao {
    background-color: #e5e7eb;
    border-radius: 4px;
    animation: pulse 1.5s infinite ease-in-out;
}

.sk-chat-layout { display: flex; height: calc(100vh - 140px); background: #fff; border-radius: 12px; border: 1px solid #e4e4e7; overflow: hidden; }

/* Sidebar */
.sk-sidebar { width: 320px; border-right: 1px solid #e4e4e7; background: #fafafa; display: flex; flex-direction: column; }
.sk-header { padding: 20px; border-bottom: 1px solid #e4e4e7; }
.sk-titulo { width: 100px; height: 20px; }
.sk-lista { flex: 1; overflow-y: auto; }
.sk-contato { display: flex; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #f4f4f5; }
.sk-avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
.sk-info { flex: 1; display: flex; flex-direction: column; gap: 8px; justify-content: center; }
.sk-nome { width: 60%; height: 14px; }
.sk-msg { width: 90%; height: 10px; }

/* Área de Chat */
.sk-main { flex: 1; display: flex; flex-direction: column; background: #f9fafb; }
.sk-header-chat { padding: 16px 24px; border-bottom: 1px solid #e4e4e7; background: #fff; }
.sk-titulo-chat { width: 120px; height: 16px; margin-bottom: 6px; }
.sk-sub { width: 80px; height: 12px; }

.sk-mensagens { flex: 1; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.sk-balao { width: 45%; height: 60px; border-radius: 12px; }
.sk-balao.esquerda { align-self: flex-start; border-bottom-left-radius: 2px; }
.sk-balao.direita { align-self: flex-end; border-bottom-right-radius: 2px; }
.sk-balao.curto { height: 40px; width: 30%; }

.sk-input { padding: 16px 24px; border-top: 1px solid #e4e4e7; background: #fff; display: flex; gap: 12px; }
.sk-campo { flex: 1; height: 44px; border-radius: 22px; }
.sk-btn-enviar { width: 44px; height: 44px; border-radius: 50%; }

@media (max-width: 768px) {
    .sk-sidebar { width: 100%; }
    .sk-main { display: none; }
}
</style>
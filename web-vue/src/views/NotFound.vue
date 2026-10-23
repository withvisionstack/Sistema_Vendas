<script setup>
import { useRouter } from 'vue-router';
import { Home, ArrowLeft, Search, MapPin } from 'lucide-vue-next';

const router = useRouter();

const voltar = () => router.back();
const irParaHome = () => router.push('/');
</script>

<template>
    <div class="not-found-page">
        <div class="content">
            <div class="ilustracao">
                <div class="burger-404">
                    <span class="emoji-burger">🍔</span>
                    <div class="camadas">
                        <span class="numero">4</span>
                        <span class="zero">0</span>
                        <span class="numero">4</span>
                    </div>
                </div>
            </div>

            <h1>Ops! Página não encontrada</h1>
            <p class="sub">
                Parece que você se perdeu no caminho...
                <br>
                Essa página foi entregue em outro endereço. 🛵
            </p>

            <div class="acoes">
                <button class="btn-primary" @click="irParaHome">
                    <Home :size="18" />
                    Voltar para o cardápio
                </button>
                <button class="btn-secondary" @click="voltar">
                    <ArrowLeft :size="18" />
                    Voltar
                </button>
            </div>

            <div class="sugestoes">
                <p>Talvez você queira:</p>
                <div class="links-sugestao">
                    <RouterLink to="/bebidas" class="link-sugestao">
                        🥤 Bebidas
                    </RouterLink>
                    <RouterLink to="/pedidos" class="link-sugestao">
                        📦 Meus Pedidos
                    </RouterLink>
                    <RouterLink to="/perfil" class="link-sugestao">
                        👤 Meu Perfil
                    </RouterLink>
                    <RouterLink to="/chat" class="link-sugestao">
                        💬 Falar com a loja
                    </RouterLink>
                </div>
            </div>
        </div>

        <div class="footer-info">
            <span>Código do erro: 404</span>
        </div>
    </div>
</template>

<style scoped>
.not-found-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 50%, #fecaca 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    position: relative;
    overflow: hidden;
}

/* Bolinhas decorativas no fundo */
.not-found-page::before,
.not-found-page::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    background: rgba(220, 38, 38, 0.08);
    pointer-events: none;
}

.not-found-page::before {
    width: 400px;
    height: 400px;
    top: -100px;
    left: -150px;
}

.not-found-page::after {
    width: 300px;
    height: 300px;
    bottom: -80px;
    right: -100px;
}

.content {
    text-align: center;
    max-width: 480px;
    z-index: 1;
    animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes slideUp {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.ilustracao {
    margin-bottom: 24px;
}

.burger-404 {
    position: relative;
    display: inline-block;
    animation: flutuar 3s ease-in-out infinite;
}

@keyframes flutuar {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

.emoji-burger {
    font-size: 80px;
    display: block;
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15));
    position: relative;
    z-index: 2;
}

.camadas {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    gap: 4px;
    z-index: 1;
    font-size: 32px;
    font-weight: 900;
    color: rgba(220, 38, 38, 0.9);
    font-family: 'Arial Black', sans-serif;
    opacity: 0.85;
    text-shadow: 0 2px 8px rgba(255, 255, 255, 0.8);
}

.numero, .zero {
    font-family: 'Arial Black', sans-serif;
}

h1 {
    font-size: 28px;
    color: #18181b;
    margin: 0 0 12px 0;
    font-weight: 800;
    line-height: 1.2;
}

.sub {
    font-size: 15px;
    color: #555;
    margin: 0 0 32px 0;
    line-height: 1.6;
}

.acoes {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 32px;
}

.btn-primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #dc2626;
    color: #fff;
    border: none;
    padding: 16px 24px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.btn-primary:hover {
    background: #b91c1c;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
}

.btn-secondary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #fff;
    color: #18181b;
    border: 2px solid #e4e4e7;
    padding: 14px 24px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-secondary:hover {
    border-color: #dc2626;
    color: #dc2626;
}

.sugestoes {
    padding-top: 24px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.sugestoes p {
    font-size: 13px;
    color: #71717a;
    margin: 0 0 12px 0;
    font-weight: 600;
}

.links-sugestao {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
}

.link-sugestao {
    font-size: 13px;
    font-weight: 600;
    color: #dc2626;
    text-decoration: none;
    padding: 8px 14px;
    background: #fff;
    border-radius: 20px;
    border: 1px solid #fecaca;
    transition: all 0.2s;
}

.link-sugestao:hover {
    background: #dc2626;
    color: #fff;
    border-color: #dc2626;
}

.footer-info {
    position: absolute;
    bottom: 24px;
    font-size: 11px;
    color: #a1a1aa;
    font-family: 'Courier New', monospace;
    font-weight: 600;
    letter-spacing: 1px;
    z-index: 1;
}

/* Mobile */
@media (max-width: 480px) {
    .emoji-burger {
        font-size: 64px;
    }
    .camadas {
        font-size: 26px;
    }
    h1 {
        font-size: 22px;
    }
    .sub {
        font-size: 14px;
    }
}
</style>
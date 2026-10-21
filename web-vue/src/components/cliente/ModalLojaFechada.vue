<script setup>
import { Clock, Moon } from 'lucide-vue-next';
import { useLoja } from '../../composables/useLoja.js';

const { configLoja } = useLoja();

// O emit serve para o usuário fechar o modal (mas ele pode continuar navegando)
const emit = defineEmits(['fechar']);
</script>

<template>
    <div class="modal-overlay">
        <div class="modal-content">
            <div class="icone-box">
                <Moon :size="48" color="#dc2626" />
            </div>

            <h2>Loja Fechada 😴</h2>
            <p class="mensagem">
                No momento não estamos aceitando pedidos. Mas você pode continuar olhando o cardápio!
            </p>

            <div class="horario-box">
                <Clock :size="18" color="#71717a" />
                <span>Funcionamos das <strong>{{ configLoja.horarioAbertura }}</strong> às <strong>{{ configLoja.horarioFechamento }}</strong></span>
            </div>

            <button class="btn-entendi" @click="emit('fechar')">
                Entendi, vou olhar o cardápio
            </button>
        </div>
    </div>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 24px;
}

.modal-content {
    background: #fff;
    border-radius: 24px;
    padding: 32px 24px;
    width: 100%;
    max-width: 360px;
    text-align: center;
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.icone-box {
    width: 80px;
    height: 80px;
    background: #fef2f2;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px auto;
    border: 2px dashed #fecaca;
}

h2 {
    font-size: 24px;
    color: #1a1a1a;
    margin: 0 0 12px 0;
    font-weight: 800;
}

.mensagem {
    font-size: 15px;
    color: #555;
    line-height: 1.5;
    margin-bottom: 24px;
}

.horario-box {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #f5f5f5;
    padding: 14px;
    border-radius: 12px;
    font-size: 14px;
    color: #3f3f46;
    margin-bottom: 24px;
}

.btn-entendi {
    width: 100%;
    background: #dc2626;
    color: #fff;
    border: none;
    padding: 16px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
}

.btn-entendi:hover {
    background: #b91c1c;
}

@keyframes slideUp {
    from { transform: translateY(50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}
</style>
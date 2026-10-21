<script setup>
import { onMounted, onUnmounted } from 'vue';
import { X, ZoomIn } from 'lucide-vue-next';
import { useImageModal } from '../../composables/useImageModal.js';

const { aberto, produtoAtual, fechar } = useImageModal();

// Fecha ao apertar ESC
function handleKeydown(e) {
    if (e.key === 'Escape' && aberto.value) fechar();
}

onMounted(() => document.addEventListener('keydown', handleKeydown));
onUnmounted(() => document.removeEventListener('keydown', handleKeydown));

function formatarPreco(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}
</script>

<template>
    <Transition name="modal-fade">
        <div v-if="aberto && produtoAtual" class="modal-overlay" @click.self="fechar">
            <div class="modal-conteudo">
                <!-- Botão fechar -->
                <button class="btn-fechar" @click="fechar">
                    <X :size="24" />
                </button>

                <!-- Imagem expandida -->
                <div class="imagem-wrap">
                    <img :src="produtoAtual.imagem" :alt="produtoAtual.nome" class="imagem-expandida" />
                </div>

                <!-- Info -->
                <div class="modal-info">
                    <div class="modal-header">
                        <h2>{{ produtoAtual.nome }}</h2>
                        <span class="preco">{{ formatarPreco(produtoAtual.preco) }}</span>
                    </div>
                    <p class="descricao">{{ produtoAtual.descricao }}</p>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    cursor: zoom-out;
}

.modal-conteudo {
    position: relative;
    background: #fff;
    border-radius: 20px;
    overflow: hidden;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    cursor: default;
    animation: modal-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modal-in {
    from {
        opacity: 0;
        transform: scale(0.9) translateY(20px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.btn-fechar {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 10;
    width: 40px;
    height: 40px;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s;
}

.btn-fechar:hover {
    background: #dc2626;
}

.btn-fechar:active {
    transform: scale(0.9);
}

.imagem-wrap {
    width: 100%;
    max-height: 55vh;
    background: #f5f5f5;
    overflow: hidden;
}

.imagem-expandida {
    width: 100%;
    height: 100%;
    max-height: 55vh;
    object-fit: contain;
    display: block;
}

.modal-info {
    padding: 20px;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 8px;
}

.modal-header h2 {
    margin: 0;
    font-size: 20px;
    color: #1a1a1a;
    font-weight: 800;
    flex: 1;
}

.preco {
    font-size: 20px;
    font-weight: 800;
    color: #dc2626;
    white-space: nowrap;
}

.descricao {
    margin: 0;
    font-size: 14px;
    color: #666;
    line-height: 1.5;
}

/* Animação de fade no overlay */
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}

/* Mobile */
@media (max-width: 600px) {
    .modal-overlay {
        padding: 12px;
    }
    .modal-conteudo {
        border-radius: 16px;
    }
    .modal-info {
        padding: 16px;
    }
    .modal-header h2 {
        font-size: 18px;
    }
    .preco {
        font-size: 18px;
    }
}
</style>
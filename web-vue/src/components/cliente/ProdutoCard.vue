<script setup>
import { useImageModal } from '../../composables/useImageModal.js';

const props = defineProps({
    produto: { type: Object, required: true }
});

defineEmits(['selecionar']);

const { abrir } = useImageModal();

function formatarPreco(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

// ✅ Função auxiliar para calcular o preço com desconto
const calcularDesconto = (preco, desconto) => {
    if (!desconto || desconto === 0) return preco;
    return preco * (1 - desconto / 100);
};
</script>

<template>
    <div class="card-produto">
        <!-- Imagem do Produto -->
        <div class="prod-imagem-wrap" @click="abrir(produto)">
            <img :src="produto.imagem" :alt="produto.nome" class="prod-imagem" />
            <div class="icone-zoom">🔍</div>

            <!-- ✅ BÔNUS: Tag de desconto na imagem -->
            <div v-if="produto.desconto > 0" class="tag-desconto">
                -{{ produto.desconto }}%
            </div>
        </div>

        <!-- Informações do Produto -->
        <div class="prod-info">
            <h3>{{ produto.nome }}</h3>
            <p class="prod-desc">{{ produto.descricao }}</p>

            <!-- ✅ CORRIGIDO: Preço mostrado apenas UMA vez com a lógica correta -->
            <div class="precos-container">
                <!-- Se tiver desconto, mostra o antigo riscado e o novo em destaque -->
                <template v-if="produto.desconto > 0">
                    <span class="preco-original-riscado">{{ formatarPreco(produto.preco) }}</span>
                    <span class="preco-final-destaque">
                        {{ formatarPreco(calcularDesconto(produto.preco, produto.desconto)) }}
                    </span>
                </template>

                <!-- Se não tiver desconto, mostra o preço normal -->
                <span v-else class="preco-normal">
                    {{ formatarPreco(produto.preco) }}
                </span>
            </div>

            <button class="btn-mata-fome" @click="$emit('selecionar', produto)">
                Esse mata minha fome
            </button>
        </div>
    </div>
</template>

<style scoped>
.card-produto {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    border: 1px solid rgba(0,0,0,0.04);
    display: flex;
    flex-direction: column;
    height: 100%;
}

.prod-imagem-wrap {
    position: relative;
    width: 100%;
    height: 140px;
    background: #f5f5f5;
    cursor: zoom-in;
    overflow: hidden;
}

.prod-imagem {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
}

.prod-imagem-wrap:hover .prod-imagem { transform: scale(1.05); }

.icone-zoom {
    position: absolute;
    top: 8px; right: 8px;
    width: 28px; height: 28px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px;
    opacity: 0; transition: opacity 0.2s;
    pointer-events: none;
}

.prod-imagem-wrap:hover .icone-zoom { opacity: 1; }

.tag-desconto {
    position: absolute;
    top: 8px; left: 8px;
    background: #dc2626; color: #fff;
    font-size: 11px; font-weight: 800;
    padding: 4px 8px; border-radius: 4px;
}

.prod-info {
    padding: 12px;
    display: flex; flex-direction: column; flex: 1;
}

.prod-info h3 {
    font-size: 15px; margin: 0 0 4px 0;
    color: #1a1a1a; font-weight: 700;
}

.prod-desc {
    font-size: 12px; color: #777;
    margin: 0 0 12px 0; line-height: 1.3; flex: 1;
}

.precos-container {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 12px;
}

.preco-original-riscado {
    font-size: 12px;
    color: #a1a1aa;
    text-decoration: line-through;
}

.preco-final-destaque {
    font-size: 18px;
    font-weight: 800;
    color: #dc2626;
}

.preco-normal {
    font-size: 16px;
    font-weight: 700;
    color: #dc2626;
}

.btn-mata-fome {
    background: #dc2626; color: #fff;
    border: none; width: 100%; padding: 10px;
    border-radius: 8px; font-weight: 700;
    font-size: 13px; cursor: pointer;
    transition: background 0.2s;
}

.btn-mata-fome:hover { background: #b91c1c; }
</style>
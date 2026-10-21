<script setup>
import { ref } from 'vue';
import { Package, Plus, Edit2, Trash2, Save, X, Image as ImageIcon } from 'lucide-vue-next';
import { useProdutos } from '../../composables/useProdutos.js';

const { produtos, adicionarProduto, editarProduto, removerProduto } = useProdutos();

const modoEdicao = ref(false);
const produtoEditandoId = ref(null);

// Formulário
const form = ref({
    nome: '',
    descricao: '',
    preco: '',
    desconto: 0,
    categoriaId: 'lanches', // lanches, porcoes, bebidas
    imagem: ''
});

const limparFormulario = () => {
    form.value = { nome: '', descricao: '', preco: '', desconto: 0, categoriaId: 'lanches', imagem: '' };
    modoEdicao.value = false;
    produtoEditandoId.value = null;
};

const prepararEdicao = (produto) => {
    form.value = { ...produto };
    produtoEditandoId.value = produto.id;
    modoEdicao.value = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const salvar = () => {
    if (!form.value.nome || !form.value.preco) {
        return alert('Nome e Preço são obrigatórios.');
    }

    const precoNumerico = Number(form.value.preco);
    const descontoNumerico = Number(form.value.desconto);

    const dadosFinais = {
        ...form.value,
        preco: precoNumerico,
        desconto: descontoNumerico,
        imagem: form.value.imagem || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80' // Imagem padrão
    };

    if (modoEdicao.value) {
        editarProduto(produtoEditandoId.value, dadosFinais);
        alert('Produto atualizado!');
    } else {
        adicionarProduto(dadosFinais);
        alert('Produto adicionado!');
    }
    limparFormulario();
};

// ✅ Função de Upload de Imagem
const fazerUploadImagem = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX = 500; // Tamanho máximo da imagem do produto

            if (width > height && width > MAX) { height *= MAX / width; width = MAX; }
            else if (height > MAX) { width *= MAX / height; height = MAX; }

            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            form.value.imagem = canvas.toDataURL('image/jpeg', 0.7);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};

const formatarPreco = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
</script>

<template>
    <div class="admin-produtos">
        <header class="page-header">
            <h1>Gerenciar Produtos</h1>
            <p>Adicione, edite ou remova itens do cardápio.</p>
        </header>

        <div class="layout-grid">
            <!-- FORMULÁRIO -->
            <div class="card-form">
                <h2><Package :size="18" /> {{ modoEdicao ? 'Editar Produto' : 'Novo Produto' }}</h2>

                <div class="input-group">
                    <label>Nome do Produto *</label>
                    <input v-model="form.nome" type="text" placeholder="Ex: X-Burger" />
                </div>

                <div class="input-group">
                    <label>Descrição</label>
                    <textarea v-model="form.descricao" placeholder="Ingredientes..."></textarea>
                </div>

                <div class="row-inputs">
                    <div class="input-group">
                        <label>Preço Base (R$) *</label>
                        <input v-model="form.preco" type="number" step="0.01" placeholder="0.00" />
                    </div>
                    <div class="input-group">
                        <label>Desconto (%)</label>
                        <input v-model="form.desconto" type="number" min="0" max="100" placeholder="0" />
                    </div>
                </div>

                <div class="input-group">
                    <label>Categoria</label>
                    <select v-model="form.categoriaId" class="input-select">
                        <option value="lanches">🍔 Lanches</option>
                        <option value="porcoes">🍟 Porções</option>
                        <option value="bebidas">🥤 Bebidas</option>
                    </select>
                </div>

                <!-- UPLOAD DE IMAGEM -->
                <div class="upload-area">
                    <label>Foto do Produto</label>
                    <div class="preview-box" @click="document.getElementById('upload-prod').click()">
                        <img v-if="form.imagem" :src="form.imagem" />
                        <div v-else class="vazio"><ImageIcon :size="24"/> Adicionar Foto</div>
                    </div>
                    <input id="upload-prod" type="file" accept="image/*" @change="fazerUploadImagem" />
                </div>

                <div class="acoes-form">
                    <button v-if="modoEdicao" class="btn-cancelar" @click="limparFormulario">
                        <X :size="18" /> Cancelar
                    </button>
                    <button class="btn-salvar" @click="salvar">
                        <Save :size="18" /> {{ modoEdicao ? 'Salvar Alterações' : 'Cadastrar Produto' }}
                    </button>
                </div>
            </div>

            <!-- LISTA -->
            <div class="card-lista">
                <h2>Produtos no Cardápio ({{ produtos.length }})</h2>

                <div class="lista-produtos">
                    <div v-for="prod in produtos" :key="prod.id" class="produto-card">
                        <img :src="prod.imagem" :alt="prod.nome" class="img-prod" />

                        <div class="info-prod">
                            <div class="header-prod">
                                <strong>{{ prod.nome }}</strong>
                                <span class="categoria">{{ prod.categoriaId }}</span>
                            </div>
                            <p class="desc">{{ prod.descricao }}</p>

                            <div class="precos">
                                <!-- Mostra o preço com desconto se tiver -->
                                <span v-if="prod.desconto > 0" class="preco-final">
                                    {{ formatarPreco(prod.preco * (1 - prod.desconto / 100)) }}
                                    <span class="desconto-tag">-{{ prod.desconto }}%</span>
                                </span>
                                <span class="preco-original" :class="{ 'riscado': prod.desconto > 0 }">
                                    {{ formatarPreco(prod.preco) }}
                                </span>
                            </div>
                        </div>

                        <div class="acoes-prod">
                            <button class="btn-icon" @click="prepararEdicao(prod)"><Edit2 :size="16" /></button>
                            <button class="btn-icon deletar" @click="removerProduto(prod.id)"><Trash2 :size="16" /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════ */
/* CONTAINER GERAL                                            */
/* ═══════════════════════════════════════════════════════════ */
.admin-produtos {
    max-width: 1200px;
    margin: 0 auto;
    padding: 8px 16px 32px; /* ✅ Padding interno adicionado */
    width: 100%;
    box-sizing: border-box;
}

.page-header {
    margin-bottom: 24px;
    padding: 0 4px;
}

.page-header h1 {
    font-size: 24px;
    color: #18181b;
    margin: 0 0 4px 0;
}

.page-header p {
    color: #71717a;
    margin: 0;
    font-size: 14px;
}

/* ═══════════════════════════════════════════════════════════ */
/* GRID DE LAYOUT                                             */
/* ═══════════════════════════════════════════════════════════ */
.layout-grid {
    display: grid;
    grid-template-columns: 400px 1fr;
    gap: 24px;
    align-items: start;
}

@media (max-width: 900px) {
    .layout-grid { grid-template-columns: 1fr; }
}

/* ═══════════════════════════════════════════════════════════ */
/* CARDS (FORM E LISTA)                                       */
/* ═══════════════════════════════════════════════════════════ */
.card-form,
.card-lista {
    background: #fff;
    padding: 24px;
    border-radius: 12px;
    border: 1px solid #e4e4e7;
    box-sizing: border-box;
}

.card-form h2,
.card-lista h2 {
    font-size: 16px;
    margin: 0 0 20px 0;
    color: #18181b;
    display: flex;
    align-items: center;
    gap: 8px;
}

/* ═══════════════════════════════════════════════════════════ */
/* INPUTS                                                     */
/* ═══════════════════════════════════════════════════════════ */
.input-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
}

.input-group label {
    font-size: 13px;
    font-weight: 600;
    color: #3f3f46;
}

.input-group input,
.input-group textarea,
.input-select {
    padding: 12px;
    border: 1px solid #e4e4e7;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    width: 100%;
    box-sizing: border-box;
    font-family: inherit;
    background: #fafafa;
    transition: border-color 0.2s, background 0.2s;
}

.input-group input:focus,
.input-group textarea:focus,
.input-select:focus {
    border-color: #dc2626;
    background: #fff;
}

.input-group textarea {
    resize: none;
    height: 80px;
}

.row-inputs {
    display: flex;
    gap: 12px;
}

.row-inputs .input-group { flex: 1; }

/* ═══════════════════════════════════════════════════════════ */
/* UPLOAD DE IMAGEM                                           */
/* ═══════════════════════════════════════════════════════════ */
.upload-area {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 24px;
}

.upload-area label {
    font-size: 13px;
    font-weight: 600;
    color: #3f3f46;
}

input[type="file"] { display: none; }

.preview-box {
    width: 120px;
    height: 120px;
    background: #f5f5f5;
    border-radius: 8px;
    border: 2px dashed #d4d4d8;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
    transition: border-color 0.2s;
}

.preview-box:hover { border-color: #dc2626; }
.preview-box img { width: 100%; height: 100%; object-fit: cover; }

.preview-box .vazio {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #a1a1aa;
    font-size: 11px;
    gap: 4px;
    text-align: center;
    padding: 8px;
}

/* ═══════════════════════════════════════════════════════════ */
/* BOTÕES DO FORMULÁRIO                                       */
/* ═══════════════════════════════════════════════════════════ */
.acoes-form {
    display: flex;
    gap: 12px;
    margin-top: 16px;
}

.btn-salvar {
    flex: 1;
    background: #dc2626;
    color: #fff;
    border: none;
    padding: 12px;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.2s;
}

.btn-salvar:hover { background: #b91c1c; }

.btn-cancelar {
    background: #f4f4f5;
    color: #3f3f46;
    border: 1px solid #e4e4e7;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.2s;
}

.btn-cancelar:hover { background: #e4e4e7; }

/* ═══════════════════════════════════════════════════════════ */
/* LISTA DE PRODUTOS                                          */
/* ═══════════════════════════════════════════════════════════ */
.lista-produtos {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.produto-card {
    display: flex;
    gap: 16px;
    padding: 16px;
    background: #fafafa;
    border: 1px solid #e4e4e7;
    border-radius: 12px;
    transition: box-shadow 0.2s;
}

.produto-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

.img-prod {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
}

.info-prod {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0; /* ✅ Evita que textos longos estourem */
}

.header-prod {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    gap: 8px;
}

.header-prod strong {
    font-size: 16px;
    color: #18181b;
    word-break: break-word;
}

.categoria {
    font-size: 11px;
    background: #f4f4f5;
    padding: 2px 8px;
    border-radius: 12px;
    color: #71717a;
    font-weight: 600;
    text-transform: capitalize;
    flex-shrink: 0;
}

.desc {
    font-size: 13px;
    color: #71717a;
    margin: 0 0 8px 0;
    line-height: 1.4;
}

.precos {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: auto;
    flex-wrap: wrap;
}

.preco-final {
    font-size: 16px;
    font-weight: 800;
    color: #dc2626;
    display: flex;
    align-items: center;
    gap: 8px;
}

.desconto-tag {
    background: #dc2626;
    color: #fff;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 700;
}

.preco-original {
    font-size: 13px;
    color: #71717a;
}

.preco-original.riscado {
    text-decoration: line-through;
    color: #a1a1aa;
}

/* ═══════════════════════════════════════════════════════════ */
/* AÇÕES DO PRODUTO (EDITAR/DELETAR)                          */
/* ═══════════════════════════════════════════════════════════ */
.acoes-prod {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
}

.btn-icon {
    background: #fff;
    border: 1px solid #e4e4e7;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #3f3f46;
    transition: all 0.2s;
}

.btn-icon:hover { background: #f4f4f5; }

.btn-icon.deletar:hover {
    background: #fef2f2;
    color: #dc2626;
    border-color: #fecaca;
}

/* ═══════════════════════════════════════════════════════════ */
/* RESPONSIVIDADE (MOBILE)                                    */
/* ═══════════════════════════════════════════════════════════ */
@media (max-width: 640px) {
    /* ✅ Padding ajustado no mobile */
    .admin-produtos {
        padding: 8px 12px 32px;
    }

    .page-header h1 { font-size: 20px; }
    .page-header p { font-size: 13px; }

    /* Cards com menos padding interno no mobile */
    .card-form,
    .card-lista {
        padding: 16px;
        border-radius: 10px;
    }

    .card-form h2,
    .card-lista h2 {
        font-size: 15px;
        margin-bottom: 16px;
    }

    /* Inputs empilhados */
    .row-inputs {
        flex-direction: column;
        gap: 0;
    }

    /* Upload centralizado */
    .upload-area { align-items: flex-start; }

    /* Botões do form lado a lado (mas com quebra se necessário) */
    .acoes-form {
        flex-direction: column-reverse;
    }

    .btn-salvar,
    .btn-cancelar {
        width: 100%;
        padding: 14px;
    }

    /* Card de produto reorganizado */
    .produto-card {
        flex-wrap: wrap;
        gap: 12px;
    }

    .img-prod {
        width: 64px;
        height: 64px;
    }

    .info-prod {
        flex: 1;
        min-width: calc(100% - 90px);
    }

    .header-prod {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }

    .header-prod strong { font-size: 15px; }

    .precos {
        flex-direction: row;
        align-items: center;
        margin-top: 8px;
    }

    .preco-final { font-size: 15px; }

    /* Ações do produto: linha abaixo */
    .acoes-prod {
        flex-direction: row;
        width: 100%;
        justify-content: flex-end;
        border-top: 1px dashed #e4e4e7;
        padding-top: 8px;
        margin-top: 4px;
    }

    .btn-icon {
        width: 36px;
        height: 36px;
    }
}

/* ═══════════════════════════════════════════════════════════ */
/* TABLET (641px - 1024px)                                    */
/* ═══════════════════════════════════════════════════════════ */
@media (min-width: 641px) and (max-width: 900px) {
    .admin-produtos {
        padding: 8px 20px 32px;
    }
}
</style>
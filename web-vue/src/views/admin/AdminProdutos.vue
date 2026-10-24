<script setup>
import { ref, onMounted, computed } from 'vue';
import { Package, Edit2, Trash2, Save, Image as ImageIcon, Loader2, Upload } from 'lucide-vue-next';
import { useProdutos } from '../../composables/useProdutos.js';

const {
    produtos,
    carregando,
    carregarProdutos,
    adicionarProduto,
    editarProduto,
    removerProduto
} = useProdutos();

const modoEdicao = ref(false);
const produtoEditandoId = ref(null);
const salvando = ref(false);
const enviandoFoto = ref(false);

// ✅ REF DO INPUT FILE (para abrir via JS)
const inputImagem = ref(null);

// Formulário
const form = ref({
    nome: '',
    descricao: '',
    preco: '',
    desconto: 0,
    categoriaId: 'lanches',
    imagem: '',
    estoque: 0
});

const previewLocal = ref('');

const mostrarEstoque = computed(() => form.value.categoriaId === 'bebidas');

// ✅ FUNÇÃO QUE O TEMPLATE CHAMA
const abrirSeletorImagem = () => {
    if (enviandoFoto.value || salvando.value) return;
    inputImagem.value?.click();
};

// ═══════════════════════════════════════════════════════════
// CARREGAMENTO
// ═══════════════════════════════════════════════════════════
onMounted(() => {
    carregarProdutos();
});

// ═══════════════════════════════════════════════════════════
// FORMULÁRIO
// ═══════════════════════════════════════════════════════════
const limparFormulario = () => {
    form.value = {
        nome: '',
        descricao: '',
        preco: '',
        desconto: 0,
        categoriaId: 'lanches',
        imagem: '',
        estoque: 0
    };
    previewLocal.value = '';
    modoEdicao.value = false;
    produtoEditandoId.value = null;

    // Limpa o input file (senão o mesmo arquivo não dispara change)
    if (inputImagem.value) {
        inputImagem.value.value = '';
    }
};

const prepararEdicao = (produto) => {
    form.value = {
        nome: produto.nome || '',
        descricao: produto.descricao || '',
        preco: Number(produto.preco) || 0,       // ✅ converte string → number
        desconto: Number(produto.desconto) || 0,
        categoriaId: produto.categoriaId || 'lanches',
        imagem: produto.imagem || '',
        estoque: Number(produto.estoque) || 0
    };
    previewLocal.value = '';
    produtoEditandoId.value = produto.id;
    modoEdicao.value = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ═══════════════════════════════════════════════════════════
// UPLOAD DE FOTO (via API)
// ═══════════════════════════════════════════════════════════
const fazerUploadImagem = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        alert('Imagem muito grande. Máximo 2MB.');
        return;
    }

    if (!file.type.startsWith('image/')) {
        alert('Arquivo não é uma imagem.');
        return;
    }

    enviandoFoto.value = true;

    try {
        const comprimida = await comprimirImagem(file);

        const formData = new FormData();
        formData.append('file', comprimida, 'produto.jpg');

        const res = await fetch('/api/upload?tipo=produto', {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.erro || `Erro ${res.status}`);
        }

        const data = await res.json();
        form.value.imagem = data.url;
        previewLocal.value = data.url;
        console.log(`✅ Upload OK: ${data.url} (${data.tamanho_kb}KB)`);
    } catch (e) {
        alert('❌ Erro no upload: ' + e.message);
        console.error(e);
    } finally {
        enviandoFoto.value = false;
    }
};

// ═══════════════════════════════════════════════════════════
// COMPRESSÃO NO NAVEGADOR
// ═══════════════════════════════════════════════════════════
const comprimirImagem = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX = 800;
                let { width, height } = img;

                if (width > height && width > MAX) {
                    height *= MAX / width;
                    width = MAX;
                } else if (height > MAX) {
                    width *= MAX / height;
                    height = MAX;
                }

                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => blob ? resolve(blob) : reject(new Error('Erro na compressão')),
                    'image/jpeg',
                    0.75
                );
            };
            img.onerror = () => reject(new Error('Erro ao carregar imagem'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(file);
    });
};

// ═══════════════════════════════════════════════════════════
// SALVAR PRODUTO
// ═══════════════════════════════════════════════════════════
const salvarProduto = async () => {
    if (!form.value.nome?.trim()) {
        return alert('Nome é obrigatório.');
    }

    if (!form.value.preco || Number(form.value.preco) <= 0) {
        return alert('Preço deve ser maior que zero.');
    }

    if (enviandoFoto.value) {
        return alert('Aguarde o upload da foto terminar.');
    }

    salvando.value = true;

    try {
        const dadosFinais = {
            nome: form.value.nome.trim(),
            descricao: form.value.descricao || '',
            preco: Number(form.value.preco),
            desconto: Number(form.value.desconto) || 0,
            categoriaId: form.value.categoriaId,
            imagem: form.value.imagem || '',
            estoque: Number(form.value.estoque) || 0
        };

        if (modoEdicao.value) {
            await editarProduto(produtoEditandoId.value, dadosFinais);
            alert('✅ Produto atualizado!');
        } else {
            await adicionarProduto(dadosFinais);
            alert('✅ Produto adicionado!');
        }
        limparFormulario();
    } catch (e) {
        alert('❌ Erro ao salvar: ' + e.message);
        console.error(e);
    } finally {
        salvando.value = false;
    }
};

// ═══════════════════════════════════════════════════════════
// REMOVER
// ═══════════════════════════════════════════════════════════
const remover = async (produto) => {
    if (!confirm(`Remover "${produto.nome}"?`)) return;

    try {
        await removerProduto(produto.id);
    } catch (e) {
        alert('❌ Erro ao remover: ' + e.message);
    }
};

// ═══════════════════════════════════════════════════════════
// UTIL
// ═══════════════════════════════════════════════════════════
const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor) || 0);
};
</script>

<template>
    <div class="admin-produtos">
        <!-- CABEÇALHO -->
        <header class="page-header">
            <h1>Gerenciar Produtos</h1>
            <p>Adicione, edite ou remova itens do cardápio.</p>
        </header>

        <div class="layout-grid">
            <!-- FORMULÁRIO -->
            <section class="card-form">
                <h2>
                    <Package :size="18" />
                    {{ modoEdicao ? 'Editar Produto' : 'Novo Produto' }}
                </h2>

                <!-- NOME -->
                <div class="input-group">
                    <label for="produto-nome">Nome do Produto *</label>
                    <input
                        id="produto-nome"
                        v-model.trim="form.nome"
                        type="text"
                        placeholder="Ex: X-Burger"
                        required
                        :disabled="salvando"
                    />
                </div>

                <!-- DESCRIÇÃO -->
                <div class="input-group">
                    <label for="produto-descricao">Descrição</label>
                    <textarea
                        id="produto-descricao"
                        v-model="form.descricao"
                        placeholder="Ingredientes..."
                        rows="3"
                        :disabled="salvando"
                    ></textarea>
                </div>

                <!-- PREÇO E DESCONTO -->
                <div class="row-inputs">
                    <div class="input-group">
                        <label for="produto-preco">Preço Base (R$) *</label>
                        <input
                            id="produto-preco"
                            v-model.number="form.preco"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            required
                            :disabled="salvando"
                        />
                    </div>

                    <div class="input-group">
                        <label for="produto-desconto">Desconto (%)</label>
                        <input
                            id="produto-desconto"
                            v-model.number="form.desconto"
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            placeholder="0"
                            :disabled="salvando"
                        />
                    </div>
                </div>

                <!-- CATEGORIA E ESTOQUE -->
                <div class="row-inputs">
                    <div class="input-group">
                        <label for="produto-categoria">Categoria</label>
                        <select
                            id="produto-categoria"
                            v-model="form.categoriaId"
                            class="input-select"
                            :disabled="salvando"
                        >
                            <option value="lanches">🍔 Lanches</option>
                            <option value="porcoes">🍟 Porções</option>
                            <option value="bebidas">🥤 Bebidas</option>
                        </select>
                    </div>

                    <!-- ✅ Estoque só aparece para bebidas -->
                    <div v-if="mostrarEstoque" class="input-group">
                        <label for="produto-estoque">Estoque *</label>
                        <input
                            id="produto-estoque"
                            v-model.number="form.estoque"
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            :disabled="salvando"
                        />
                    </div>
                </div>

                <!-- UPLOAD DE IMAGEM -->
                <div class="upload-area">
                    <label class="upload-titulo" for="upload-prod">
                        Foto do Produto
                    </label>

                    <!-- PREVIEW -->
                    <div
                        class="preview-box"
                        :class="{ desabilitado: enviandoFoto || salvando }"
                        @click="abrirSeletorImagem"
                    >
                        <img
                            v-if="previewLocal || form.imagem"
                            :src="previewLocal || form.imagem"
                            alt="Pré-visualização do produto"
                        />

                        <div v-else-if="enviandoFoto" class="vazio">
                            <Loader2 :size="24" class="spin" />
                            <span>Enviando imagem...</span>
                        </div>

                        <div v-else class="vazio">
                            <ImageIcon :size="24" />
                            <span>Sem foto</span>
                        </div>
                    </div>

                    <!-- BOTÃO VISÍVEL -->
                    <label
                        for="upload-prod"
                        class="btn-escolher"
                        :class="{ desabilitado: enviandoFoto || salvando }"
                    >
                        <Loader2 v-if="enviandoFoto" :size="16" class="spin" />
                        <Upload v-else :size="16" />
                        {{
                            enviandoFoto
                                ? 'Enviando...'
                                : (previewLocal || form.imagem ? 'Trocar Foto' : 'Escolher Foto')
                        }}
                    </label>

                    <!-- INPUT FILE ESCONDIDO -->
                    <input
                        id="upload-prod"
                        ref="inputImagem"
                        type="file"
                        accept="image/*"
                        class="input-file-escondido"
                        :disabled="enviandoFoto || salvando"
                        @change="fazerUploadImagem"
                    />

                    <small v-if="!enviandoFoto">
                        Máximo de 2 MB. A imagem será comprimida e enviada ao servidor.
                    </small>
                </div>

                <!-- BOTÃO SALVAR -->
                <button
                    type="button"
                    class="btn-salvar"
                    :disabled="salvando || enviandoFoto || !form.nome?.trim()"
                    @click="salvarProduto"
                >
                    <Loader2 v-if="salvando" :size="18" class="spin" />
                    <Save v-else :size="18" />
                    {{
                        salvando
                            ? 'Salvando...'
                            : modoEdicao
                                ? 'Atualizar Produto'
                                : 'Salvar Produto'
                    }}
                </button>
            </section>

            <!-- LISTA DE PRODUTOS -->
            <section class="card-lista">
                <h2>Produtos no Cardápio ({{ produtos.length }})</h2>

                <div v-if="carregando" class="carregando">
                    <Loader2 :size="32" class="spin" />
                    <span>Carregando produtos...</span>
                </div>

                <div v-else-if="produtos.length === 0" class="vazio-lista">
                    <Package :size="48" color="#ccc" />
                    <p>Nenhum produto cadastrado.</p>
                </div>

                <div v-else class="lista-produtos">
                    <article
                        v-for="prod in produtos"
                        :key="prod.id"
                        class="produto-card"
                    >
                        <!-- IMAGEM -->
                        <img
                            v-if="prod.imagem"
                            :src="prod.imagem"
                            :alt="prod.nome"
                            class="img-prod"
                            loading="lazy"
                        />

                        <div v-else class="img-prod imagem-placeholder">
                            <ImageIcon :size="28" />
                        </div>

                        <!-- INFO -->
                        <div class="info-prod">
                            <div class="header-prod">
                                <strong>{{ prod.nome }}</strong>
                                <span class="categoria">{{ prod.categoriaId }}</span>
                            </div>

                            <p class="desc">
                                {{ prod.descricao || 'Sem descrição.' }}
                            </p>

                            <div class="precos">
                                <span
                                    v-if="Number(prod.desconto) > 0"
                                    class="preco-final"
                                >
                                    {{
                                        formatarPreco(
                                            Number(prod.preco) *
                                            (1 - Number(prod.desconto) / 100)
                                        )
                                    }}
                                    <span class="desconto-tag">
                                        -{{ prod.desconto }}%
                                    </span>
                                </span>

                                <span
                                    class="preco-original"
                                    :class="{ riscado: Number(prod.desconto) > 0 }"
                                >
                                    {{ formatarPreco(Number(prod.preco)) }}
                                </span>

                                <!-- ✅ Estoque só para bebidas -->
                                <span
                                    v-if="prod.categoriaId === 'bebidas'"
                                    class="estoque-tag"
                                    :class="{ baixo: Number(prod.estoque) < 5 }"
                                >
                                    📦 {{ prod.estoque }} un
                                </span>
                            </div>
                        </div>

                        <!-- AÇÕES -->
                        <div class="acoes-prod">
                            <button
                                type="button"
                                class="btn-icon"
                                title="Editar produto"
                                aria-label="Editar produto"
                                :disabled="salvando"
                                @click="prepararEdicao(prod)"
                            >
                                <Edit2 :size="16" />
                            </button>

                            <button
                                type="button"
                                class="btn-icon deletar"
                                title="Remover produto"
                                aria-label="Remover produto"
                                :disabled="salvando"
                                @click="remover(prod)"
                            >
                                <Trash2 :size="16" />
                            </button>
                        </div>
                    </article>
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
.admin-produtos { max-width: 1200px; margin: 0 auto; padding: 8px 16px 32px; box-sizing: border-box; }
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 24px; color: #18181b; margin: 0 0 4px 0; }
.page-header p { color: #71717a; margin: 0; }
.layout-grid { display: grid; grid-template-columns: 400px 1fr; gap: 24px; align-items: start; }
@media (max-width: 900px) { .layout-grid { grid-template-columns: 1fr; } }

.card-form, .card-lista { background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #e4e4e7; }
.card-form h2, .card-lista h2 { font-size: 16px; margin: 0 0 20px 0; color: #18181b; display: flex; align-items: center; gap: 8px; }

.input-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.input-group label { font-size: 13px; font-weight: 600; color: #3f3f46; }
.input-group input, .input-group textarea, .input-select { padding: 12px; border: 1px solid #e4e4e7; border-radius: 8px; font-size: 14px; outline: none; width: 100%; box-sizing: border-box; font-family: inherit; }
.input-group textarea { resize: none; height: 80px; }
.input-group input:focus, .input-group textarea:focus, .input-select:focus { border-color: #dc2626; }
.input-group input:disabled, .input-group textarea:disabled, .input-select:disabled { background: #f4f4f5; cursor: not-allowed; }
.row-inputs { display: flex; gap: 12px; }
.row-inputs .input-group { flex: 1; }

.upload-area { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
.upload-area label { font-size: 13px; font-weight: 600; color: #3f3f46; }
.upload-area small { font-size: 11px; color: #a1a1aa; }
input[type="file"] { display: none; }
.preview-box { width: 120px; height: 120px; background: #f5f5f5; border-radius: 8px; border: 2px dashed #d4d4d8; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; }
.preview-box:hover { border-color: #dc2626; }
.preview-box img { width: 100%; height: 100%; object-fit: cover; }
.preview-box .vazio { display: flex; flex-direction: column; align-items: center; color: #a1a1aa; font-size: 11px; gap: 4px; text-align: center; padding: 8px; }

.acoes-form { display: flex; gap: 12px; margin-top: 16px; }
.btn-salvar { flex: 1; background: #dc2626; color: #fff; border: none; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-salvar:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-cancelar { background: #f4f4f5; color: #3f3f46; border: 1px solid #e4e4e7; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-cancelar:disabled { opacity: 0.6; cursor: not-allowed; }

.lista-produtos { display: flex; flex-direction: column; gap: 16px; }
.produto-card { display: flex; gap: 16px; padding: 16px; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; }
.img-prod { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
.info-prod { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.header-prod { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; gap: 8px; }
.header-prod strong { font-size: 16px; color: #18181b; }
.categoria { font-size: 11px; background: #f4f4f5; padding: 2px 8px; border-radius: 12px; color: #71717a; font-weight: 600; text-transform: capitalize; }
.desc { font-size: 13px; color: #71717a; margin: 0 0 8px 0; }

.precos { display: flex; align-items: center; gap: 12px; margin-top: auto; flex-wrap: wrap; }
.preco-final { font-size: 16px; font-weight: 800; color: #dc2626; display: flex; align-items: center; gap: 8px; }
.desconto-tag { background: #dc2626; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; }
.preco-original { font-size: 13px; color: #71717a; }
.preco-original.riscado { text-decoration: line-through; color: #a1a1aa; }
.estoque-tag { background: #dcfce7; color: #16a34a; font-size: 11px; padding: 2px 8px; border-radius: 6px; font-weight: 700; margin-left: auto; }
.estoque-tag.baixo { background: #fef3c7; color: #d97706; }

.acoes-prod { display: flex; flex-direction: column; gap: 8px; }
.btn-icon { background: #fff; border: 1px solid #e4e4e7; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #3f3f46; transition: all 0.2s; }
.btn-icon:hover:not(:disabled) { background: #f4f4f5; }
.btn-icon:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-icon.deletar:hover:not(:disabled) { background: #fef2f2; color: #dc2626; border-color: #fecaca; }

.carregando { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 20px; color: #71717a; }
.vazio-lista { text-align: center; padding: 60px 20px; color: #71717a; }
.vazio-lista p { margin: 16px 0 0 0; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Área de upload */
.upload-area {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 20px;
}

.upload-titulo {
    font-size: 13px;
    font-weight: 600;
    color: #3f3f46;
}

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

.preview-box:hover {
    border-color: #dc2626;
}

.preview-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

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

/* ✅ Botão visível de escolher foto */
.btn-escolher {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #f4f4f5;
    border: 1px solid #e4e4e7;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #3f3f46;
    cursor: pointer;
    width: fit-content;
    transition: all 0.2s;
}

.btn-escolher:hover {
    background: #fef2f2;
    border-color: #dc2626;
    color: #dc2626;
}

.btn-escolher.desabilitado {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
}

/* ✅ Input escondido mas acessível */
.input-file-escondido {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
}

.upload-area small {
    font-size: 11px;
    color: #a1a1a1;
    line-height: 1.4;
}

/* Spinner */
.spin {
    animation: spin 1s linear infinite;
}
@keyframes spin {
    to { transform: rotate(360deg); }
}

</style>
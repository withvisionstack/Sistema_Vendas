<script setup>
import { ref } from 'vue';
import { Bike, Plus, Trash2, Phone, CheckCircle, Calendar, User, FileText, CheckCircle2, AlertTriangle, XCircle } from 'lucide-vue-next';
import { useEntregadores } from '../../composables/useEntregadores.js';

const { entregadores, adicionarEntregador, removerEntregador } = useEntregadores();

const hoje = new Date().toISOString().split('T')[0];

const novoEntregador = ref({
    nome: '',
    cpf: '',
    placa: '',
    modelo: '',
    ano: '',
    dataRegistro: hoje,
    whatsapp: '',
    status: 'ativo', // ✅ NOVO: Status padrão
    foto: ''
});

const copiarCodigo = (codigo, nome) => {
    navigator.clipboard.writeText(codigo);
    alert(`Código ${codigo} copiado!\n\nEnvie para ${nome} via WhatsApp.`);
};

const novoCodigo = (ent) => {
    if (confirm(`Gerar novo código para ${ent.nome}? O código antigo deixará de funcionar.`)) {
        const codigo = regenerarCodigo(ent.id);
        alert(`Novo código: ${codigo}`);
    }
};







const salvando = ref(false);
const previewFoto = ref('');

// ✅ Função para lidar com o Upload e Compressão da Foto
const lidarComUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 1. Verifica o tamanho máximo (1MB)
    if (file.size > 1024 * 1024) {
        alert('A foto não pode ser maior que 1MB.');
        return;
    }

    // 2. Lê o arquivo e comprime para não estourar o localStorage
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 400; // Redimensiona para 400px (foto 3x4)
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Salva comprimido em Base64
            previewFoto.value = canvas.toDataURL('image/jpeg', 0.8);
            novoEntregador.value.foto = previewFoto.value;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};

const salvar = () => {
    if (!novoEntregador.value.nome || !novoEntregador.value.placa || !novoEntregador.value.cpf) {
        alert('Preencha pelo menos o Nome, CPF e a Placa.');
        return;
    }

    // Se não tiver foto, usa uma padrão
    const fotoFinal = novoEntregador.value.foto || 'https://cdn-icons-png.flaticon.com/512/4333/4333609.png';

    adicionarEntregador({
        ...novoEntregador.value,
        foto: fotoFinal
    });

    // Limpa o formulário
    novoEntregador.value = {
        nome: '', cpf: '', placa: '', modelo: '', ano: '',
        dataRegistro: hoje, whatsapp: '', status: 'ativo', foto: ''
    };
    previewFoto.value = '';

    salvando.value = true;
    setTimeout(() => salvando.value = false, 2000);
};

const formatarData = (dataString) => {
    if (!dataString) return 'Não informada';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
};

// Função para estilizar o status do entregador
const getStatusInfo = (status) => {
    switch (status) {
        case 'ativo': return { cor: '#16a34a', texto: 'Ativo', icone: CheckCircle2 };
        case 'afastado': return { cor: '#f59e0b', texto: 'Afastado', icone: AlertTriangle };
        case 'inativo': return { cor: '#71717a', texto: 'Inativo', icone: XCircle };
        case 'desligado': return { cor: '#dc2626', texto: 'Desligado', icone: XCircle };
        default: return { cor: '#16a34a', texto: 'Ativo', icone: CheckCircle2 };
    }
};
</script>

<template>
    <div class="admin-entregadores">
        <header class="page-header">
            <h1>Gerenciar Entregadores</h1>
            <p>Cadastre a equipe, fotos, documentos e status de trabalho.</p>
        </header>

        <div class="layout-grid">
            <!-- FORMULÁRIO DE CADASTRO -->
            <div class="card-form">
                <h2><Plus :size="18" /> Novo Entregador</h2>

                <div class="input-group">
                    <label>Nome Completo *</label>
                    <input v-model="novoEntregador.nome" type="text" placeholder="Ex: João Silva" />
                </div>

                <div class="row-inputs">
                    <div class="input-group">
                        <label>CPF *</label>
                        <input v-model="novoEntregador.cpf" type="text" placeholder="000.000.000-00" />
                    </div>
                    <div class="input-group">
                        <label>WhatsApp</label>
                        <input v-model="novoEntregador.whatsapp" type="tel" placeholder="(00) 99999-9999" />
                    </div>
                </div>

                <div class="row-inputs">
                    <div class="input-group" style="flex: 2;">
                        <label>Modelo da Moto</label>
                        <input v-model="novoEntregador.modelo" type="text" placeholder="Ex: Honda CG 160" />
                    </div>
                    <div class="input-group" style="flex: 1;">
                        <label>Placa *</label>
                        <input v-model="novoEntregador.placa" type="text" placeholder="ABC-1234" />
                    </div>
                    <div class="input-group" style="max-width: 80px;">
                        <label>Ano</label>
                        <input v-model="novoEntregador.ano" type="number" placeholder="2022" />
                    </div>
                </div>

                <div class="row-inputs">
                    <div class="input-group">
                        <label>Data de Registro</label>
                        <input v-model="novoEntregador.dataRegistro" type="date" />
                    </div>
                    <div class="input-group">
                        <label>Status</label>
                        <select v-model="novoEntregador.status" class="input-select">
                            <option value="ativo">Ativo</option>
                            <option value="afastado">Afastado</option>
                            <option value="inativo">Inativo</option>
                            <option value="desligado">Desligado</option>
                        </select>
                    </div>
                </div>

                <!-- ✅ NOVO: UPLOAD DE FOTO -->
                <div class="input-group">
                    <label>Foto 3x4 (Selfie ou Rosto)</label>
                    <div class="upload-area">
                        <input type="file" accept="image/*" @change="lidarComUpload" id="foto-input" />
                        <label for="foto-input" class="btn-upload">
                            <User :size="20" /> Escolher Foto
                        </label>
                        <small>Máx: 1MB. (A imagem será comprimida)</small>
                        <img v-if="previewFoto" :src="previewFoto" class="preview-img" alt="Preview" />
                    </div>
                </div>

                <button class="btn-salvar" @click="salvar">
                    <CheckCircle :size="18" /> Cadastrar Entregador
                </button>

                <Transition name="fade">
                    <div v-if="salvando" class="sucesso-msg">Entregador cadastrado!</div>
                </Transition>
            </div>

            <!-- LISTA DE ENTREGADORES -->
            <div class="card-lista">
                <h2>Equipe ({{ entregadores.length }})</h2>

                <div v-if="entregadores.length === 0" class="vazio">
                    <Bike :size="48" color="#e4e4e7" />
                    <p>Nenhum entregador cadastrado.</p>
                </div>

                <div v-else class="grid-entregadores">
                    <div v-for="ent in entregadores" :key="ent.id" class="entregador-card" :class="ent.status">

                        <div class="card-topo">
                            <img :src="ent.foto" :alt="ent.nome" class="foto" />
                            <button class="btn-remover" @click="removerEntregador(ent.id)" title="Remover">
                                <Trash2 :size="18" />
                            </button>
                        </div>

                        <div class="codigo-acesso">
    <div class="codigo-info">
        <span class="codigo-label">Código de acesso:</span>
        <span class="codigo-valor">{{ ent.codigoAcesso }}</span>
    </div>
    <div class="codigo-acoes">
        <button 
            class="btn-codigo" 
            @click="copiarCodigo(ent.codigoAcesso, ent.nome)" 
            title="Copiar código"
        >
            📋 Copiar
        </button>
        <button 
            class="btn-codigo btn-regenerar" 
            @click="novoCodigo(ent)" 
            title="Gerar novo código"
        >
            🔄 Novo
        </button>
    </div>
</div>

                        <div class="info">
                            <strong>{{ ent.nome }}</strong>

                            <!-- CPF e Status -->
                            <div class="cpf-status">
                                <span class="cpf"><FileText :size="12"/> {{ ent.cpf }}</span>
                                <span class="badge-status" :style="{ color: getStatusInfo(ent.status).cor }">
                                    <component :is="getStatusInfo(ent.status).icone" :size="12" />
                                    {{ getStatusInfo(ent.status).texto }}
                                </span>
                            </div>

                            <span class="placa">{{ ent.placa }}</span>

                            <div class="detalhes-moto">
                                <span v-if="ent.modelo || ent.ano">
                                    <Bike :size="12"/> {{ ent.modelo }} {{ ent.ano ? `(${ent.ano})` : '' }}
                                </span>
                                <span v-if="ent.whatsapp" class="whatsapp">
                                    <Phone :size="12"/> {{ ent.whatsapp }}
                                </span>
                                <span class="data-registro">
                                    <Calendar :size="12"/> Desde: {{ formatarData(ent.dataRegistro) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Seu CSS base continua igual */
.admin-entregadores { max-width: 1100px; margin: 0 auto; }
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 24px; color: #18181b; margin: 0 0 4px 0; }
.page-header p { color: #71717a; margin: 0; }

.layout-grid { display: grid; grid-template-columns: 400px 1fr; gap: 24px; align-items: start; }
@media (max-width: 900px) { .layout-grid { grid-template-columns: 1fr; } }

.card-form { background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #e4e4e7; }
.card-form h2 { font-size: 16px; margin: 0 0 20px 0; color: #18181b; display: flex; align-items: center; gap: 8px; }

.input-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.input-group label { font-size: 13px; font-weight: 600; color: #3f3f46; }
.input-group input, .input-select { padding: 12px; border: 1px solid #e4e4e7; border-radius: 8px; font-size: 14px; outline: none; width: 100%; box-sizing: border-box; background: #fafafa; }
.input-group input:focus, .input-select:focus { border-color: #dc2626; background: #fff; }

.row-inputs { display: flex; gap: 12px; flex-wrap: wrap; }
.row-inputs .input-group { flex: 1; min-width: 100px; margin-bottom: 16px; }

/* ✅ Estilo do Upload */
.upload-area { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px; border: 2px dashed #e4e4e7; border-radius: 8px; background: #fafafa; text-align: center; }
.upload-area input[type="file"] { display: none; }
.btn-upload { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e4e4e7; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; color: #3f3f46; transition: all 0.2s; }
.btn-upload:hover { background: #f4f4f5; border-color: #dc2626; }
.upload-area small { font-size: 11px; color: #a1a1aa; }
.preview-img { width: 80px; height: 100px; object-fit: cover; border-radius: 6px; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.1); margin-top: 8px; }

.btn-salvar { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; background: #dc2626; color: #fff; border: none; padding: 14px; border-radius: 8px; font-weight: 700; font-size: 15px; cursor: pointer; margin-top: 8px; }
.btn-salvar:hover { background: #b91c1c; }

.sucesso-msg { margin-top: 12px; background: #dcfce7; color: #16a34a; padding: 10px; border-radius: 6px; font-size: 13px; font-weight: 600; text-align: center; }

/* Lista */
.card-lista { background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #e4e4e7; }
.card-lista h2 { font-size: 16px; margin: 0 0 20px 0; color: #18181b; }

.vazio { display: flex; flex-direction: column; align-items: center; padding: 40px 0; color: #a1a1aa; }
.vazio p { margin-top: 12px; font-size: 14px; }

.grid-entregadores { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.entregador-card { display: flex; flex-direction: column; padding: 16px; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; transition: transform 0.2s; }
.entregador-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

/* Efeito visual para status desligado/inativo */
.entregador-card.desligado { opacity: 0.6; border-color: #fca5a5; }
.entregador-card.inativo { opacity: 0.8; }

.card-topo { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.foto { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background: #fff; }
.btn-remover { background: transparent; border: none; color: #a1a1aa; cursor: pointer; padding: 4px; border-radius: 6px; transition: all 0.2s; }
.btn-remover:hover { color: #dc2626; background: #fef2f2; }

.info { display: flex; flex-direction: column; gap: 4px; }
.info strong { font-size: 16px; color: #18181b; }

/* CPF e Badge */
.cpf-status { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.cpf { font-size: 11px; color: #71717a; display: flex; align-items: center; gap: 4px; }
.badge-status { font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 4px; background: #fff; padding: 2px 6px; border-radius: 4px; border: 1px solid currentColor; }

.placa { font-size: 13px; font-weight: 800; color: #dc2626; background: #fef2f2; padding: 2px 8px; border-radius: 4px; width: fit-content; letter-spacing: 1px; }

.detalhes-moto { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e4e4e7; }
.detalhes-moto span { font-size: 12px; color: #71717a; display: flex; align-items: center; gap: 6px; }
.detalhes-moto .whatsapp { color: #16a34a; font-weight: 600; }
.detalhes-moto .data-registro { color: #a1a1aa; font-size: 11px; margin-top: 4px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.codigo-acesso {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    padding: 10px 12px;
    background: #fef3c7;
    border: 1px dashed #fbbf24;
    border-radius: 8px;
    flex-wrap: wrap;
}

.codigo-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.codigo-label {
    font-size: 11px;
    color: #92400e;
    font-weight: 600;
}

.codigo-valor {
    font-family: 'Courier New', monospace;
    font-weight: 800;
    font-size: 16px;
    color: #92400e;
    letter-spacing: 2px;
}

.codigo-acoes {
    display: flex;
    gap: 6px;
}

.btn-codigo {
    background: #fff;
    border: 1px solid #fbbf24;
    color: #92400e;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
}

.btn-codigo:hover {
    background: #fef3c7;
}

.btn-regenerar {
    border-color: #dc2626;
    color: #dc2626;
}

.btn-regenerar:hover {
    background: #fef2f2;
}

</style>
<script setup>
import { ref, watch, nextTick } from 'vue';
import { 
    Store, DollarSign, Clock, Save, Shield, Lock, MapPin, Image as ImageIcon, Trash2 
} from 'lucide-vue-next';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTaxasEntrega } from '../../composables/useTaxasEntrega.js';
import { useLoja } from '../../composables/useLoja.js';
import { useAuth } from '../../composables/useAuth.js';
import { registrarProtocoloPmtiles, criarStyleProtomaps } from '../../pkg/mapProtocol.js';


// ─── COMPOSABLES ───
const { taxas, salvarTaxa, removerTaxa } = useTaxasEntrega();
const { configLoja, salvarConfiguracoes } = useLoja();

registrarProtocoloPmtiles();

const abas = [
    { id: 'loja',     label: 'Loja',        icon: Store },
    { id: 'taxas',    label: 'Taxas',       icon: MapPin },
    { id: 'pix',      label: 'Pix',         icon: DollarSign },
    { id: 'politica', label: 'Privacidade', icon: Shield },
    { id: 'localizacao', label: 'Localização', icon: MapPin },
    { id: 'seguranca', label: 'Segurança', icon: Lock },
    { id: 'horarios', label: 'Horários',    icon: Clock },
];
const abaAtiva = ref('loja');

// Troca de aba e centraliza a aba clicada na barra (importante com 5 abas no celular)
const selecionarAba = (id, event) => {
    abaAtiva.value = id;
    event.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
};


const { alterarSenha } = useAuth();

const senhas = ref({
    atual: '',
    nova: '',
    confirmar: ''
});

const salvandoSenha = ref(false);

const trocarSenha = async () => {
    if (senhas.value.nova !== senhas.value.confirmar) {
        return alert('As novas senhas não coincidem.');
    }
    if (senhas.value.nova.length < 6) {
        return alert('A nova senha deve ter pelo menos 6 caracteres.');
    }

    salvandoSenha.value = true;
    const resultado = await alterarSenha(senhas.value.atual, senhas.value.nova);
    salvandoSenha.value = false;

    if (resultado.ok) {
        alert('Senha alterada com sucesso!');
        senhas.value = { atual: '', nova: '', confirmar: '' };
    } else {
        alert(resultado.msg);
    }
};

// ─── ESTADOS DE CADA ABA ───
const cfg = configLoja.value || {};

// Loja
const dadosLoja = ref({
    nome: cfg.nome || '',
    logo: cfg.logo || '',
    capas: [...(cfg.capas || [])]
});

// CNPJ é usado nas abas Pix e Privacidade: um único estado evita que uma aba
// sobrescreva a outra com um valor antigo ao salvar.
const cnpj = ref(cfg.cnpj || '');

// Taxas
const novoBairro = ref('');
const novaTaxa = ref(0);

// ═══════════════════════════════════════════════════════════
// ✅ LOCALIZAÇÃO DA LOJA
// ═══════════════════════════════════════════════════════════
const dadosLocalizacao = ref({
    lat: configLoja.value.coordenadas?.lat || -23.5507,
    lng: configLoja.value.coordenadas?.lng || -51.4607
});

let mapaLocalizacao = null;
let markerLocalizacao = null;

const inicializarMapaLocalizacao = async () => {
    if (mapaLocalizacao) return;
    await nextTick();
    const container = document.getElementById('mapa-loja');
    if (!container) return;

    mapaLocalizacao = new maplibregl.Map({
        container: 'mapa-loja',
        style: criarStyleProtomaps('light'),
        center: [dadosLocalizacao.value.lng, dadosLocalizacao.value.lat],
        zoom: 16
    });

    mapaLocalizacao.addControl(new maplibregl.NavigationControl(), 'top-right');

    markerLocalizacao = new maplibregl.Marker({ draggable: true, color: '#dc2626' })
        .setLngLat([dadosLocalizacao.value.lng, dadosLocalizacao.value.lat])
        .addTo(mapaLocalizacao);

    markerLocalizacao.on('dragend', () => {
        const lngLat = markerLocalizacao.getLngLat();
        dadosLocalizacao.value.lat = lngLat.lat;
        dadosLocalizacao.value.lng = lngLat.lng;
    });

    mapaLocalizacao.on('click', (e) => {
        markerLocalizacao.setLngLat(e.lngLat);
        dadosLocalizacao.value.lat = e.latlng.lat;
        dadosLocalizacao.value.lng = e.latlng.lng;
    });
};

watch(abaAtiva, (nova) => {
    if (nova === 'localizacao') {
        setTimeout(() => inicializarMapaLocalizacao(), 100);
    }
});

const salvarLocalizacao = () => {
    salvarConfiguracoes({
        coordenadas: {
            lat: Number(dadosLocalizacao.value.lat),
            lng: Number(dadosLocalizacao.value.lng)
        }
    });
    alert(`📍 Localização atualizada!\n\nLat: ${Number(dadosLocalizacao.value.lat).toFixed(6)}\nLng: ${Number(dadosLocalizacao.value.lng).toFixed(6)}`);
};

const usarMinhaLocalizacaoLoja = () => {
    if (!navigator.geolocation) {
        alert('GPS não suportado.');
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            dadosLocalizacao.value.lat = latitude;
            dadosLocalizacao.value.lng = longitude;
            if (mapaLocalizacao && markerLocalizacao) {
                mapaLocalizacao.flyTo({ center: [longitude, latitude], zoom: 17 });
                markerLocalizacao.setLngLat([longitude, latitude]);
            }
        },
        (err) => alert('Erro GPS: ' + err.message),
        { enableHighAccuracy: true, timeout: 10000 }
    );
};

// Pix
const dadosBancarios = ref({
    chavePix: cfg.chavePix || '',
    nomeBeneficiario: cfg.nomeBeneficiario || '',
    cidadeBeneficiario: cfg.cidadeBeneficiario || ''
});

// Política de Privacidade
const dadosPolitica = ref({
    cidadeSede: cfg.cidadeSede || '',
    emailContato: cfg.emailContato || '',
    nomeDPO: cfg.nomeDPO || '',
    emailDPO: cfg.emailDPO || ''
});

// Horários
const dadosHorario = ref({
    aberto: cfg.aberto ?? true,
    horarioAbertura: cfg.horarioAbertura || '18:00',
    horarioFechamento: cfg.horarioFechamento || '23:59'
});

const logoEhImagem = (valor) =>
    typeof valor === 'string' && (valor.startsWith('http') || valor.startsWith('data:image'));

// ─── UPLOAD DE IMAGENS ───
// Comprime a imagem e converte para Base64
const comprimirImagem = (file, maxSize, qualidade = 0.7) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
                let { width, height } = img;

                if (width > height && width > maxSize) { height *= maxSize / width; width = maxSize; }
                else if (height > maxSize) { width *= maxSize / height; height = maxSize; }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', qualidade));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });

const fazerUploadLogo = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
        dadosLoja.value.logo = await comprimirImagem(file, 300);
    } catch {
        alert('Não foi possível ler essa imagem.');
    }
    event.target.value = ''; // permite escolher o mesmo arquivo novamente
};

const fazerUploadCapas = async (event) => {
    const files = Array.from(event.target.files);
    for (const file of files) {
        try {
            dadosLoja.value.capas.push(await comprimirImagem(file, 800));
        } catch {
            alert(`Não foi possível ler "${file.name}".`);
        }
    }
    event.target.value = '';
};

const removerCapa = (index) => dadosLoja.value.capas.splice(index, 1);

// ─── AÇÕES DE SALVAR ───
const salvarLoja = () => {
    if (!dadosLoja.value.nome.trim()) return alert('O nome da loja é obrigatório.');
    salvarConfiguracoes(dadosLoja.value);
    alert('Perfil salvo com sucesso!');
};

const adicionarTaxa = () => {
    if (!novoBairro.value.trim()) return alert('Digite o bairro.');
    salvarTaxa(novoBairro.value, Number(novaTaxa.value));
    novoBairro.value = '';
    novaTaxa.value = 0;
};

const salvarBancarios = () => {
    salvarConfiguracoes({ ...dadosBancarios.value, cnpj: cnpj.value });
    alert('Dados Pix salvos!');
};

const salvarPolitica = () => {
    salvarConfiguracoes({ ...dadosPolitica.value, cnpj: cnpj.value });
    alert('Dados da Política de Privacidade salvos com sucesso!');
};

const salvarHorarios = () => {
    salvarConfiguracoes(dadosHorario.value);
    alert('Horários salvos!');
};

const formatarPreco = (valor) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
</script>

<template>
    <div class="admin-config">
        <header class="page-header">
            <h1>Configurações da loja</h1>
            <p>Identidade visual, taxas, pagamentos, privacidade e horários.</p>
        </header>

        <!-- ABAS -->
        <div class="tabs" role="tablist">
            <button
                v-for="aba in abas"
                :key="aba.id"
                type="button"
                role="tab"
                :aria-selected="abaAtiva === aba.id"
                :class="{ active: abaAtiva === aba.id }"
                @click="selecionarAba(aba.id, $event)"
            >
                <component :is="aba.icon" :size="18" /> {{ aba.label }}
            </button>
        </div>

        <!-- ═════════════ ABA: SEGURANÇA ═════════════ -->
        <div v-if="abaAtiva === 'seguranca'" class="card-aba">
            <p class="sub">Altere a senha de acesso ao painel da loja.</p>

            <div class="input-group">
                <label for="senha-atual">Senha Atual</label>
                <input id="senha-atual" v-model="senhas.atual" type="password" placeholder="Digite a senha atual" />
            </div>
            <div class="input-group">
                <label for="senha-nova">Nova Senha</label>
                <input id="senha-nova" v-model="senhas.nova" type="password" placeholder="Mínimo 6 caracteres" />
            </div>
            <div class="input-group">
                <label for="senha-confirmar">Confirmar Nova Senha</label>
                <input id="senha-confirmar" v-model="senhas.confirmar" type="password" placeholder="Repita a nova senha" />
            </div>

            <button class="btn-salvar" @click="trocarSenha" :disabled="salvandoSenha">
                <Lock :size="18" /> {{ salvandoSenha ? 'Salvando...' : 'Alterar Senha' }}
            </button>
        </div>

        <!-- ═════════════ ABA: LOJA ═════════════ -->
        <div v-if="abaAtiva === 'loja'" class="card-aba">
            <div class="input-group">
                <label for="loja-nome">Nome da loja</label>
                <input id="loja-nome" v-model="dadosLoja.nome" type="text" placeholder="Nome da sua loja" />
            </div>

            <div class="row-uploads">
                <!-- LOGO -->
                <div class="upload-box">
                    <span class="upload-titulo">Logo da loja</span>

                    <label for="upload-logo" class="preview-logo">
                        <img v-if="logoEhImagem(dadosLoja.logo)" :src="dadosLoja.logo" alt="Logo da loja" />
                        <span v-else class="emoji-fallback">{{ dadosLoja.logo || '🍔' }}</span>
                        <span class="overlay-trocar">Trocar</span>
                    </label>

                    <input id="upload-logo" type="file" accept="image/*" class="input-file-escondido" @change="fazerUploadLogo" />

                    <label for="upload-logo" class="btn-escolher">
                        <ImageIcon :size="14" /> Escolher imagem
                    </label>
                    <small>A imagem é reduzida automaticamente.</small>
                </div>

                <!-- CAPAS -->
                <div class="upload-box upload-box-capas">
                    <span class="upload-titulo">Capas da loja (banners)</span>

                    <div class="lista-capas">
                        <div v-for="(capa, index) in dadosLoja.capas" :key="index" class="capa-item">
                            <img :src="capa" :alt="`Capa ${index + 1}`" />
                            <button
                                type="button"
                                class="btn-remover-capa"
                                :aria-label="`Remover capa ${index + 1}`"
                                @click="removerCapa(index)"
                            >
                                <Trash2 :size="14" />
                            </button>
                        </div>

                        <label for="upload-capa" class="add-capa-box">
                            <ImageIcon :size="24" />
                            <span>Adicionar capa</span>
                        </label>
                    </div>

                    <input id="upload-capa" type="file" accept="image/*" multiple class="input-file-escondido" @change="fazerUploadCapas" />

                    <small>Adicione várias imagens: elas viram um carrossel automático.</small>
                </div>
            </div>

            <button type="button" class="btn-salvar" @click="salvarLoja">
                <Save :size="18" /> Salvar perfil
            </button>
        </div>

        <!-- ═════════════ ABA: TAXAS ═════════════ -->
        <div v-if="abaAtiva === 'taxas'" class="card-aba">
            <div class="card-form">
                <input v-model="novoBairro" type="text" placeholder="Nome do bairro" aria-label="Nome do bairro" />
                <input v-model="novaTaxa" type="number" min="0" max="20" step="0.50" placeholder="R$ 0,00" aria-label="Taxa de entrega" />
                <button type="button" class="btn-add" @click="adicionarTaxa">Adicionar</button>
            </div>

            <div class="lista">
                <div v-for="t in taxas" :key="t.bairro" class="item-lista">
                    <span class="item-bairro">{{ t.bairro }}</span>
                    <div class="item-lista-acoes">
                        <span class="taxa" :class="{ gratis: t.taxa === 0 }">
                            {{ t.taxa === 0 ? 'GRÁTIS' : formatarPreco(t.taxa) }}
                        </span>
                        <button type="button" class="btn-remover" :aria-label="`Remover ${t.bairro}`" @click="removerTaxa(t.bairro)">✕</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ═════════════ ABA: PIX ═════════════ -->
        <div v-if="abaAtiva === 'pix'" class="card-aba">
            <p class="sub">Dados usados para gerar o QR Code de pagamento.</p>

            <div class="input-group">
                <label for="pix-cnpj">CNPJ ou CPF</label>
                <input id="pix-cnpj" v-model="cnpj" type="text" placeholder="00.000.000/0000-00" />
            </div>
            <div class="input-group">
                <label for="pix-chave">Chave Pix</label>
                <input id="pix-chave" v-model="dadosBancarios.chavePix" type="text" placeholder="Telefone, email, CPF..." />
            </div>
            <div class="input-group">
                <label for="pix-titular">Nome do titular (sem acentos)</label>
                <input id="pix-titular" v-model="dadosBancarios.nomeBeneficiario" type="text" placeholder="Ex: JOAO DA SILVA" />
            </div>
            <div class="input-group">
                <label for="pix-cidade">Cidade da conta</label>
                <input id="pix-cidade" v-model="dadosBancarios.cidadeBeneficiario" type="text" placeholder="Ex: LONDRINA" />
            </div>

            <button type="button" class="btn-salvar" @click="salvarBancarios">
                <Save :size="18" /> Salvar Pix
            </button>
        </div>

        <!-- ═════════════ ABA: PRIVACIDADE ═════════════ -->
        <div v-if="abaAtiva === 'politica'" class="card-aba">
            <p class="sub">Esses dados aparecem na tela de Política de Privacidade do site.</p>

            <div class="input-group">
                <label for="pol-cnpj">CNPJ da loja</label>
                <input id="pol-cnpj" v-model="cnpj" type="text" placeholder="00.000.000/0000-00" />
            </div>
            <div class="input-group">
                <label for="pol-cidade">Cidade / Estado da sede</label>
                <input id="pol-cidade" v-model="dadosPolitica.cidadeSede" type="text" placeholder="Ex: Apucarana/PR" />
            </div>
            <div class="input-group">
                <label for="pol-email">E-mail de contato (privacidade)</label>
                <input id="pol-email" v-model="dadosPolitica.emailContato" type="email" placeholder="privacidade@sualoja.com" />
            </div>

            <div class="divisor-politica"></div>

            <h4 class="titulo-secao">Encarregado de Proteção de Dados (DPO)</h4>
            <div class="input-group">
                <label for="pol-dpo-nome">Nome do DPO</label>
                <input id="pol-dpo-nome" v-model="dadosPolitica.nomeDPO" type="text" placeholder="Ex: João da Silva" />
            </div>
            <div class="input-group">
                <label for="pol-dpo-email">E-mail do DPO</label>
                <input id="pol-dpo-email" v-model="dadosPolitica.emailDPO" type="email" placeholder="dpo@sualoja.com" />
            </div>

            <button type="button" class="btn-salvar" @click="salvarPolitica">
                <Save :size="18" /> Salvar política
            </button>
        </div>

        <!-- ═════════════ ABA: LOCALIZAÇÃO ═════════════ -->
<div v-if="abaAtiva === 'localizacao'" class="card-aba">
    <p class="sub">
        Arraste o pino vermelho ou clique no mapa para marcar onde fica a loja.
        Essa coordenada é usada para calcular as rotas de entrega.
    </p>

    <div style="width: 100%; height: 320px; border-radius: 12px; overflow: hidden; margin-bottom: 16px; border: 1px solid #e4e4e7;">
        <div id="mapa-loja" style="width: 100%; height: 100%;"></div>
    </div>

    <div style="display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 150px; padding: 12px; background: #fafafa; border-radius: 8px; border: 1px solid #f4f4f5;">
            <span style="font-size: 11px; color: #71717a; font-weight: 600; text-transform: uppercase;">Latitude:</span>
            <div style="font-family: 'Courier New', monospace; font-size: 15px; font-weight: 800; color: #18181b;">
                {{ Number(dadosLocalizacao.lat).toFixed(6) }}
            </div>
        </div>
        <div style="flex: 1; min-width: 150px; padding: 12px; background: #fafafa; border-radius: 8px; border: 1px solid #f4f4f5;">
            <span style="font-size: 11px; color: #71717a; font-weight: 600; text-transform: uppercase;">Longitude:</span>
            <div style="font-family: 'Courier New', monospace; font-size: 15px; font-weight: 800; color: #18181b;">
                {{ Number(dadosLocalizacao.lng).toFixed(6) }}
            </div>
        </div>
    </div>

    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button 
            @click="usarMinhaLocalizacaoLoja" 
            style="flex: 1; min-width: 200px; display: flex; align-items: center; justify-content: center; gap: 8px; background: #fff; color: #dc2626; border: 2px solid #dc2626; padding: 14px; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer;"
        >
            📍 Usar minha localização
        </button>
        <button 
            @click="salvarLocalizacao" 
            style="flex: 1; min-width: 200px; background: #dc2626; color: #fff; border: none; padding: 14px; border-radius: 8px; font-weight: 700; font-size: 15px; cursor: pointer;"
        >
            Salvar Localização
        </button>
    </div>
</div>

        <!-- ═════════════ ABA: HORÁRIOS ═════════════ -->
        <div v-if="abaAtiva === 'horarios'" class="card-aba">
            <div class="status-loja" :class="{ aberto: dadosHorario.aberto }">
                <div>
                    <h3>Status da loja</h3>
                    <p>{{ dadosHorario.aberto ? 'Aceitando pedidos agora' : 'Pausada para pedidos' }}</p>
                </div>
                <label class="switch" aria-label="Loja aberta">
                    <input v-model="dadosHorario.aberto" type="checkbox" />
                    <span class="slider"></span>
                </label>
            </div>

            <div class="row-horarios">
                <div class="input-group">
                    <label for="hor-abre">Horário de abertura</label>
                    <input id="hor-abre" v-model="dadosHorario.horarioAbertura" type="time" />
                </div>
                <div class="input-group">
                    <label for="hor-fecha">Horário de fechamento</label>
                    <input id="hor-fecha" v-model="dadosHorario.horarioFechamento" type="time" />
                </div>
            </div>

            <button type="button" class="btn-salvar" @click="salvarHorarios">
                <Save :size="18" /> Salvar horários
            </button>
        </div>
    </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════ */
/* CONTAINER GERAL                                            */
/* ═══════════════════════════════════════════════════════════ */
.admin-config {
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
    padding: 0 10px;
    box-sizing: border-box;
}

.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 24px; color: #18181b; margin: 0 0 4px 0; }
.page-header p { color: #71717a; margin: 0; font-size: 14px; }

/* ═══════════════════════════════════════════════════════════ */
/* ABAS                                                       */
/* ═══════════════════════════════════════════════════════════ */
.tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    border-bottom: 1px solid #e4e4e7;
    padding-bottom: 8px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
}

.tabs::-webkit-scrollbar { display: none; }

.tabs button {
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #71717a;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: all 0.2s;
}

.tabs button:hover { background: #f4f4f5; }
.tabs button.active { background: #fef2f2; color: #dc2626; }

/* ═══════════════════════════════════════════════════════════ */
/* CARDS DAS ABAS                                             */
/* ═══════════════════════════════════════════════════════════ */
.card-aba {
    background: #fff;
    padding: 24px;
    border-radius: 12px;
    border: 1px solid #e4e4e7;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
    box-sizing: border-box;
}

.sub {
    font-size: 13px;
    color: #71717a;
    margin: -8px 0 20px 0;
}

.divisor-politica {
    height: 1px;
    background: #e4e4e7;
    margin: 24px 0;
}

.card-aba h4 {
    font-size: 14px;
    color: #3f3f46;
    margin: 0 0 16px 0;
    font-weight: 700;
}

/* ═══════════════════════════════════════════════════════════ */
/* INPUTS                                                     */
/* ═══════════════════════════════════════════════════════════ */
.input-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
    width: 100%;
}

.input-group label {
    font-size: 13px;
    font-weight: 600;
    color: #3f3f46;
}

.input-group input,
.input-group select {
    padding: 12px;
    border: 1px solid #e4e4e7;
    border-radius: 8px;
    font-size: 15px;
    outline: none;
    width: 100%;
    box-sizing: border-box;
    background: #fafafa;
    font-family: inherit;
}

.input-group input:focus {
    border-color: #dc2626;
    background: #fff;
}

/* ═══════════════════════════════════════════════════════════ */
/* UPLOADS (LOGO E CAPAS)                                     */
/* ═══════════════════════════════════════════════════════════ */
.row-uploads {
    display: flex;
    gap: 24px;
    margin-bottom: 24px;
    flex-wrap: wrap;
    width: 100%;
    box-sizing: border-box;
}

.upload-box {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
}

.upload-box-capas { flex: 1; min-width: 250px; }

.upload-titulo {
    font-size: 13px;
    font-weight: 600;
    color: #3f3f46;
}

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

.preview-logo {
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid #ddd;
    transition: border-color 0.2s;
}

.preview-logo:hover { border-color: #dc2626; }
.preview-logo:hover .overlay-trocar { opacity: 1; }
.preview-logo img { width: 100%; height: 100%; object-fit: cover; }
.emoji-fallback { font-size: 48px; }

.overlay-trocar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    text-align: center;
    padding: 4px 0;
    opacity: 0;
    transition: opacity 0.2s;
}

.btn-escolher {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f4f4f5;
    border: 1px solid #e4e4e7;
    padding: 8px 14px;
    border-radius: 6px;
    font-size: 12px;
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

.upload-box small {
    font-size: 11px;
    color: #a1a1aa;
    line-height: 1.4;
}

/* Lista de Capas */
.lista-capas {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 8px;
}

.capa-item {
    position: relative;
    width: 120px;
    height: 80px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #ddd;
    flex-shrink: 0;
}

.capa-item img { width: 100%; height: 100%; object-fit: cover; }

.btn-remover-capa {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(220, 38, 38, 0.9);
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.btn-remover-capa:hover { background: #dc2626; }

.add-capa-box {
    width: 120px;
    height: 80px;
    border: 2px dashed #d4d4d8;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #a1a1aa;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    transition: all 0.2s;
    flex-shrink: 0;
    text-align: center;
    padding: 4px;
    box-sizing: border-box;
}

.add-capa-box:hover {
    border-color: #dc2626;
    color: #dc2626;
    background: #fef2f2;
}

/* ═══════════════════════════════════════════════════════════ */
/* BOTÕES DE SALVAR                                           */
/* ═══════════════════════════════════════════════════════════ */
.btn-salvar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    background: #dc2626;
    color: #fff;
    border: none;
    padding: 14px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    margin-top: 16px;
    transition: background 0.2s;
    box-sizing: border-box;
}

.btn-salvar:hover { background: #b91c1c; }

/* ═══════════════════════════════════════════════════════════ */
/* FORM DE TAXAS                                              */
/* ═══════════════════════════════════════════════════════════ */
.card-form {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
    width: 100%;
    box-sizing: border-box;
}

.card-form input {
    flex: 1;
    min-width: 140px;
    padding: 12px;
    border: 1px solid #e4e4e7;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
}

.card-form input:focus { border-color: #dc2626; }

.btn-add {
    background: #18181b;
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    flex-shrink: 0;
}

.lista {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.item-lista {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #fafafa;
    border-radius: 8px;
    border: 1px solid #f4f4f5;
    gap: 12px;
}

.item-bairro {
    font-size: 14px;
    color: #3f3f46;
    font-weight: 600;
    word-break: break-word;
}

.item-lista-acoes {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
}

.taxa { font-weight: 800; color: #dc2626; font-size: 14px; }
.taxa.gratis { color: #16a34a; }

.btn-remover {
    background: transparent;
    border: none;
    color: #a1a1aa;
    cursor: pointer;
    font-weight: bold;
    font-size: 16px;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;
}

.btn-remover:hover { background: #fef2f2; color: #dc2626; }

/* ═══════════════════════════════════════════════════════════ */
/* HORÁRIOS                                                   */
/* ═══════════════════════════════════════════════════════════ */
.status-loja {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid #e4e4e7;
    margin-bottom: 24px;
    background: #fafafa;
    gap: 16px;
}

.status-loja.aberto {
    background: #f0fdf4;
    border-color: #bbf7d0;
}

.status-loja h3 { margin: 0 0 4px 0; font-size: 16px; color: #18181b; }
.status-loja p { margin: 0; font-size: 13px; color: #71717a; }

.switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 28px;
    flex-shrink: 0;
}

.switch input { opacity: 0; width: 0; height: 0; }

.slider {
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: #ccc;
    transition: 0.4s;
    border-radius: 28px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
}

input:checked + .slider { background-color: #16a34a; }
input:checked + .slider:before { transform: translateX(22px); }

.row-horarios {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    width: 100%;
    box-sizing: border-box;
}

.row-horarios .input-group { flex: 1; min-width: 140px; }

/* ═══════════════════════════════════════════════════════════ */
/* RESPONSIVIDADE (MOBILE)                                    */
/* ═══════════════════════════════════════════════════════════ */
@media (max-width: 640px) {
     .admin-config { padding: 0 8px; }

    .page-header h1 { font-size: 20px; }
    .page-header p { font-size: 13px; }

    .card-aba { padding: 16px; border-radius: 10px; }

    /* Uploads empilhados */
    .row-uploads {
        flex-direction: column;
        gap: 20px;
    }

    .upload-box {
        width: 100%;
        align-items: flex-start;
    }

    .upload-box-capas { min-width: 0; width: 100%; }

    /* Preview logo centralizado no mobile */
    .preview-logo {
        width: 90px;
        height: 90px;
    }

    /* Capas menores no mobile */
    .capa-item,
    .add-capa-box {
        width: 100px;
        height: 68px;
    }

    .btn-escolher {
        width: 100%;
        justify-content: center;
    }

    /* Form de taxas empilhado */
    .card-form {
        flex-direction: column;
    }

    .card-form input { min-width: 0; }
    .btn-add { width: 100%; padding: 14px; }

    /* Item de taxa */
    .item-lista {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .item-lista-acoes {
        width: 100%;
        justify-content: space-between;
    }

    /* Horários empilhados */
    .row-horarios {
        flex-direction: column;
        gap: 0;
    }

    .row-horarios .input-group { min-width: 100%; }

    /* Status loja */
    .status-loja {
        flex-direction: row;
        padding: 12px;
    }

    .status-loja h3 { font-size: 15px; }
    .status-loja p { font-size: 12px; }
}

/* ═══════════════════════════════════════════════════════════ */
/* TABLET (768px - 1024px)                                    */
/* ═══════════════════════════════════════════════════════════ */
@media (min-width: 641px) and (max-width: 1024px) {
    .admin-config { padding: 0 20px; }
    .capa-item,
    .add-capa-box {
        width: 110px;
        height: 74px;
    }
}
</style>
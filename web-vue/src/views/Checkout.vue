<script setup>
// ═══════════════════════════════════════════════════════════
// 1. IMPORTAÇÕES
// ═══════════════════════════════════════════════════════════
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ArrowLeft, MapPin, User, LocateFixed, Loader2, Search, MapPinOff, MapPinCheck } from 'lucide-vue-next';

import HeaderCliente from '../components/cliente/HeaderCliente.vue';
import { useCarrinho } from '../composables/useCarrinho.js';
import { usePerfil } from '../composables/usePerfil.js';
import { useTaxasEntrega } from '../composables/useTaxasEntrega.js';
import { useLoja } from '../composables/useLoja.js';
import { registrarProtocoloPmtiles, criarStyleProtomaps } from '../pkg/mapProtocol.js';

// ✅ Registra o protocolo (é idempotente, pode chamar várias vezes)
registrarProtocoloPmtiles();

// ═══════════════════════════════════════════════════════════
// 2. COMPOSABLES
// ═══════════════════════════════════════════════════════════
const router = useRouter();
const { itens, valorTotal } = useCarrinho();
const { perfil, enderecoPrincipal } = usePerfil();
const { obterTaxaPorBairro } = useTaxasEntrega();
const { lojaEstaAberta, configLoja } = useLoja();

// ═══════════════════════════════════════════════════════════
// 3. ESTADOS
// ═══════════════════════════════════════════════════════════
const nome = ref('');
const whatsapp = ref('');
const rua = ref('');
const numero = ref('');
const bairro = ref('');
const cidade = ref('');
const complemento = ref('');
const referencia = ref('');
const tipoEndereco = ref('casa');

let map = null;
let marker = null;
const lat = ref(configLoja.value.coordenadas?.lat || -23.5507);
const lng = ref(configLoja.value.coordenadas?.lng || -51.4607);

const buscandoGps = ref(false);
const buscandoEndereco = ref(false);
const modalErroEndereco = ref(false);
const modalConfirmacaoRua = ref(false);

// ✅ NOVO: estado para mostrar se o mapa carregou ou falhou
const mapaCarregado = ref(false);
const mapaErro = ref(false);

// ═══════════════════════════════════════════════════════════
// 4. COMPUTEDS
// ═══════════════════════════════════════════════════════════
const taxaEntregaCalculada = computed(() => {
    if (!bairro.value) return 0;
    return obterTaxaPorBairro(bairro.value);
});

const totalComEntrega = computed(() => valorTotal.value + taxaEntregaCalculada.value);

// ═══════════════════════════════════════════════════════════
// 5. UTILITÁRIOS
// ═══════════════════════════════════════════════════════════
const voltar = () => router.back();

const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

// ═══════════════════════════════════════════════════════════
// 6. AÇÕES
// ═══════════════════════════════════════════════════════════
const buscarEnderecoManual = async () => {
    if (!rua.value || rua.value.trim().length < 3) {
        alert('Por favor, digite pelo menos 3 letras no campo "Rua".');
        return;
    }

    buscandoEndereco.value = true;
    const url = `/api/ruas?busca=${encodeURIComponent(rua.value)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro ${response.status}`);

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            const primeiraRua = data[0];

            if (primeiraRua.nome) rua.value = primeiraRua.nome;
            if (primeiraRua.bairro) bairro.value = primeiraRua.bairro;

            if (primeiraRua.lat && primeiraRua.lon && map) {
                lat.value = primeiraRua.lat;
                lng.value = primeiraRua.lon;
                map.flyTo({ center: [lng.value, lat.value], zoom: 16 });
                marker?.setLngLat([lng.value, lat.value]);
            }

            setTimeout(() => {
                modalConfirmacaoRua.value = true;
            }, 6000);
        } else {
            modalErroEndereco.value = true;
        }
    } catch (error) {
        console.error('❌ Erro na busca de rua:', error.message);
        modalErroEndereco.value = true;
    } finally {
        buscandoEndereco.value = false;
    }
};

const usarMinhaLocalizacao = () => {
    if (!navigator.geolocation) {
        alert('Seu navegador não suporta geolocalização.');
        return;
    }
    buscandoGps.value = true;

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            lat.value = latitude;
            lng.value = longitude;

            if (map) {
                map.flyTo({ center: [longitude, latitude], zoom: 17 });
                marker?.setLngLat([longitude, latitude]);
            }

            buscandoGps.value = false;
        },
        (error) => {
            console.error("Erro no GPS:", error);
            buscandoGps.value = false;
            modalErroEndereco.value = true;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
};

const confirmarRua = () => {
    modalConfirmacaoRua.value = false;
    document.getElementById('input-numero')?.focus();
};

const usarGpsDoModal = () => {
    modalConfirmacaoRua.value = false;
    usarMinhaLocalizacao();
};

// ═══════════════════════════════════════════════════════════
// 7. FINALIZAR PEDIDO
// ═══════════════════════════════════════════════════════════
const finalizarPedido = () => {
    if (!lojaEstaAberta.value) {
        alert('A loja acabou de fechar. Não é possível finalizar o pedido agora.');
        router.push('/');
        return;
    }

    if (!nome.value || !whatsapp.value || !rua.value || !numero.value || !cidade.value) {
        alert('Por favor, preencha Nome, WhatsApp, Rua, Número e Cidade.');
        return;
    }

    const novoPedido = {
        id: Date.now(),
        status: 'aguardando_pagamento',
        cliente: { nome: nome.value, whatsapp: whatsapp.value },
        endereco: {
            tipo: tipoEndereco.value,
            rua: rua.value,
            numero: numero.value,
            bairro: bairro.value,
            cidade: cidade.value,
            complemento: complemento.value,
            referencia: referencia.value,
            coordenadas: { lat: lat.value, lng: lng.value }
        },
         // ✅ NOVO: Snapshot da loja no momento do pedido
        lojaCoordenadas: {
        lat: configLoja.value.coordenadas?.lat || -23.5507,
        lng: configLoja.value.coordenadas?.lng || -51.4607
    },
        itens: itens.value,
        taxaEntrega: taxaEntregaCalculada.value,
        total: valorTotal.value,
        valorFinal: totalComEntrega.value,
        dataCriacao: new Date().toISOString()
};

    localStorage.setItem('@delivery:checkout', JSON.stringify(novoPedido));
    router.push('/pagamento');
};

// ═══════════════════════════════════════════════════════════
// 8. CICLO DE VIDA
// ═══════════════════════════════════════════════════════════
onMounted(() => {
    console.log('🗺️ Inicializando mapa PMTiles...');

    // ✅ Log de diagnóstico
    const style = criarStyleProtomaps('light');
    console.log('📦 Style criado. Sources:', Object.keys(style.sources));
    console.log('📦 Total de layers:', style.layers.length);

    map = new maplibregl.Map({
        container: 'map',
        style: style,
        center: [lng.value, lat.value],
        zoom: 15
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    // ✅ Log quando o estilo estiver pronto
    map.on('styledata', () => {
        console.log('🎨 styledata disparado');
    });

    // ✅ Log quando todos os tiles carregarem (aqui sabemos se funciona)
    map.on('load', () => {
        console.log('✅ Mapa carregado com sucesso!');
        mapaCarregado.value = true;

        // Diagnóstico: verificar se o source existe
        const source = map.getSource('protomaps');
        console.log('🔍 Source "protomaps" existe?', !!source);

        if (!source) {
            console.warn('⚠️ Source "protomaps" NÃO encontrado no mapa!');
            console.warn('Sources disponíveis:', Object.keys(map.getStyle().sources));
        }
    });

    // ✅ Detecta erros de tiles (o mais importante para diagnosticar)
    map.on('error', (e) => {
        console.error('❌ Erro no mapa:', e.error);

        // Se o erro for do PMTiles, avisa
        if (e.error?.message?.includes('pmtiles') || e.error?.message?.includes('tiles')) {
            console.error('🚨 O arquivo PMTiles não está sendo encontrado!');
            console.error('Verifique:');
            console.error('1. O backend Go está rodando em localhost:9090?');
            console.error('2. O arquivo cidades-2026-10.pmtiles existe em backend/tiles/?');
            console.error('3. O proxy /tiles está configurado no vite.config.js?');
            mapaErro.value = true;
        }
    });

    // ✅ Cria o pino
    marker = new maplibregl.Marker({ draggable: true, color: '#dc2626' })
        .setLngLat([lng.value, lat.value])
        .addTo(map);

    marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        lat.value = lngLat.lat;
        lng.value = lngLat.lng;
    });

    map.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        marker.setLngLat([lng, lat]);
        lat.value = lat;
        lng.value = lng;
    });

    // Auto-preenchimento do perfil
    if (perfil.value.nome) nome.value = perfil.value.nome;
    if (perfil.value.whatsapp) whatsapp.value = perfil.value.whatsapp;

    if (enderecoPrincipal.value) {
        rua.value = enderecoPrincipal.value.rua;
        numero.value = enderecoPrincipal.value.numero;
        bairro.value = enderecoPrincipal.value.bairro;
        cidade.value = enderecoPrincipal.value.cidade;
        complemento.value = enderecoPrincipal.value.complemento || '';
    }
});

onBeforeUnmount(() => {
    if (map) map.remove();
});
</script>
<template>
    <div class="checkout-page">
        <HeaderCliente />

        <main class="conteudo">
            <!-- BOTÃO VOLTAR -->
            <div class="topo">
                <button class="btn-voltar" @click="voltar">
                    <ArrowLeft :size="24" />
                </button>
                <h1>Finalizar Pedido</h1>
            </div>

            <!-- SEÇÃO 1: DADOS PESSOAIS -->
            <div class="card-secao">
                <h2><User :size="18" /> Seus Dados</h2>
                <div class="input-group">
                    <label>Nome Completo *</label>
                    <input v-model="nome" type="text" placeholder="Como podemos te chamar?" />
                </div>
                <div class="input-group">
                    <label>WhatsApp *</label>
                    <input v-model="whatsapp" type="tel" placeholder="(00) 00000-0000" />
                </div>
            </div>

            <!-- SEÇÃO 2: ENDEREÇO -->
            <div class="card-secao">
                <h2><MapPin :size="18" /> Endereço de Entrega</h2>

                <button class="btn-gps" @click="usarMinhaLocalizacao" :disabled="buscandoGps || buscandoEndereco">
                    <Loader2 v-if="buscandoGps" class="spin" :size="18" />
                    <LocateFixed v-else :size="18" />
                    {{ buscandoGps ? 'Buscando GPS...' : 'Usar minha localização atual' }}
                </button>

                <div class="row-inputs">
                    <div class="input-group">
                        <label>Rua *</label>
                        <input v-model="rua" type="text" placeholder="Nome da rua" />
                    </div>
                    <div class="input-group grupo-numero">
                        <label>Número *</label>
                        <input id="input-numero" v-model="numero" type="text" placeholder="Ex: 123" />
                    </div>
                </div>

                <div class="row-inputs">
                    <div class="input-group">
                        <label>Cidade *</label>
                        <input v-model="cidade" type="text" placeholder="Sua cidade" />
                    </div>
                    <div class="input-group">
                        <label>Bairro *</label>
                        <input v-model="bairro" type="text" placeholder="Seu bairro" />
                    </div>
                </div>

                <div class="input-group">
                    <label>Complemento (Opcional)</label>
                    <input v-model="complemento" type="text" placeholder="Apto, bloco, etc." />
                </div>

                <div class="input-group">
                    <label>Onde devemos entregar? *</label>
                    <select v-model="tipoEndereco" class="input-select">
                        <option value="casa">🏠 Minha Casa</option>
                        <option value="trabalho">💼 Meu Trabalho</option>
                        <option value="outro">📍 Outro Local</option>
                    </select>
                </div>

                <button class="btn-buscar-endereco" @click="buscarEnderecoManual" :disabled="buscandoEndereco || buscandoGps">
                    <Loader2 v-if="buscandoEndereco" class="spin" :size="18" />
                    <Search v-else :size="18" />
                    {{ buscandoEndereco ? 'Buscando rua...' : 'Buscar rua pela localização do pino' }}
                </button>
            </div>

            <!-- SEÇÃO 3: MAPA -->
            <div class="card-secao">
                <h2><MapPin :size="18" /> Confirme no Mapa</h2>
                <p class="sub">Arraste o pino vermelho até a porta da sua casa ou clique em "usar minha localização atual".</p>

                <!-- ✅ Overlay de carregamento do mapa -->
                <div v-if="!mapaCarregado && !mapaErro" class="mapa-loading">
                    <Loader2 :size="28" class="spin" color="#dc2626" />
                    <span>Carregando mapa...</span>
                </div>

                <!-- ✅ Alerta se o mapa falhar -->
                <div v-if="mapaErro" class="alerta-mapa">
                    ⚠️ Não foi possível carregar o mapa. Verifique sua conexão com o servidor.
                </div>

                <div id="map" class="map-container"></div>
            </div>

            <!-- SEÇÃO 4: RESUMO E FINALIZAR -->
            <div class="card-secao resumo">
                <div class="linha">
                    <span>Subtotal:</span>
                    <span>{{ formatarPreco(valorTotal) }}</span>
                </div>
                <div class="linha">
                    <span>Taxa de Entrega:</span>
                    <span v-if="taxaEntregaCalculada === 0" style="color: #16a34a; font-weight: bold;">GRÁTIS</span>
                    <span v-else>{{ formatarPreco(taxaEntregaCalculada) }}</span>
                </div>
                <div class="linha total">
                    <span>Total a pagar:</span>
                    <strong>{{ formatarPreco(totalComEntrega) }}</strong>
                </div>
                <button class="btn-finalizar" @click="finalizarPedido">
                    Ir para Pagamento
                </button>
            </div>
        </main>

        <!-- MODAL 1: ERRO AO BUSCAR ENDEREÇO -->
        <Teleport to="body">
            <div v-if="modalErroEndereco" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-icon">
                        <MapPinOff :size="32" color="#dc2626" />
                    </div>
                    <h3>Não achamos sua rua exata 😕</h3>
                    <p>O sistema tentou buscar, mas não encontrou um endereço exato. Para o entregador não se perder:</p>
                    <ul class="modal-list">
                        <li><b>Ligue o GPS</b> do celular e clique em <b>"Usar minha localização atual"</b>.</li>
                        <li>Se preferir, <b>arraste o pino vermelho</b> no mapa até a porta da sua casa.</li>
                    </ul>
                    <p class="modal-aviso">Assim que ajustar, clique em <b>"Buscar rua"</b> novamente.</p>
                    <div class="modal-acoes">
                        <button class="btn-modal-fechar" @click="modalErroEndereco = false">Entendi, vou ajustar</button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- MODAL 2: CONFIRMAÇÃO DA RUA -->
        <Teleport to="body">
            <div v-if="modalConfirmacaoRua" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-icon icon-sucesso">
                        <MapPinCheck :size="32" color="#16a34a" />
                    </div>
                    <h3>Encontramos seu endereço! 📍</h3>
                    <p>Preenchemos a rua como <strong>{{ rua }}</strong> e o bairro como <strong>{{ bairro }}</strong>.</p>
                    <p class="modal-aviso-verde">Para garantir que o entregador chegue na porta exata, recomendamos usar a localização do celular.</p>
                    <div class="modal-acoes-duplas">
                        <button class="btn-modal-gps" @click="usarGpsDoModal">
                            <LocateFixed :size="16" /> Usar GPS exato
                        </button>
                        <button class="btn-modal-confirmar" @click="confirmarRua">Sim, está certo</button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>
<style scoped>
/* ═══════════════════════════════════════════════════════════ */
/* 1. LAYOUT GERAL DA PÁGINA                                  */
/* ═══════════════════════════════════════════════════════════ */
.checkout-page { min-height: 100vh; background: #ffffff; display: flex; flex-direction: column; padding-bottom: 40px; }
.conteudo { flex: 1; padding: 16px; max-width: 600px; margin: 0 auto; width: 100%; }

/* ═══════════════════════════════════════════════════════════ */
/* 2. TOPO (Botão Voltar + Título)                            */
/* ═══════════════════════════════════════════════════════════ */
.topo { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
.topo h1 { font-size: 22px; margin: 0; color: #1a1a1a; }
.btn-voltar { background: #fff; border: 1px solid #eee; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }

/* ═══════════════════════════════════════════════════════════ */
/* 3. CARDS DE SEÇÃO                                          */
/* ═══════════════════════════════════════════════════════════ */
.card-secao { background: #fff; padding: 16px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin-bottom: 16px; }
.card-secao h2 { font-size: 16px; margin: 0 0 16px 0; color: #1a1a1a; display: flex; align-items: center; gap: 8px; }
.sub { font-size: 13px; color: #777; margin: -8px 0 12px 0; }

/* ═══════════════════════════════════════════════════════════ */
/* 4. INPUTS E FORMULÁRIO                                     */
/* ═══════════════════════════════════════════════════════════ */
.input-group { margin-bottom: 12px; display: flex; flex-direction: column; }
.input-group label { font-size: 12px; font-weight: 600; color: #555; margin-bottom: 4px; }
.input-group input, .input-select { padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; background: #fafafa; outline: none; width: 100%; box-sizing: border-box; font-family: inherit; transition: border-color 0.2s, background 0.2s; }
.input-group input:focus, .input-select:focus { border-color: #dc2626; background: #fff; }

.input-select { appearance: none; background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23333%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E"); background-repeat: no-repeat, repeat; background-position: right 0.7em top 50%, 0 0; background-size: 0.65em auto, 100%; cursor: pointer; }

.row-inputs { display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
.row-inputs .input-group { margin-bottom: 0; flex: 1; min-width: 110px; }
.grupo-numero { flex: 0 1 100px; min-width: 90px; }

/* ═══════════════════════════════════════════════════════════ */
/* 5. BOTÕES (GPS, Buscar, Finalizar)                         */
/* ═══════════════════════════════════════════════════════════ */
.btn-gps { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; background: #ffffff; color: #dc2626; border: 1px dashed #fecaca; padding: 12px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; margin-bottom: 16px; transition: all 0.2s; }
.btn-gps:hover:not(:disabled) { background: #ffffff; }
.btn-gps:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-buscar-endereco { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; background: #fff; color: #dc2626; border: 2px solid #dc2626; padding: 12px; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; margin-top: 4px; transition: all 0.2s; }
.btn-buscar-endereco:hover:not(:disabled) { background: #dc2626; color: #fff; }
.btn-buscar-endereco:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-finalizar { width: 100%; background: #dc2626; color: #fff; border: none; padding: 16px; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
.btn-finalizar:hover { background: #b91c1c; }

/* ═══════════════════════════════════════════════════════════ */
/* 6. MAPA                                                    */
/* ═══════════════════════════════════════════════════════════ */
.map-container { width: 100%; height: 250px; border-radius: 12px; overflow: hidden; z-index: 1; }

.mapa-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    height: 250px;
    background: #f5f5f5;
    border-radius: 12px;
    color: #71717a;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
}

.alerta-mapa {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 12px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 12px;
    font-weight: 600;
    text-align: center;
}

/* ═══════════════════════════════════════════════════════════ */
/* 7. RESUMO                                                  */
/* ═══════════════════════════════════════════════════════════ */
.resumo { background: #fff; }
.linha { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-size: 16px; color: #555; }
.linha strong { font-size: 22px; color: #dc2626; }

/* ═══════════════════════════════════════════════════════════ */
/* 8. MODAIS (Base compartilhada)                             */
/* ═══════════════════════════════════════════════════════════ */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px; backdrop-filter: blur(2px); }
.modal-content { background: #fff; border-radius: 20px; padding: 24px; width: 100%; max-width: 400px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: slideUp 0.3s ease-out; }
.modal-icon { width: 64px; height: 64px; background: #fef2f2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; border: 2px dashed #fecaca; }
.modal-content h3 { font-size: 18px; color: #1a1a1a; margin: 0 0 8px 0; }
.modal-content p { font-size: 14px; color: #555; margin: 0 0 16px 0; line-height: 1.4; }

/* Lista do modal de erro */
.modal-list { text-align: left; background: #f5f5f5; padding: 16px 16px 16px 32px; border-radius: 12px; margin: 0 0 16px 0; font-size: 13px; color: #333; line-height: 1.5; }
.modal-list li { margin-bottom: 8px; }
.modal-list li:last-child { margin-bottom: 0; }
.modal-aviso { font-size: 13px; color: #dc2626; font-weight: 600; margin-bottom: 24px !important; }
.btn-modal-fechar { width: 100%; background: #dc2626; color: #fff; border: none; padding: 14px; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; }

/* ═══════════════════════════════════════════════════════════ */
/* 9. MODAL DE CONFIRMAÇÃO DE RUA (Verde)                     */
/* ═══════════════════════════════════════════════════════════ */
.icon-sucesso { background: #dcfce7; border-color: #16a34a; }
.modal-aviso-verde { font-size: 13px; color: #16a34a; font-weight: 600; background: #f0fdf4; padding: 12px; border-radius: 8px; margin-bottom: 24px !important; }
.modal-acoes-duplas { display: flex; flex-direction: column; gap: 12px; }
.btn-modal-gps { background: #fff; color: #dc2626; border: 2px solid #dc2626; padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
.btn-modal-gps:hover { background: #fef2f2; }
.btn-modal-confirmar { background: #16a34a; color: #fff; border: none; padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
.btn-modal-confirmar:hover { background: #15803d; }

/* ═══════════════════════════════════════════════════════════ */
/* 10. ANIMAÇÕES                                              */
/* ═══════════════════════════════════════════════════════════ */
.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
@keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

/* ═══════════════════════════════════════════════════════════ */
/* 11. RESPONSIVIDADE (Mobile)                                */
/* ═══════════════════════════════════════════════════════════ */
@media (max-width: 380px) {
    .row-inputs { flex-direction: column; }
    .row-inputs .input-group, .grupo-numero { flex: 1; min-width: 100%; }
}
</style>
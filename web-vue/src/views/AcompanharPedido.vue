<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ArrowLeft, ChefHat, Bike, CheckCircle2, Receipt, Clock, MessageCircle, PartyPopper } from 'lucide-vue-next';
import HeaderCliente from '../components/cliente/HeaderCliente.vue';
import { useEntregadores } from '../composables/useEntregadores.js';
import { registrarProtocoloPmtiles, criarStyleProtomaps } from '../pkg/mapProtocol.js';
import { useLoja } from '../composables/useLoja.js';

registrarProtocoloPmtiles();

const route = useRoute();
const router = useRouter();
const { entregadores } = useEntregadores();
const { configLoja } = useLoja();

const pedido = ref(null);
const carregando = ref(true);
let pollingInterval = null;
let statusAnterior = null; // ✅ Detecta mudança de status

// ─── MAPA ───
let map = null;
let markerEntregador = null;
let markerDestino = null;
let animationFrameId = null;

// ✅ Usa coordenadas salvas no pedido (histórico) ou da loja atual (novo)
const coordsLoja = computed(() => {
    if (pedido.value?.lojaCoordenadas) {
        return [
            pedido.value.lojaCoordenadas.lng,
            pedido.value.lojaCoordenadas.lat
        ];
    }
    return [
        configLoja.value.coordenadas?.lng || -51.4607,
        configLoja.value.coordenadas?.lat || -23.5507
    ];
});

// ─── BUSCA O PEDIDO ───
const buscarPedido = () => {
    const pedidosSalvos = JSON.parse(localStorage.getItem('@delivery:pedidos')) || [];
    const pedidoEncontrado = pedidosSalvos.find(p => p.id == route.params.id);
    
    if (pedidoEncontrado) {
        // ✅ Detecta mudança para "Entregue"
        if (statusAnterior !== 'Entregue' && pedidoEncontrado.status === 'Entregue') {
            aoEntregar();
        }
        
        statusAnterior = pedidoEncontrado.status;
        pedido.value = pedidoEncontrado;
    }
    carregando.value = false;
};

// ✅ Quando a entrega é concluída
const aoEntregar = () => {
    console.log('✅ Pedido entregue — removendo moto do mapa');
    
    // Remove o marcador do entregador
    if (markerEntregador) {
        markerEntregador.remove();
        markerEntregador = null;
    }
    
    // Para o polling (não precisa mais atualizar)
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
    
    // Centraliza no destino
    if (map && pedido.value?.endereco?.coordenadas) {
        map.flyTo({
            center: [pedido.value.endereco.coordenadas.lng, pedido.value.endereco.coordenadas.lat],
            zoom: 16
        });
    }
};

onMounted(async () => {
    buscarPedido();
    
    await nextTick();
    
    if (pedido.value) {
        inicializarMapa();
    }
    
    // ✅ Polling só se ainda não foi entregue
    if (pedido.value?.status !== 'Entregue') {
        pollingInterval = setInterval(() => {
            buscarPedido();
            
            // Se o entregador foi atribuído depois, adiciona o marcador
            if (pedido.value && !markerEntregador && map?.loaded() && pedido.value.status !== 'Entregue') {
                adicionarMarcadorEntregador();
            }
        }, 3000);
    }
});

onUnmounted(() => {
    if (pollingInterval) clearInterval(pollingInterval);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (map) map.remove();
});

// ─── INICIALIZA O MAPA ───
const inicializarMapa = () => {
    if (!pedido.value) return;

    let coordsCliente = [-51.1550, -23.3200];
    if (pedido.value.endereco?.coordenadas?.lng && pedido.value.endereco?.coordenadas?.lat) {
        coordsCliente = [pedido.value.endereco.coordenadas.lng, pedido.value.endereco.coordenadas.lat];
    }

    map = new maplibregl.Map({
        container: 'mapa-acompanhamento',
        style: criarStyleProtomaps('light'),
        center: coordsCliente,
        zoom: 14,
        attributionControl: false
    });

    map.on('load', () => {
        // Pino da Loja
        new maplibregl.Marker({ color: '#f97316' })
            .setLngLat(coordsLoja.value) 
            .setPopup(new maplibregl.Popup().setHTML("<b style='color:#333'>Hamburgueria</b>"))
            .addTo(map);

        // ✅ Pino da Casa do Cliente (variável para trocar o ícone no final)
        markerDestino = new maplibregl.Marker({ color: '#dc2626' })
            .setLngLat(coordsCliente)
            .setPopup(new maplibregl.Popup().setHTML("<b style='color:#333'>Sua Casa</b>"))
            .addTo(map);

        // Adiciona o entregador se existir
        if (pedido.value.status !== 'Entregue') {
            adicionarMarcadorEntregador();
        }
    });
};

// ─── MARCADOR DO ENTREGADOR ───
const adicionarMarcadorEntregador = () => {
    if (!pedido.value || !pedido.value.entregadorId) return;
    if (!pedido.value.coordenadasEntregador) return;
    if (!map || !map.loaded()) return;
    if (markerEntregador) return;

    const entregador = entregadores.value.find(e => e.id === pedido.value.entregadorId);
    
    const el = document.createElement('div');
        el.innerHTML = `
    <div class="entregador-pulse"></div>
    <div class="entregador-icone">
        <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
            <path d="M19 7c0-1.1-.9-2-2-2h-3v2h3v2.65L13.52 14H10V9H6c-2.21 0-4 1.79-4 4v3h2c0 1.66 1.34 3 3 3s3-1.34 3-3h4.48L19 10.35V7zM7 17c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
            <path d="M19 13c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
        </svg>
    </div>
`;

    const popupHTML = `
        <div style="font-family: -apple-system, sans-serif; min-width: 180px; padding: 4px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                ${pedido.value.entregadorFoto 
                    ? `<img src="${pedido.value.entregadorFoto}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #16a34a;" />`
                    : `<div style="width: 36px; height: 36px; border-radius: 50%; background: #16a34a; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 18px;">🛵</div>`
                }
                <div>
                    <div style="font-weight: 800; font-size: 14px; color: #18181b;">${pedido.value.entregadorNome || 'Seu entregador'}</div>
                    <div style="font-size: 11px; color: #16a34a; font-weight: 700;">● A caminho</div>
                </div>
            </div>
            <div style="font-size: 12px; color: #3f3f46; line-height: 1.6;">
                <div><strong>Placa:</strong> ${pedido.value.entregadorPlaca || 'N/A'}</div>
                ${entregador?.modelo ? `<div><strong>Veículo:</strong> ${entregador.modelo}${entregador.ano ? ` (${entregador.ano})` : ''}</div>` : ''}
            </div>
        </div>
    `;

    markerEntregador = new maplibregl.Marker({ element: el })
        .setLngLat([pedido.value.coordenadasEntregador.lng, pedido.value.coordenadasEntregador.lat])
        .setPopup(new maplibregl.Popup({ offset: 25, maxWidth: '260px' }).setHTML(popupHTML))
        .addTo(map);
};

// ─── UTILITÁRIOS ───
const voltar = () => router.back();
const formatarPreco = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

// ─── TIMELINE ───
const etapas = [
    { id: 'aguardando_pagamento', titulo: 'Pedido Recebido', desc: 'Aguardando confirmação', icone: Receipt },
    { id: 'Em preparo', titulo: 'Em Preparo', desc: 'A cozinha está cuidando do seu lanche', icone: ChefHat },
    { id: 'Saiu para entrega', titulo: 'Saiu para Entrega', desc: 'O entregador está a caminho', icone: Bike },
    { id: 'Entregue', titulo: 'Entregue', desc: 'Bom apetite!', icone: CheckCircle2 }
];

const etapaAtualIndex = computed(() => {
    if (!pedido.value) return 0;
    if (pedido.value.status === 'aguardando_pagamento') return 0;
    if (pedido.value.status === 'Em preparo') return 1;
    if (pedido.value.status === 'Saiu para entrega') return 2;
    if (pedido.value.status === 'Entregue') return 3;
    return 0;
});

const statusConcluido = (index) => index <= etapaAtualIndex.value;
const statusAtual = (index) => index === etapaAtualIndex.value;

const dadosEntregador = computed(() => {
    if (!pedido.value?.entregadorId) return null;
    return entregadores.value.find(e => e.id === pedido.value.entregadorId) || null;
});

// ✅ Estado "entregue" para controlar UI
const entregue = computed(() => pedido.value?.status === 'Entregue');
</script>
<template>
    <div class="acompanhar-page">
        <HeaderCliente />

        <main class="conteudo" v-if="pedido">
            <!-- Topo -->
            <div class="topo">
                <button class="btn-voltar" @click="voltar"><ArrowLeft :size="24" /></button>
                <div class="titulo-topo">
                    <h1>{{ entregue ? 'Pedido Entregue' : 'Acompanhar Pedido' }}</h1>
                    <span>#{{ String(pedido.id).slice(-4) }}</span>
                </div>
            </div>

            <!-- ✅ BANNER DE SUCESSO (aparece quando entregue) -->
            <div v-if="entregue" class="banner-sucesso">
                <div class="banner-icone"><PartyPopper :size="40" color="#16a34a" /></div>
                <h2>Pedido Entregue!</h2>
                <p>Obrigado por pedir com a gente. Bom apetite! 🍔</p>
                <button class="btn-novo-pedido" @click="router.push('/')">
                    Fazer novo pedido
                </button>
            </div>

            <!-- MAPA (escondido quando entregue) -->
            <div v-if="!entregue" class="card-mapa">
                <div id="mapa-acompanhamento" class="mapa-container"></div>
            </div>

            <!-- CARD DO ENTREGADOR (só se estiver em rota) -->
            <div v-if="pedido.entregadorId && !entregue" class="card-entregador-cliente">
                <img 
                    v-if="pedido.entregadorFoto" 
                    :src="pedido.entregadorFoto" 
                    class="avatar-entregador" 
                />
                <div v-else class="avatar-entregador-vazio">🛵</div>
                <div class="info-entregador">
                    <span class="label">Seu entregador</span>
                    <strong>{{ pedido.entregadorNome }}</strong>
                    <span class="detalhes-entregador">
                        {{ pedido.entregadorPlaca }}
                        <span v-if="dadosEntregador?.modelo">
                            · {{ dadosEntregador.modelo }}
                            <span v-if="dadosEntregador.ano">({{ dadosEntregador.ano }})</span>
                        </span>
                    </span>
                </div>
            </div>

            <!-- PIN (só se estiver em rota) -->
            <div v-if="pedido.status === 'Saiu para entrega' && pedido.pinEntrega" class="card-pin">
                <div class="pin-icon">🔐</div>
                <div class="pin-content">
                    <span class="pin-label">Código de Segurança</span>
                    <div class="pin-digits">
                        <span v-for="(digito, i) in pedido.pinEntrega.split('')" :key="i" class="digito">
                            {{ digito }}
                        </span>
                    </div>
                    <p class="pin-instrucao">
                        Passe este código ao entregador quando ele chegar. 
                        <strong>Não compartilhe antes.</strong>
                    </p>
                </div>
            </div>

            <!-- Previsão (escondida quando entregue) -->
            <div v-if="!entregue" class="card-previsao">
                <div class="icone-relogio">
                    <Clock :size="24" color="#dc2626" />
                </div>
                <div class="texto-previsao">
                    <h2>Previsão de entrega</h2>
                    <p>Hoje, <strong>{{ pedido.tempoEstimado || '30 - 45' }} min</strong></p>
                </div>
            </div>

            <!-- Timeline (sempre visível) -->
            <div class="card-timeline">
                <h2>Status do Pedido</h2>
                <div class="timeline">
                    <div 
                        v-for="(etapa, index) in etapas" 
                        :key="etapa.id" 
                        class="timeline-item"
                        :class="{ 'concluido': statusConcluido(index), 'atual': statusAtual(index) }"
                    >
                        <div class="linha" v-if="index < etapas.length - 1"></div>
                        <div class="icone-wrapper">
                            <component :is="etapa.icone" :size="18" />
                        </div>
                        <div class="textos">
                            <h3>{{ etapa.titulo }}</h3>
                            <p>{{ etapa.desc }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Resumo (sempre visível) -->
            <div class="card-resumo">
                <h2>Resumo do Pedido</h2>
                <div class="lista-itens">
                    <div v-for="item in pedido.itens" :key="item.id" class="item-resumo">
                        <span class="qtd">{{ item.quantidade }}x</span>
                        <span class="nome">{{ item.nome }}</span>
                        <span class="preco">{{ formatarPreco(item.precoTotal) }}</span>
                    </div>
                </div>
                <div class="divisor"></div>
                <div class="endereco-entrega">
                    <strong>Entrega em:</strong>
                    <p>{{ pedido.endereco.rua }}, {{ pedido.endereco.numero }} - {{ pedido.endereco.bairro }}</p>
                </div>
                <div class="linha-total">
                    <span>Total:</span>
                    <strong>{{ formatarPreco(pedido.valorFinal || pedido.total) }}</strong>
                </div>
            </div>

            <!-- Suporte (só se não entregue) -->
            <RouterLink v-if="!entregue" to="/chat" class="btn-suporte">
                <MessageCircle :size="20" />
                Falar com a loja
            </RouterLink>
        </main>

        <div v-else-if="!carregando" class="erro-pedido">
            <h2>Pedido não encontrado 😕</h2>
            <button @click="router.push('/pedidos')">Voltar para Pedidos</button>
        </div>
    </div>
</template>
<style scoped>
.acompanhar-page { min-height: 100vh; background: #ffffff; padding-bottom: 40px; }
.conteudo { padding: 16px; max-width: 600px; margin: 0 auto; }

.topo { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
.btn-voltar { background: #fff; border: 1px solid #eee; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
.titulo-topo { display: flex; flex-direction: column; }
.titulo-topo h1 { font-size: 20px; margin: 0; color: #1a1a1a; }
.titulo-topo span { font-size: 13px; color: #777; font-weight: 600; }

.card-mapa { margin-bottom: 24px; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 2px solid #fff; }
.mapa-container { width: 100%; height: 280px; z-index: 1; }

/* ✅ CARD DO ENTREGADOR */
.card-entregador-cliente {
    display: flex;
    align-items: center;
    gap: 12px;
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border: 1px solid #bbf7d0;
    border-radius: 16px;
    padding: 14px;
    margin-bottom: 20px;
}

.avatar-entregador {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    flex-shrink: 0;
}

.avatar-entregador-vazio {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: #16a34a;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
}

.info-entregador { display: flex; flex-direction: column; gap: 2px; }
.label { font-size: 11px; color: #16a34a; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.info-entregador strong { font-size: 16px; color: #18181b; }
.detalhes-entregador { font-size: 13px; color: #71717a; font-weight: 600; }

/* Card de Previsão */
.card-previsao { display: flex; align-items: center; gap: 16px; background: #fef2f2; border: 1px solid #fffdfd; padding: 16px; border-radius: 16px; margin-bottom: 24px; }
.icone-relogio { width: 48px; height: 48px; background: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.1); }
.texto-previsao h2 { font-size: 14px; margin: 0 0 4px 0; color: #dc2626; }
.texto-previsao p { font-size: 16px; margin: 0; color: #1a1a1a; }
.texto-previsao strong { font-size: 20px; }

/* Timeline */
.card-timeline { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin-bottom: 24px; }
.card-timeline h2 { font-size: 18px; margin: 0 0 20px 0; color: #1a1a1a; }
.timeline { display: flex; flex-direction: column; }
.timeline-item { display: flex; gap: 16px; position: relative; padding-bottom: 32px; }
.timeline-item:last-child { padding-bottom: 0; }
.linha { position: absolute; left: 19px; top: 40px; bottom: 0; width: 2px; background: #eee; z-index: 1; }
.timeline-item.concluido .linha { background: #16a34a; }
.icone-wrapper { width: 40px; height: 40px; border-radius: 50%; background: #f5f5f5; color: #aaa; display: flex; align-items: center; justify-content: center; z-index: 2; border: 2px solid #fff; transition: all 0.3s; }
.timeline-item.concluido .icone-wrapper { background: #dcfce7; color: #16a34a; }
.timeline-item.atual .icone-wrapper { background: #dc2626; color: #fff; box-shadow: 0 0 0 4px #ffffff; animation: pulse 2s infinite; }
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); } 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); } }
.textos { flex: 1; padding-top: 8px; }
.textos h3 { font-size: 15px; margin: 0 0 4px 0; color: #999; font-weight: 600; transition: color 0.3s; }
.textos p { font-size: 13px; margin: 0; color: #bbb; }
.timeline-item.concluido .textos h3 { color: #1a1a1a; }
.timeline-item.concluido .textos p { color: #666; }
.timeline-item.atual .textos h3 { color: #dc2626; font-weight: 800; }

/* Resumo */
.card-resumo { background: #fff; border-radius: 16px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin-bottom: 24px; }
.card-resumo h2 { font-size: 16px; margin: 0 0 16px 0; color: #1a1a1a; }
.lista-itens { display: flex; flex-direction: column; gap: 8px; }
.item-resumo { display: flex; align-items: center; font-size: 14px; color: #333; }
.item-resumo .qtd { color: #dc2626; font-weight: 700; width: 30px; }
.item-resumo .nome { flex: 1; }
.item-resumo .preco { font-weight: 600; }
.divisor { height: 1px; background: #eee; margin: 16px 0; }
.endereco-entrega { font-size: 13px; color: #555; margin-bottom: 16px; }
.endereco-entrega strong { color: #1a1a1a; display: block; margin-bottom: 4px; }
.endereco-entrega p { margin: 0; }
.linha-total { display: flex; justify-content: space-between; align-items: center; font-size: 16px; color: #1a1a1a; font-weight: 700; }
.linha-total strong { font-size: 20px; color: #dc2626; }

.btn-suporte { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; background: #fff; color: #1a1a1a; border: 1px solid #ddd; padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 600; text-decoration: none; transition: background 0.2s; }
.btn-suporte:hover { background: #f5f5f5; }

.erro-pedido { text-align: center; padding: 40px 16px; }
.erro-pedido h2 { color: #1a1a1a; }
.erro-pedido button { background: #dc2626; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; margin-top: 16px; }

/* ✅ Marcador e popup do MapLibre */
:deep(.marcador-entregador-cliente) {
    position: relative;
    width: 40px;
    height: 40px;
    cursor: pointer;
}

:deep(.entregador-icone) {
    position: relative;
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #16a34a, #22c55e);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid #fff;
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);
    z-index: 2;
}

:deep(.entregador-pulse) {
    position: absolute;
    inset: 0;
    background: #16a34a;
    border-radius: 50%;
    opacity: 0.4;
    animation: pulse-entregador 2s infinite;
    z-index: 1;
}

@keyframes pulse-entregador {
    0% { transform: scale(1); opacity: 0.4; }
    70% { transform: scale(1.8); opacity: 0; }
    100% { transform: scale(1.8); opacity: 0; }
}
.card-pin {
    display: flex;
    align-items: center;
    gap: 16px;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 2px solid #fbbf24;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
}

.pin-icon {
    font-size: 32px;
    width: 60px;
    height: 60px;
    background: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.pin-content {
    flex: 1;
}

.pin-label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    color: #92400e;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
}

.pin-digits {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
}

.digito {
    width: 40px;
    height: 48px;
    background: #92400e;
    color: #fff;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 800;
    font-family: 'Courier New', monospace;
    box-shadow: 0 2px 6px rgba(146, 64, 14, 0.3);
}

.pin-instrucao {
    font-size: 12px;
    color: #92400e;
    margin: 0;
    line-height: 1.4;
}


.aviso-seguranca {
    font-size: 11px;
    color: #71717a;
    background: #f4f4f5;
    padding: 8px 12px;
    border-radius: 6px;
    margin-top: 8px;
    line-height: 1.4;
}

/* ✅ BANNER DE SUCESSO */
.banner-sucesso {
    background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    border: 2px solid #16a34a;
    border-radius: 20px;
    padding: 32px 24px;
    text-align: center;
    margin-bottom: 24px;
    animation: pulseSuccess 2s ease-in-out;
}

@keyframes pulseSuccess {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
}

.banner-icone {
    width: 72px;
    height: 72px;
    background: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px auto;
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
}

.banner-sucesso h2 {
    font-size: 24px;
    color: #15803d;
    margin: 0 0 8px 0;
    font-weight: 800;
}

.banner-sucesso p {
    font-size: 15px;
    color: #166534;
    margin: 0 0 20px 0;
}

.btn-novo-pedido {
    background: #16a34a;
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    transition: background 0.2s;
}

.btn-novo-pedido:hover {
    background: #15803d;
}
</style>
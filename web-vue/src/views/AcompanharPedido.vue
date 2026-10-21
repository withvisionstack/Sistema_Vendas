<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import {
    ArrowLeft,
    ChefHat,
    Bike,
    CheckCircle2,
    Receipt,
    Clock,
    MessageCircle
} from 'lucide-vue-next';

import HeaderCliente from '../components/cliente/HeaderCliente.vue';

maplibregl.setWorkerUrl(
    'https://unpkg.com/maplibre-gl@^6.0.0/dist/maplibre-gl-worker.mjs'
);

const route = useRoute();
const router = useRouter();

const pedido = ref(null);
const carregando = ref(true);

let pollingInterval = null;
let animationFrameId = null;

let map = null;
let markerEntregador = null;

let rotaCompleta = [];

// ===============================
// APUCARANA - PR
// ===============================

const coordsLoja = [
    -51.4637,
    -23.5505
];

// ===============================
// UTIL
// ===============================

const voltar = () => router.back();

const formatarPreco = (valor) =>
    new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);

// ===============================
// PEDIDO
// ===============================

const buscarPedido = () => {
    const pedidos =
        JSON.parse(
            localStorage.getItem('@delivery:pedidos')
        ) || [];

    const encontrado = pedidos.find(
        p => p.id == route.params.id
    );

    if (encontrado) {
        pedido.value = encontrado;
    }

    carregando.value = false;
};

// ===============================
// POLYLINE DECODER
// ===============================

const decodePolyline = (
    str,
    precision = 6
) => {
    let index = 0;
    let lat = 0;
    let lng = 0;

    const coordinates = [];
    const factor = Math.pow(10, precision);

    while (index < str.length) {
        let shift = 0;
        let result = 0;
        let byte = null;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const latitudeChange =
            result & 1
                ? ~(result >> 1)
                : result >> 1;

        shift = 0;
        result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const longitudeChange =
            result & 1
                ? ~(result >> 1)
                : result >> 1;

        lat += latitudeChange;
        lng += longitudeChange;

        coordinates.push([
            lng / factor,
            lat / factor
        ]);
    }

    return coordinates;
};

// ===============================
// MAPA
// ===============================

const inicializarMapa = async () => {
    let coordsCliente = [
        -51.4500,
        -23.5500
    ];

    if (
        pedido.value?.endereco?.coordenadas?.lng &&
        pedido.value?.endereco?.coordenadas?.lat
    ) {
        coordsCliente = [
            pedido.value.endereco.coordenadas.lng,
            pedido.value.endereco.coordenadas.lat
        ];
    }

    if (map) {
        map.remove();
    }

    map = new maplibregl.Map({
        container: 'mapa-acompanhamento',

        style:
            'https://tiles.openfreemap.org/styles/bright',

        center: coordsCliente,
        zoom: 14,
        attributionControl: false
    });

    map.on('load', async () => {

        // Loja
        new maplibregl.Marker({
            color: '#f97316'
        })
            .setLngLat(coordsLoja)
            .setPopup(
                new maplibregl.Popup().setHTML(
                    '<b>Hamburgueria</b>'
                )
            )
            .addTo(map);

        // Cliente
        new maplibregl.Marker({
            color: '#dc2626'
        })
            .setLngLat(coordsCliente)
            .setPopup(
                new maplibregl.Popup().setHTML(
                    '<b>Sua Casa</b>'
                )
            )
            .addTo(map);

        await buscarERenderizarRota(
            coordsLoja,
            coordsCliente
        );

        criarMoto();

        if (
            pedido.value?.status ===
            'Saiu para entrega'
        ) {
            animarEntregador();
        }
    });
};

const criarMoto = () => {

    const elemento = document.createElement('div');

    elemento.innerHTML = '🛵';

    elemento.style.width = '42px';
    elemento.style.height = '42px';

    elemento.style.borderRadius = '50%';

    elemento.style.background = '#16a34a';

    elemento.style.display = 'flex';
    elemento.style.alignItems = 'center';
    elemento.style.justifyContent = 'center';

    elemento.style.border =
        '3px solid white';

    elemento.style.boxShadow =
        '0 0 15px rgba(22,163,74,0.6)';

    markerEntregador =
        new maplibregl.Marker({
            element: elemento
        })
            .setLngLat(coordsLoja)
            .addTo(map);
};

// ===============================
// ROTA
// ===============================

const buscarERenderizarRota = async (
    origem,
    destino
) => {

    try {

        const response = await fetch(
            '/api/rota',
            {
                method: 'POST',
                headers: {
                    'Content-Type':
                        'application/json'
                },
                body: JSON.stringify({
                    locations: [
                        {
                            lat: origem[1],
                            lon: origem[0]
                        },
                        {
                            lat: destino[1],
                            lon: destino[0]
                        }
                    ]
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                'Erro ao buscar rota'
            );
        }

        const data =
            await response.json();

        const shape =
            data?.trip?.legs?.[0]?.shape;

        if (shape) {
            rotaCompleta =
                decodePolyline(shape);
        } else {
            rotaCompleta = [
                origem,
                destino
            ];
        }

        desenharRotaNoMapa(
            rotaCompleta
        );

    } catch (erro) {

        console.warn(
            'Fallback rota:',
            erro
        );

        rotaCompleta = [
            origem,
            destino
        ];

        desenharRotaNoMapa(
            rotaCompleta
        );
    }
};

const desenharRotaNoMapa = (
    coordenadas
) => {

    const geojson = {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: coordenadas
        }
    };

    if (map.getSource('rota')) {
        map
            .getSource('rota')
            .setData(geojson);
    } else {

        map.addSource(
            'rota',
            {
                type: 'geojson',
                data: geojson
            }
        );

        map.addLayer({
            id: 'rota-linha',
            type: 'line',
            source: 'rota',
            layout: {
                'line-cap': 'round',
                'line-join': 'round'
            },
            paint: {
                'line-color':
                    '#16a34a',
                'line-width': 7,
                'line-opacity': 0.9,
                'line-blur': 0.5
            }
        });
    }

    const bounds =
        new maplibregl.LngLatBounds();

    coordenadas.forEach(
        coord =>
            bounds.extend(coord)
    );

    map.fitBounds(bounds, {
        padding: 80
    });
};

// ===============================
// ANIMAÇÃO MOTORISTA
// ===============================

const animarEntregador = () => {

    if (
        !rotaCompleta ||
        rotaCompleta.length < 2
    )
        return;

    let index = 0;

    const mover = () => {

        if (
            !markerEntregador ||
            rotaCompleta.length === 0
        ) {
            return;
        }

        markerEntregador.setLngLat(
            rotaCompleta[index]
        );

        index++;

        if (
            index >=
            rotaCompleta.length
        ) {
            index = 0;
        }

        animationFrameId =
            requestAnimationFrame(() => {

                setTimeout(
                    mover,
                    40
                );

            });
    };

    mover();
};

// ===============================
// LIFECYCLE
// ===============================

onMounted(async () => {

    buscarPedido();

    pollingInterval =
        setInterval(
            buscarPedido,
            3000
        );

    await nextTick();

    if (pedido.value) {
        inicializarMapa();
    }
});

onUnmounted(() => {

    if (pollingInterval) {
        clearInterval(
            pollingInterval
        );
    }

    if (animationFrameId) {
        cancelAnimationFrame(
            animationFrameId
        );
    }

    if (map) {
        map.remove();
    }
});

// ===============================
// TIMELINE
// ===============================

const etapas = [
    {
        id: 'aguardando_pagamento',
        titulo: 'Pedido Recebido',
        desc: 'Aguardando confirmação',
        icone: Receipt
    },
    {
        id: 'Em preparo',
        titulo: 'Em Preparo',
        desc:
            'A cozinha está preparando seu pedido',
        icone: ChefHat
    },
    {
        id: 'Saiu para entrega',
        titulo:
            'Saiu para Entrega',
        desc:
            'Seu pedido está chegando',
        icone: Bike
    },
    {
        id: 'Entregue',
        titulo: 'Entregue',
        desc: 'Bom apetite!',
        icone: CheckCircle2
    }
];

const etapaAtualIndex =
    computed(() => {

        if (!pedido.value)
            return 0;

        const status =
            pedido.value.status;

        switch (status) {
            case 'aguardando_pagamento':
                return 0;

            case 'Em preparo':
                return 1;

            case 'Saiu para entrega':
                return 2;

            case 'Entregue':
                return 3;

            default:
                return 0;
        }
    });

const statusConcluido =
    index =>
        index <=
        etapaAtualIndex.value;

const statusAtual =
    index =>
        index ===
        etapaAtualIndex.value;

</script>

<template>
    <div class="acompanhar-page">
        <HeaderCliente />

        <main class="conteudo" v-if="pedido">
            <!-- Topo -->
            <div class="topo">
                <button class="btn-voltar" @click="voltar"><ArrowLeft :size="24" /></button>
                <div class="titulo-topo">
                    <h1>Acompanhar Pedido</h1>
                    <span>#{{ String(pedido.id).slice(-4) }}</span>
                </div>
            </div>

            <!-- MAPA EM TEMPO REAL -->
            <div class="card-mapa">
                <div id="mapa-acompanhamento" class="mapa-container"></div>
            </div>

            <!-- Card de Previsão -->
            <div class="card-previsao">
                            <div class="icone-relogio">
                           <Clock :size="24" color="#dc2626" />
                           </div>
                           <div class="texto-previsao">
                         <h2>Previsão de entrega</h2>
                        <!-- ✅ Agora lê o tempoEstimado. Se não tiver, mostra 30-45 como padrão -->
                     <p>Hoje, <strong>{{ pedido.tempoEstimado || '30 - 45' }} min</strong></p>
                </div>
            </div>

            <!-- Timeline de Status -->
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

            <!-- Resumo do Pedido -->
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

            <!-- Botão de Suporte (Chat) -->
            <RouterLink to="/chat" class="btn-suporte">
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
.acompanhar-page { min-height: 100vh; background: #f5f0e8; padding-bottom: 40px; }
.conteudo { padding: 16px; max-width: 600px; margin: 0 auto; }

.topo { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
.btn-voltar { background: #fff; border: 1px solid #eee; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
.titulo-topo { display: flex; flex-direction: column; }
.titulo-topo h1 { font-size: 20px; margin: 0; color: #1a1a1a; }
.titulo-topo span { font-size: 13px; color: #777; font-weight: 600; }

/* MAPA */
.card-mapa { margin-bottom: 24px; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 2px solid #fff; }
.mapa-container { width: 100%; height: 280px; z-index: 1; }

/* Card de Previsão */
.card-previsao { display: flex; align-items: center; gap: 16px; background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 16px; margin-bottom: 24px; }
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
.timeline-item.atual .icone-wrapper { background: #dc2626; color: #fff; box-shadow: 0 0 0 4px #fee2e2; animation: pulse 2s infinite; }

@keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
    100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
}

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

/* Botão Suporte */
.btn-suporte { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; background: #fff; color: #1a1a1a; border: 1px solid #ddd; padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 600; text-decoration: none; transition: background 0.2s; }
.btn-suporte:hover { background: #f5f5f5; }

.erro-pedido { text-align: center; padding: 40px 16px; }
.erro-pedido h2 { color: #1a1a1a; }
.erro-pedido button { background: #dc2626; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; margin-top: 16px; }
</style>
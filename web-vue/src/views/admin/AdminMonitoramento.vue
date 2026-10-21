<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Bike, Navigation, CheckCircle, MessageCircle } from 'lucide-vue-next';
import SkeletonAdminMonitoramento from './SkeletonAdminMonitoramento.vue';

maplibregl.setWorkerUrl('https://unpkg.com/maplibre-gl@^6.0.0/dist/maplibre-gl-worker.mjs');

const coordsLoja = [-51.1628, -23.3103]; // Centro de Londrina

const carregando = ref(true); // ✅ Estado do skeleton

let map = null;
const entregasAtivas = ref([]);
const marcadores = {};
let simulacaoInterval = null;
let pollingInterval = null;

// ─── BUSCA E SIMULAÇÃO ───
const carregarEntregas = () => {
    const todosPedidos = JSON.parse(localStorage.getItem('@delivery:pedidos')) || [];
    entregasAtivas.value = todosPedidos.filter(p => p.status === 'Saiu para entrega');
    atualizarMarcadoresNoMapa();
};

const simularGps = () => {
    const todosPedidos = JSON.parse(localStorage.getItem('@delivery:pedidos')) || [];
    let mudou = false;

    todosPedidos.forEach(pedido => {
        if (pedido.status === 'Saiu para entrega') {
            if (!pedido.coordenadasEntregador) {
                pedido.coordenadasEntregador = { lng: coordsLoja[0], lat: coordsLoja[1] };
            }

            const destino = pedido.endereco.coordenadas;
            const atual = pedido.coordenadasEntregador;

            const novaLng = atual.lng + (destino.lng - atual.lng) * 0.05;
            const novaLat = atual.lat + (destino.lat - atual.lat) * 0.05;

            pedido.coordenadasEntregador = { lng: novaLng, lat: novaLat };
            mudou = true;
        }
    });

    if (mudou) {
        localStorage.setItem('@delivery:pedidos', JSON.stringify(todosPedidos));
    }
};

// ─── INICIALIZAÇÃO DO MAPA ───
const inicializarMapa = () => {
    if (map) return; // Evita recriar o mapa

    map = new maplibregl.Map({
        container: 'mapa-monitoramento',
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: coordsLoja,
        zoom: 13,
        attributionControl: false
    });

    map.on('load', () => {
        new maplibregl.Marker({ color: '#f97316' })
            .setLngLat(coordsLoja)
            .setPopup(new maplibregl.Popup().setHTML("<b>Hamburgueria</b>"))
            .addTo(map);

        atualizarMarcadoresNoMapa();
    });
};

// ─── CICLO DE VIDA ───
onMounted(async () => {
    // ✅ Simula o carregamento (backend/dados)
    await new Promise(resolve => setTimeout(resolve, 800));

    carregarEntregas();
    carregando.value = false;

    // ✅ Só inicializa o mapa DEPOIS do skeleton sumir
    await nextTick();
    inicializarMapa();

    simulacaoInterval = setInterval(simularGps, 2000);
    pollingInterval = setInterval(carregarEntregas, 2000);
});

onUnmounted(() => {
    if (simulacaoInterval) clearInterval(simulacaoInterval);
    if (pollingInterval) clearInterval(pollingInterval);
    if (map) map.remove();
});

// ─── MARCADORES NO MAPA ───
const atualizarMarcadoresNoMapa = () => {
    if (!map || !map.loaded()) return;

    entregasAtivas.value.forEach(pedido => {
        const coord = pedido.coordenadasEntregador || { lng: coordsLoja[0], lat: coordsLoja[1] };

        if (marcadores[pedido.id]) {
            marcadores[pedido.id].setLngLat([coord.lng, coord.lat]);
        } else {
            const el = document.createElement('div');
            el.className = 'marcador-motoboy';
            el.innerHTML = '🛵';

            marcadores[pedido.id] = new maplibregl.Marker({ element: el })
                .setLngLat([coord.lng, coord.lat])
                .setPopup(new maplibregl.Popup().setHTML(`<b>Pedido #${String(pedido.id).slice(-4)}</b><br>${pedido.cliente.nome}`))
                .addTo(map);
        }
    });

    Object.keys(marcadores).forEach(id => {
        if (!entregasAtivas.value.find(p => p.id == id)) {
            marcadores[id].remove();
            delete marcadores[id];
        }
    });
};

// ─── AÇÕES ───
const centralizarNoMapa = (pedido) => {
    if (marcadores[pedido.id]) {
        const lngLat = marcadores[pedido.id].getLngLat();
        map.flyTo({ center: [lngLat.lng, lngLat.lat], zoom: 16 });
    }
};

const finalizarEntrega = (pedidoId) => {
    const todosPedidos = JSON.parse(localStorage.getItem('@delivery:pedidos')) || [];
    const index = todosPedidos.findIndex(p => p.id === pedidoId);

    if (index !== -1) {
        todosPedidos[index].status = 'Entregue';
        localStorage.setItem('@delivery:pedidos', JSON.stringify(todosPedidos));
        window.dispatchEvent(new Event('pedidos-atualizados'));
        carregarEntregas();
    }
};

const abrirChatEntregador = (pedido) => {
    window.open(`/admin/chat?entregador=${pedido.id}`, '_blank');
};

const formatarPreco = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
</script>

<template>
    <!-- ✅ SKELETON ENQUANTO CARREGA -->
    <SkeletonAdminMonitoramento v-if="carregando" />

    <!-- ✅ CONTEÚDO REAL (SÓ APARECE DEPOIS DO SKELETON) -->
    <div v-else class="monitoramento-layout">
        <!-- MAPA EM TELA CHEIA -->
        <div id="mapa-monitoramento" class="mapa-full"></div>

        <!-- PAINEL LATERAL DE ENTREGAS -->
        <aside class="painel-entregas">
            <div class="header-painel">
                <h2>Entregas em Andamento</h2>
                <span class="badge">{{ entregasAtivas.length }}</span>
            </div>

            <div v-if="entregasAtivas.length === 0" class="vazio">
                <Bike :size="48" color="#ccc" />
                <p>Nenhum entregador na rua agora.</p>
            </div>

            <div v-else class="lista-entregas">
                <div v-for="pedido in entregasAtivas" :key="pedido.id" class="card-entrega">
                    <div class="entrega-header">
                        <strong>#{{ String(pedido.id).slice(-4) }}</strong>
                        <span class="status-entrega">Em rota</span>
                    </div>

                    <!-- ✅ NOVO: Entregador atribuído -->
                    <div v-if="pedido.entregadorId" class="entregador-info">
                        <img v-if="pedido.entregadorFoto" :src="pedido.entregadorFoto" class="entregador-foto" />
                        <div class="entregador-texto">
                            <strong>{{ pedido.entregadorNome }}</strong>
                            <span>{{ pedido.entregadorPlaca }}</span>
                        </div>
                    </div>

                    <div class="entrega-info">
                        <p><strong>Para:</strong> {{ pedido.cliente.nome }}</p>
                        <p>{{ pedido.endereco.rua }}, {{ pedido.endereco.numero }}</p>
                        <p>{{ pedido.endereco.bairro }}</p>
                    </div>

                    <div class="entrega-acoes">
                        <button class="btn-icon" @click="centralizarNoMapa(pedido)" title="Ver no mapa">
                            <Navigation :size="18" /> Ver
                        </button>
                        <button class="btn-icon" @click="abrirChatEntregador(pedido)" title="Falar com entregador">
                            <MessageCircle :size="18" /> Chat
                        </button>
                        <button class="btn-finalizar" @click="finalizarEntrega(pedido.id)">
                            <CheckCircle :size="18" /> Entregue
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    </div>
</template>

<style scoped>
.monitoramento-layout {
    display: flex;
    height: calc(100vh - 64px);
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e4e4e7;
}

.mapa-full {
    flex: 1;
    height: 100%;
    z-index: 1;
}

:deep(.marcador-motoboy) {
    font-size: 24px;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    transition: all 0.5s linear;
    cursor: pointer;
}

.painel-entregas {
    position: absolute;
    top: 16px;
    left: 16px;
    width: 320px;
    max-height: calc(100% - 32px);
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    display: flex;
    flex-direction: column;
    z-index: 10;
    overflow: hidden;
}

.header-painel {
    padding: 16px;
    border-bottom: 1px solid #e4e4e7;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #18181b;
    color: #fff;
}

.entregador-info {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    background: #f0fdf4;
    border-radius: 6px;
    margin-bottom: 8px;
    border: 1px solid #bbf7d0;
}

.entregador-foto {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #fff;
}

.entregador-texto {
    display: flex;
    flex-direction: column;
}

.entregador-texto strong {
    font-size: 13px;
    color: #18181b;
}

.entregador-texto span {
    font-size: 11px;
    color: #16a34a;
    font-weight: 700;
    letter-spacing: 0.5px;
}


.header-painel h2 { font-size: 16px; margin: 0; }
.badge { background: #dc2626; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 800; }

.vazio { padding: 40px 20px; text-align: center; color: #71717a; }
.vazio p { margin-top: 12px; font-size: 14px; }

.lista-entregas { padding: 16px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }

.card-entrega { border: 1px solid #e4e4e7; border-radius: 8px; padding: 12px; background: #fafafa; }

.entrega-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
.entrega-header strong { font-size: 15px; color: #18181b; }
.status-entrega { font-size: 11px; background: #dcfce7; color: #16a34a; padding: 2px 6px; border-radius: 4px; font-weight: 700; }

.entrega-info p { margin: 0 0 4px 0; font-size: 12px; color: #71717a; }
.entrega-info strong { color: #3f3f46; }

.entrega-acoes { display: flex; gap: 8px; margin-top: 12px; }
.btn-icon { display: flex; align-items: center; gap: 4px; background: #fff; border: 1px solid #e4e4e7; padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #3f3f46; cursor: pointer; flex: 1; justify-content: center; }
.btn-icon:hover { background: #f4f4f5; }
.btn-finalizar { display: flex; align-items: center; gap: 4px; background: #dc2626; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; flex: 1; justify-content: center; }
.btn-finalizar:hover { background: #b91c1c; }

@media (max-width: 768px) {
    .monitoramento-layout { flex-direction: column; height: calc(100vh - 120px); }
    .mapa-full { height: 50%; }
    .painel-entregas { position: static; width: 100%; max-height: none; border-radius: 0; box-shadow: none; flex: 1; border-top: 1px solid #e4e4e7; }
    .lista-entregas { max-height: 40vh; }
}
</style>
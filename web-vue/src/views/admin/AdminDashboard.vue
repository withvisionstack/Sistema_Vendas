<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { DollarSign, ShoppingBag, TrendingUp, Download, Package, Plus, Minus, Loader2 } from 'lucide-vue-next';
import Chart from 'chart.js/auto';
import { useProdutos } from '../../composables/useProdutos.js';
import SkeletonAdminDashboard from './SkeletonAdminDashboard.vue';

const STORAGE_KEY = '@delivery:pedidos';
const ESTOQUE_BAIXO = 5;

const { produtos, carregarProdutos, atualizarEstoque } = useProdutos();

const carregando = ref(true);
const pedidos = ref([]);
const estoqueAtualizando = ref(new Set());

const canvasRef = ref(null);
let chartInstance = null;

// ─── HELPERS ───
const formatarPreco = (valor) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor) || 0);

const valorDoPedido = (p) => Number(p.valorFinal) || Number(p.total) || 0;
const dataDoPedido = (p) => new Date(p.dataCriacao || p.dataPedido);

const lerPedidosStorage = () => {
    try {
        const dados = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(dados) ? dados : [];
    } catch {
        return [];
    }
};

const atualizarPedidos = () => {
    pedidos.value = lerPedidosStorage();
};

// ─── DADOS DE VENDAS ───
const pedidosValidos = computed(() => pedidos.value.filter(p => p.status !== 'Cancelado'));

const totalVendas = computed(() =>
    pedidosValidos.value.reduce((acc, p) => acc + valorDoPedido(p), 0)
);

const ticketMedio = computed(() =>
    pedidosValidos.value.length === 0 ? 0 : totalVendas.value / pedidosValidos.value.length
);

// ─── DADOS DO GRÁFICO ───
const dadosGrafico = computed(() => {
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const hoje = new Date();
    const resultado = [];

    for (let i = 6; i >= 0; i--) {
        const dia = new Date(hoje);
        dia.setDate(hoje.getDate() - i);
        dia.setHours(0, 0, 0, 0);

        const proximoDia = new Date(dia);
        proximoDia.setDate(dia.getDate() + 1);

        const valor = pedidosValidos.value
            .filter(p => {
                const data = dataDoPedido(p);
                return data >= dia && data < proximoDia;
            })
            .reduce((acc, p) => acc + valorDoPedido(p), 0);

        resultado.push({
            dia: diasSemana[dia.getDay()],
            valor,
            dataFormatada: dia.toLocaleDateString('pt-BR')
        });
    }

    return resultado;
});

// ─── GRÁFICO ───
const criarGrafico = () => {
    if (!canvasRef.value) return;
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(canvasRef.value.getContext('2d'), {
        type: 'bar',
        data: {
            labels: dadosGrafico.value.map(d => d.dia),
            datasets: [{
                label: 'Vendas',
                data: dadosGrafico.value.map(d => d.valor),
                backgroundColor: 'rgba(220, 38, 38, 0.85)',
                hoverBackgroundColor: '#dc2626',
                borderRadius: 8,
                borderSkipped: false,
                maxBarThickness: 44
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 800, easing: 'easeOutQuart' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#18181b',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 13 },
                    callbacks: {
                        title: (items) => dadosGrafico.value[items[0].dataIndex].dataFormatada,
                        label: (ctx) => formatarPreco(ctx.parsed.y)
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 12, weight: '600' }, color: '#71717a' }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: '#f4f4f5' },
                    ticks: {
                        color: '#a1a1aa',
                        font: { size: 11 },
                        callback: (v) => v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : `R$ ${v}`
                    }
                }
            }
        }
    });
};

// ─── ESTOQUE DE BEBIDAS ───
const bebidas = computed(() =>
    produtos.value.filter(p => p.categoriaId === 'bebidas')
);

const getEstoque = (bebida) => Number(bebida.estoque) || 0;

const estaAtualizando = (id) => estoqueAtualizando.value.has(id);

const ajustarEstoque = async (bebida, delta) => {
    if (estaAtualizando(bebida.id)) return;

    const novoValor = getEstoque(bebida) + delta;
    if (novoValor < 0) return;

    // Reatribui o Set para garantir reatividade
    estoqueAtualizando.value = new Set(estoqueAtualizando.value).add(bebida.id);

    try {
        await atualizarEstoque(bebida.id, novoValor);
    } catch (e) {
        alert('❌ Erro ao atualizar estoque: ' + (e?.message || e));
    } finally {
        const novo = new Set(estoqueAtualizando.value);
        novo.delete(bebida.id);
        estoqueAtualizando.value = novo;
    }
};

// ─── EXPORTAR CSV ───
const escaparCSV = (valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`;

const exportarCSV = () => {
    if (pedidos.value.length === 0) {
        return alert('Não há pedidos para exportar.');
    }

    const linhas = [['ID do Pedido', 'Data', 'Cliente', 'Total', 'Status', 'Pagamento'].map(escaparCSV).join(',')];

    pedidos.value.forEach(p => {
        linhas.push([
            p.id,
            dataDoPedido(p).toLocaleString('pt-BR'),
            p.cliente?.nome || 'Desconhecido',
            valorDoPedido(p).toFixed(2),
            p.status,
            p.pagamento
        ].map(escaparCSV).join(','));
    });

    // BOM (\uFEFF) para o Excel reconhecer acentos corretamente
    const blob = new Blob(['\uFEFF' + linhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_vendas_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// ─── CICLO DE VIDA ───
watch(dadosGrafico, () => {
    if (!carregando.value) nextTick(criarGrafico);
});

onMounted(async () => {
    window.addEventListener('pedidos-atualizados', atualizarPedidos);

    atualizarPedidos();

    try {
        await carregarProdutos();
    } catch (e) {
        console.error('Erro ao carregar produtos:', e);
    } finally {
        carregando.value = false;
    }

    await nextTick();
    criarGrafico();
});

onUnmounted(() => {
    window.removeEventListener('pedidos-atualizados', atualizarPedidos);
    if (chartInstance) chartInstance.destroy();
});
</script>

<template>
    <div class="dashboard">
        <SkeletonAdminDashboard v-if="carregando" />

        <template v-else>
            <header class="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Visão geral das vendas e estoque.</p>
                </div>
                <button class="btn-exportar" @click="exportarCSV">
                    <Download :size="18" /> Exportar Excel (CSV)
                </button>
            </header>

            <!-- CARDS DE RESUMO -->
            <div class="cards-grid">
                <div class="stat-card">
                    <div class="icone vermelho"><DollarSign :size="24" /></div>
                    <div class="info">
                        <span>Faturamento</span>
                        <strong>{{ formatarPreco(totalVendas) }}</strong>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="icone azul"><ShoppingBag :size="24" /></div>
                    <div class="info">
                        <span>Pedidos Totais</span>
                        <strong>{{ pedidosValidos.length }}</strong>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="icone verde"><TrendingUp :size="24" /></div>
                    <div class="info">
                        <span>Ticket Médio</span>
                        <strong>{{ formatarPreco(ticketMedio) }}</strong>
                    </div>
                </div>
            </div>

            <div class="layout-grid">
                <!-- GRÁFICO -->
                <div class="card-painel">
                    <h2>Vendas nos Últimos 7 Dias</h2>
                    <div class="grafico-wrapper">
                        <canvas ref="canvasRef"></canvas>
                    </div>
                </div>

                <!-- CONTROLE DE ESTOQUE -->
                <div class="card-painel">
                    <h2><Package :size="18" /> Controle de Estoque</h2>
                    <p class="sub">Gerencie a quantidade de bebidas disponíveis.</p>

                    <div class="lista-estoque">
                        <div v-for="bebida in bebidas" :key="bebida.id" class="item-estoque">
                            <div class="info-item">
                                <img :src="bebida.imagem" :alt="bebida.nome" />
                                <div>
                                    <strong>{{ bebida.nome }}</strong>
                                    <span>{{ formatarPreco(bebida.preco) }}</span>
                                </div>
                            </div>

                            <div class="controle-estoque">
                                <button
                                    :disabled="estaAtualizando(bebida.id) || getEstoque(bebida) <= 0"
                                    @click="ajustarEstoque(bebida, -1)"
                                >
                                    <Minus :size="16" />
                                </button>

                                <Loader2 v-if="estaAtualizando(bebida.id)" :size="16" class="girando" />
                                <span v-else :class="{ alerta: getEstoque(bebida) < ESTOQUE_BAIXO }">
                                    {{ getEstoque(bebida) }}
                                </span>

                                <button
                                    :disabled="estaAtualizando(bebida.id)"
                                    @click="ajustarEstoque(bebida, 1)"
                                >
                                    <Plus :size="16" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
<style scoped>
.dashboard { max-width: 1200px; margin: 0 auto; padding: 8px 16px 32px; box-sizing: border-box; }

.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.page-header h1 { font-size: 24px; color: #18181b; margin: 0 0 4px 0; }
.page-header p { color: #71717a; margin: 0; }
.btn-exportar { display: flex; align-items: center; gap: 8px; background: #18181b; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-exportar:hover { background: #27272a; }

/* CARDS */
.cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
.stat-card { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e4e4e7; display: flex; align-items: center; gap: 16px; }
.icone { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.icone.vermelho { background: #fef2f2; color: #dc2626; }
.icone.azul { background: #e0f2fe; color: #0284c7; }
.icone.verde { background: #dcfce7; color: #16a34a; }
.info { display: flex; flex-direction: column; }
.info span { font-size: 13px; color: #71717a; font-weight: 600; }
.info strong { font-size: 20px; color: #18181b; }

/* LAYOUT E PAINEIS */
.layout-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
@media (max-width: 900px) { .layout-grid { grid-template-columns: 1fr; } }

.card-painel { background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #e4e4e7; }
.card-painel h2 { font-size: 16px; color: #18181b; margin: 0 0 4px 0; display: flex; align-items: center; gap: 8px; }
.sub { font-size: 13px; color: #71717a; margin: 0 0 20px 0; }

/* ✅ GRÁFICO CHART.JS */
.grafico-wrapper {
    position: relative;
    height: 260px;
    width: 100%;
    margin-top: 20px;
}

/* ESTOQUE */
.lista-estoque { display: flex; flex-direction: column; gap: 12px; max-height: 280px; overflow-y: auto; padding-right: 4px; }
.item-estoque { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #fafafa; border: 1px solid #f4f4f5; border-radius: 8px; }
.info-item { display: flex; align-items: center; gap: 12px; min-width: 0; }
.info-item img { width: 40px; height: 40px; border-radius: 6px; object-fit: contain; background: #fff; flex-shrink: 0; }
.info-item strong { font-size: 14px; color: #18181b; display: block; }
.info-item span { font-size: 12px; color: #71717a; }

.controle-estoque { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.controle-estoque button { background: #fff; border: 1px solid #e4e4e7; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #3f3f46; transition: background 0.2s; }
.controle-estoque button:hover { background: #f4f4f5; }
.controle-estoque span { font-weight: 800; font-size: 16px; color: #18181b; min-width: 24px; text-align: center; }
.controle-estoque span.alerta { color: #dc2626; animation: pulse 1.5s infinite; }

@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

/* MOBILE */
@media (max-width: 640px) {
    .dashboard { padding: 8px 12px 32px; }
    .page-header h1 { font-size: 20px; }
    .page-header p { font-size: 13px; }
    .btn-exportar { width: 100%; justify-content: center; }
    .card-painel { padding: 16px; }
    .grafico-wrapper { height: 220px; }
}
</style>
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
    Bike, MapPin, Phone, LogOut, Package, 
    CheckCircle, TrendingUp, Calendar, Clock
} from 'lucide-vue-next';
import { useEntregadorAuth } from '../composables/useEntregadorAuth.js';

const router = useRouter();
const { entregadorLogado, logout } = useEntregadorAuth();

const abaAtiva = ref('andamento'); // 'andamento' ou 'historico'

const pedidosAtivos = ref([]);
const pedidosEntregues = ref([]);
let polling = null;

// ═══════════════════════════════════════════════════════════
// CARREGAR PEDIDOS
// ═══════════════════════════════════════════════════════════
const carregarPedidos = () => {
    const todos = JSON.parse(localStorage.getItem('@delivery:pedidos')) || [];
    const meusPedidos = todos.filter(p => p.entregadorId === entregadorLogado.value?.id);
    
    // Em andamento
    pedidosAtivos.value = meusPedidos.filter(p => p.status === 'Saiu para entrega');
    
    // Histórico (entregues), ordenado do mais recente para o mais antigo
    pedidosEntregues.value = meusPedidos
        .filter(p => p.status === 'Entregue')
        .sort((a, b) => {
            const dataA = new Date(a.dataEntrega || a.dataCriacao);
            const dataB = new Date(b.dataEntrega || b.dataCriacao);
            return dataB - dataA;
        });
};

onMounted(() => {
    carregarPedidos();
    polling = setInterval(carregarPedidos, 3000);
});

onUnmounted(() => {
    if (polling) clearInterval(polling);
});

// ═══════════════════════════════════════════════════════════
// ESTATÍSTICAS
// ═══════════════════════════════════════════════════════════
const hoje = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

const inicioSemana = () => {
    const d = new Date();
    const dia = d.getDay(); // 0=dom, 1=seg...
    d.setDate(d.getDate() - dia);
    d.setHours(0, 0, 0, 0);
    return d;
};

const inicioMes = () => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
};

const contarDesde = (dataInicio) => {
    return pedidosEntregues.value.filter(p => {
        const data = new Date(p.dataEntrega || p.dataCriacao);
        return data >= dataInicio;
    }).length;
};

const valorDesde = (dataInicio) => {
    return pedidosEntregues.value
        .filter(p => {
            const data = new Date(p.dataEntrega || p.dataCriacao);
            return data >= dataInicio;
        })
        .reduce((acc, p) => acc + (p.valorFinal || p.total || 0), 0);
};

const statsHoje = computed(() => ({
    count: contarDesde(hoje()),
    valor: valorDesde(hoje())
}));

const statsSemana = computed(() => ({
    count: contarDesde(inicioSemana()),
    valor: valorDesde(inicioSemana())
}));

const statsMes = computed(() => ({
    count: contarDesde(inicioMes()),
    valor: valorDesde(inicioMes())
}));

// ═══════════════════════════════════════════════════════════
// AÇÕES
// ═══════════════════════════════════════════════════════════
const iniciarRota = (pedido) => {
    router.push(`/entregador/rota/${pedido.id}`);
};

const fazerLogout = () => {
    logout();
    router.push('/entregador/login');
};

const formatarPreco = (v) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const formatarData = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + 
           ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const formatarDataCurta = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const hoje = new Date();
    const ontem = new Date();
    ontem.setDate(hoje.getDate() - 1);
    
    const dataStr = d.toDateString();
    if (dataStr === hoje.toDateString()) return 'Hoje';
    if (dataStr === ontem.toDateString()) return 'Ontem';
    
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};
</script>

<template>
    <div class="painel-entregador">
        <!-- Header -->
        <header class="header">
            <div class="perfil">
                <img v-if="entregadorLogado?.foto" :src="entregadorLogado.foto" class="avatar" />
                <div v-else class="avatar-vazio"><Bike :size="20" /></div>
                <div class="info-perfil">
                    <strong>{{ entregadorLogado?.nome }}</strong>
                    <span>{{ entregadorLogado?.placa }}</span>
                </div>
            </div>
            <button class="btn-logout" @click="fazerLogout"><LogOut :size="20" /></button>
        </header>

        <!-- ✅ ABAS -->
        <div class="abas">
            <button 
                class="aba" 
                :class="{ ativa: abaAtiva === 'andamento' }" 
                @click="abaAtiva = 'andamento'"
            >
                <Package :size="18" />
                Em Andamento
                <span v-if="pedidosAtivos.length > 0" class="badge-aba">{{ pedidosAtivos.length }}</span>
            </button>
            <button 
                class="aba" 
                :class="{ ativa: abaAtiva === 'historico' }" 
                @click="abaAtiva = 'historico'"
            >
                <CheckCircle :size="18" />
                Histórico
            </button>
        </div>

        <main class="conteudo">
            
            <!-- ═══════════════════════════════════════════════════ -->
            <!-- ABA: EM ANDAMENTO                                  -->
            <!-- ═══════════════════════════════════════════════════ -->
            <template v-if="abaAtiva === 'andamento'">
                <div class="titulo-secao">
                    <h1>Pedidos em Andamento</h1>
                    <span class="badge">{{ pedidosAtivos.length }}</span>
                </div>

                <div v-if="pedidosAtivos.length === 0" class="vazio">
                    <Package :size="64" color="#d4d4d8" />
                    <h2>Nenhum pedido no momento</h2>
                    <p>Aguarde a loja atribuir uma entrega para você.</p>
                </div>

                <div v-else class="lista-pedidos">
                    <div v-for="pedido in pedidosAtivos" :key="pedido.id" class="card-pedido">
                        <div class="card-header">
                            <strong>#{{ String(pedido.id).slice(-4) }}</strong>
                            <span class="valor">{{ formatarPreco(pedido.valorFinal || pedido.total) }}</span>
                        </div>

                        <div class="dados-cliente">
                            <div class="linha-info">
                                <Phone :size="16" color="#71717a" />
                                <span>{{ pedido.cliente.nome }}</span>
                            </div>
                            <div class="linha-info">
                                <MapPin :size="16" color="#dc2626" />
                                <span>{{ pedido.endereco.rua }}, {{ pedido.endereco.numero }}</span>
                            </div>
                            <div class="linha-info-mini">
                                <span>{{ pedido.endereco.bairro }}</span>
                            </div>
                        </div>

                        <button class="btn-iniciar" @click="iniciarRota(pedido)">
                            <Bike :size="18" /> Iniciar Rota
                        </button>
                    </div>
                </div>
            </template>

            <!-- ═══════════════════════════════════════════════════ -->
            <!-- ABA: HISTÓRICO                                     -->
            <!-- ═══════════════════════════════════════════════════ -->
            <template v-else>
                <!-- Estatísticas -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon hoje">
                            <Clock :size="20" />
                        </div>
                        <div class="stat-info">
                            <span>Hoje</span>
                            <strong>{{ statsHoje.count }} entregas</strong>
                            <small>{{ formatarPreco(statsHoje.valor) }}</small>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon semana">
                            <Calendar :size="20" />
                        </div>
                        <div class="stat-info">
                            <span>Esta semana</span>
                            <strong>{{ statsSemana.count }} entregas</strong>
                            <small>{{ formatarPreco(statsSemana.valor) }}</small>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon mes">
                            <TrendingUp :size="20" />
                        </div>
                        <div class="stat-info">
                            <span>Este mês</span>
                            <strong>{{ statsMes.count }} entregas</strong>
                            <small>{{ formatarPreco(statsMes.valor) }}</small>
                        </div>
                    </div>
                </div>

                <!-- Lista de entregas -->
                <div class="titulo-secao">
                    <h2>Entregas Realizadas</h2>
                    <span class="badge-cinza">{{ pedidosEntregues.length }}</span>
                </div>

                <div v-if="pedidosEntregues.length === 0" class="vazio">
                    <CheckCircle :size="64" color="#d4d4d8" />
                    <h2>Nenhuma entrega ainda</h2>
                    <p>Suas entregas concluídas aparecerão aqui.</p>
                </div>

                <div v-else class="lista-entregas">
                    <div v-for="pedido in pedidosEntregues" :key="pedido.id" class="card-entrega">
                        <div class="entrega-header">
                            <div class="entrega-id">
                                <CheckCircle :size="18" color="#16a34a" />
                                <strong>#{{ String(pedido.id).slice(-4) }}</strong>
                            </div>
                            <span class="data-entrega">{{ formatarData(pedido.dataEntrega || pedido.dataCriacao) }}</span>
                        </div>

                        <div class="entrega-body">
                            <div class="linha-info">
                                <MapPin :size="14" color="#71717a" />
                                <span>{{ pedido.endereco.rua }}, {{ pedido.endereco.numero }} - {{ pedido.endereco.bairro }}</span>
                            </div>
                            <div class="linha-info">
                                <Phone :size="14" color="#71717a" />
                                <span>{{ pedido.cliente.nome }}</span>
                            </div>
                        </div>

                        <div class="entrega-footer">
                            <span class="status-entregue">✓ Entregue</span>
                            <strong class="valor-entregue">{{ formatarPreco(pedido.valorFinal || pedido.total) }}</strong>
                        </div>
                    </div>
                </div>
            </template>
        </main>
    </div>
</template>

<style scoped>
.painel-entregador { min-height: 100vh; background: #f4f4f5; }

/* Header */
.header { 
    background: #18181b; 
    color: #fff; 
    padding: 16px; 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    position: sticky; 
    top: 0; 
    z-index: 100; 
}
.perfil { display: flex; align-items: center; gap: 12px; }
.avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid #fff; }
.avatar-vazio { width: 44px; height: 44px; border-radius: 50%; background: #27272a; display: flex; align-items: center; justify-content: center; }
.info-perfil { display: flex; flex-direction: column; }
.info-perfil strong { font-size: 15px; }
.info-perfil span { font-size: 12px; color: #a1a1aa; }
.btn-logout { background: transparent; border: none; color: #a1a1aa; cursor: pointer; padding: 8px; }

/* ✅ ABAS */
.abas {
    display: flex;
    background: #fff;
    border-bottom: 1px solid #e4e4e7;
    position: sticky;
    top: 76px;
    z-index: 99;
}

.aba {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 14px 12px;
    background: transparent;
    border: none;
    color: #71717a;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    transition: all 0.2s;
    position: relative;
}

.aba:hover { background: #fafafa; }

.aba.ativa {
    color: #dc2626;
    border-bottom-color: #dc2626;
    background: #fef2f2;
}

.badge-aba {
    background: #dc2626;
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 10px;
    margin-left: 2px;
}

.conteudo { padding: 16px; max-width: 600px; margin: 0 auto; }

/* Títulos de seção */
.titulo-secao { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.titulo-secao h1 { font-size: 22px; margin: 0; color: #18181b; }
.titulo-secao h2 { font-size: 18px; margin: 0; color: #18181b; }
.badge { background: #dc2626; color: #fff; padding: 2px 10px; border-radius: 12px; font-size: 13px; font-weight: 800; }
.badge-cinza { background: #e4e4e7; color: #3f3f46; padding: 2px 10px; border-radius: 12px; font-size: 13px; font-weight: 800; }

/* Vazio */
.vazio { text-align: center; padding: 60px 20px; color: #71717a; }
.vazio h2 { color: #3f3f46; margin: 16px 0 8px; font-size: 18px; }
.vazio p { margin: 0; }

/* ═══════════════════════════════════════════════════════════ */
/* ABA EM ANDAMENTO                                           */
/* ═══════════════════════════════════════════════════════════ */
.lista-pedidos { display: flex; flex-direction: column; gap: 16px; }

.card-pedido { 
    background: #fff; 
    border-radius: 16px; 
    padding: 16px; 
    box-shadow: 0 2px 10px rgba(0,0,0,0.05); 
    border-left: 4px solid #dc2626; 
}

.card-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
.card-header strong { font-size: 18px; color: #18181b; }
.valor { font-size: 16px; font-weight: 800; color: #16a34a; }

.dados-cliente { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.linha-info { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #3f3f46; }
.linha-info-mini { margin-left: 24px; font-size: 12px; color: #71717a; }

.btn-iniciar { 
    width: 100%; 
    background: #dc2626; 
    color: #fff; 
    border: none; 
    padding: 14px; 
    border-radius: 10px; 
    font-weight: 700; 
    font-size: 15px; 
    cursor: pointer; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    gap: 8px; 
}
.btn-iniciar:active { transform: scale(0.98); }

/* ═══════════════════════════════════════════════════════════ */
/* ✅ ABA HISTÓRICO — ESTATÍSTICAS                            */
/* ═══════════════════════════════════════════════════════════ */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 24px;
}

@media (max-width: 480px) {
    .stats-grid { grid-template-columns: 1fr; }
}

.stat-card {
    background: #fff;
    border-radius: 12px;
    padding: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid #e4e4e7;
}

.stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #fff;
}

.stat-icon.hoje { background: linear-gradient(135deg, #dc2626, #ef4444); }
.stat-icon.semana { background: linear-gradient(135deg, #2563eb, #3b82f6); }
.stat-icon.mes { background: linear-gradient(135deg, #16a34a, #22c55e); }

.stat-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.stat-info span {
    font-size: 11px;
    color: #71717a;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

.stat-info strong {
    font-size: 14px;
    color: #18181b;
    margin-top: 2px;
}

.stat-info small {
    font-size: 11px;
    color: #16a34a;
    font-weight: 700;
    margin-top: 1px;
}

/* ═══════════════════════════════════════════════════════════ */
/* ✅ ABA HISTÓRICO — LISTA DE ENTREGAS                       */
/* ═══════════════════════════════════════════════════════════ */
.lista-entregas { display: flex; flex-direction: column; gap: 12px; }

.card-entrega {
    background: #fff;
    border-radius: 12px;
    padding: 14px;
    border: 1px solid #e4e4e7;
    border-left: 3px solid #16a34a;
}

.entrega-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px dashed #f4f4f5;
}

.entrega-id {
    display: flex;
    align-items: center;
    gap: 6px;
}

.entrega-id strong {
    font-size: 15px;
    color: #18181b;
}

.data-entrega {
    font-size: 11px;
    color: #71717a;
    font-weight: 600;
}

.entrega-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 10px;
}

.entrega-body .linha-info {
    font-size: 13px;
    color: #555;
}

.entrega-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 8px;
    border-top: 1px dashed #f4f4f5;
}

.status-entregue {
    font-size: 12px;
    font-weight: 700;
    color: #16a34a;
    background: #dcfce7;
    padding: 3px 8px;
    border-radius: 6px;
}

.valor-entregue {
    font-size: 15px;
    color: #18181b;
}
</style>
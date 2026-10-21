 <script setup>
 import { ref, onMounted, onUnmounted, computed } from 'vue';
 import { Clock, ChefHat, Bike, CheckCircle, XCircle, User } from 'lucide-vue-next';
 import { useEntregadores } from '../../composables/useEntregadores.js';
 import SkeletonAdminPedidos from './SkeletonAdminPedidos.vue';

 const { entregadores } = useEntregadores();

 const pedidos = ref([]);
 const carregando = ref(true);
 let polling = null;

 const carregarPedidos = () => {
     const todosPedidos = JSON.parse(localStorage.getItem('@delivery:pedidos')) || [];
     pedidos.value = todosPedidos.filter(p => p.status !== 'Entregue');
 };

 onMounted(() => {
     setTimeout(() => {
         carregarPedidos();
         carregando.value = false;
     }, 600);

     polling = setInterval(() => {
         if (!carregando.value) carregarPedidos();
     }, 3000);
 });

 onUnmounted(() => {
     if (polling) clearInterval(polling);
 });

 const formatarPreco = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

 const formatarData = (dataString) => {
     if (!dataString) return '';
     return new Date(dataString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
 };

 // ─── MUDANÇAS DE STATUS ───
 const mudarStatus = (id, novoStatus) => {
     const todosPedidos = JSON.parse(localStorage.getItem('@delivery:pedidos')) || [];
     const index = todosPedidos.findIndex(p => p.id === id);

     if (index !== -1) {
         todosPedidos[index].status = novoStatus;
         localStorage.setItem('@delivery:pedidos', JSON.stringify(todosPedidos));
         window.dispatchEvent(new Event('pedidos-atualizados'));
         carregarPedidos();
     }
 };

 const mudarTempoEstimado = (id, tempo) => {
     const todosPedidos = JSON.parse(localStorage.getItem('@delivery:pedidos')) || [];
     const index = todosPedidos.findIndex(p => p.id === id);

     if (index !== -1) {
         todosPedidos[index].tempoEstimado = tempo;
         localStorage.setItem('@delivery:pedidos', JSON.stringify(todosPedidos));
         window.dispatchEvent(new Event('pedidos-atualizados'));
         carregarPedidos();
     }
 };

 // ─── ATRIBUIÇÃO DE ENTREGADOR ───
 const entregadorSelecionado = ref({}); // { pedidoId: entregadorId }

 const selecionarEntregador = (pedidoId, entregadorId) => {
     entregadorSelecionado.value[pedidoId] = entregadorId;
 };

 // ✅ Despacha o pedido com o entregador escolhido
 const despacharPedido = (pedidoId) => {
     const entregadorId = entregadorSelecionado.value[pedidoId];
     if (!entregadorId) {
         return alert('Selecione um entregador antes de despachar.');
     }

     const todosPedidos = JSON.parse(localStorage.getItem('@delivery:pedidos')) || [];
     const index = todosPedidos.findIndex(p => p.id === pedidoId);

     if (index !== -1) {
         const entregador = entregadores.value.find(e => e.id === entregadorId);

         todosPedidos[index].status = 'Saiu para entrega';
         todosPedidos[index].entregadorId = entregadorId;
         todosPedidos[index].entregadorNome = entregador?.nome || 'Entregador';
         todosPedidos[index].entregadorFoto = entregador?.foto || '';
         todosPedidos[index].entregadorPlaca = entregador?.placa || '';

         localStorage.setItem('@delivery:pedidos', JSON.stringify(todosPedidos));
         window.dispatchEvent(new Event('pedidos-atualizados'));
         carregarPedidos();
     }
 };

 // ─── CLASSES E HELPERS ───
 const getStatusClass = (status) => {
     if (status === 'aguardando_pagamento') return 'status-pendente';
     if (status === 'Pedido visto') return 'status-visto';
     if (status === 'Em preparo') return 'status-preparo';
     if (status === 'Saiu para entrega') return 'status-entrega';
     return '';
 };

 const entregadoresDisponiveis = computed(() => {
     return entregadores.value.filter(e => e.status === 'ativo');
 });
 </script>

 <template>
     <div class="admin-pedidos">
         <header class="page-header">
             <h1>Pedidos em Andamento</h1>
             <p>Acompanhe e gerencie a fila de produção da cozinha.</p>
         </header>

         <SkeletonAdminPedidos v-if="carregando" />

         <template v-else>
             <div v-if="pedidos.length === 0" class="vazio">
                 <Clock :size="48" color="#ccc" />
                 <h2>Nenhum pedido ativo agora</h2>
                 <p>Assim que um cliente fizer um pedido, ele aparecerá aqui.</p>
             </div>

             <div v-else class="grid-pedidos">
                 <div v-for="pedido in pedidos" :key="pedido.id" class="card-pedido">

                     <!-- Cabeçalho do Card -->
                     <div class="card-top">
                         <div>
                             <span class="num-pedido">#{{ String(pedido.id).slice(-4) }}</span>
                             <span class="hora">{{ formatarData(pedido.dataCriacao) }}</span>
                         </div>
                         <span class="status" :class="getStatusClass(pedido.status)">
                             {{ pedido.status.replace('_', ' ') }}
                         </span>
                     </div>

                     <!-- Dados do Cliente -->
                     <div class="dados-cliente">
                         <strong>{{ pedido.cliente.nome }}</strong>
                         <span>{{ pedido.cliente.whatsapp }}</span>
                         <p>{{ pedido.endereco.rua }}, {{ pedido.endereco.numero }} - {{ pedido.endereco.bairro }}</p>
                     </div>

                     <!-- Itens do Pedido -->
                     <div class="lista-itens">
                         <div v-for="item in pedido.itens" :key="item.id" class="item-bloco">
                             <img :src="item.imagem" :alt="item.nome" class="item-img" />
                             <div class="item-info">
                                 <div class="item-header">
                                     <strong class="item-qtd">{{ item.quantidade }}x</strong>
                                     <span class="item-nome">{{ item.nome }}</span>
                                 </div>
                                 <p v-if="item.descricao" class="item-desc">{{ item.descricao }}</p>
                                 <div v-if="item.acompanhamentos?.length" class="adicionais-lista">
                                     <span v-for="ac in item.acompanhamentos" :key="ac.id" class="adicional">
                                         + {{ ac.nome }} <strong>({{ formatarPreco(ac.preco) }})</strong>
                                     </span>
                                 </div>
                                 <p v-if="item.observacao" class="obs">Obs: {{ item.observacao }}</p>
                             </div>
                         </div>
                     </div>

                     <div class="divisor"></div>

                     <!-- Rodapé -->
                     <div class="card-footer">
                         <div class="total-box">
                             <span>Total:</span>
                             <strong>{{ formatarPreco(pedido.valorFinal || pedido.total) }}</strong>
                         </div>

                         <div class="acoes-admin">
                             <!-- Previsão -->
                             <div class="select-group">
                                 <label>Previsão:</label>
                                 <select
                                     :value="pedido.tempoEstimado || 30"
                                     @change="mudarTempoEstimado(pedido.id, parseInt($event.target.value))"
                                     class="select-tempo"
                                 >
                                     <option :value="15">15 min</option>
                                     <option :value="30">30 min</option>
                                     <option :value="45">45 min</option>
                                     <option :value="60">1 hora</option>
                                     <option :value="90">1h 30m</option>
                                 </select>
                             </div>

                             <!-- Status -->
                             <div class="select-group">
                                 <label>Status:</label>
                                 <select
                                     :value="pedido.status"
                                     @change="mudarStatus(pedido.id, $event.target.value)"
                                     class="select-status"
                                     :class="getStatusClass(pedido.status)"
                                 >
                                     <option value="aguardando_pagamento">Aguardando Pagamento</option>
                                     <option value="Pedido visto">Pedido Visto</option>
                                     <option value="Em preparo">Em Preparo</option>
                                     <option value="Saiu para entrega">Saiu para Entrega</option>
                                     <option value="Entregue">Entregue</option>
                                 </select>
                             </div>
                         </div>
                     </div>

                     <!-- ✅ ATRIBUIÇÃO DE ENTREGADOR (só aparece se estiver em preparo) -->
                     <div v-if="pedido.status === 'Em preparo' || pedido.status === 'Pedido visto'" class="atribuir-entregador">
                         <div class="atribuir-header">
                             <User :size="16" />
                             <span>Atribuir Entregador</span>
                         </div>
                         <div class="atribuir-body">
                             <select
                                 :value="entregadorSelecionado[pedido.id] || ''"
                                 @change="selecionarEntregador(pedido.id, $event.target.value)"
                                 class="select-entregador"
                             >
                                 <option value="">Selecione um entregador...</option>
                                 <option
                                     v-for="ent in entregadoresDisponiveis"
                                     :key="ent.id"
                                     :value="ent.id"
                                 >
                                     {{ ent.nome }} ({{ ent.placa }})
                                 </option>
                             </select>
                             <button
                                 class="btn-despachar"
                                 @click="despacharPedido(pedido.id)"
                                 :disabled="!entregadorSelecionado[pedido.id]"
                             >
                                 <Bike :size="16" /> Despachar
                             </button>
                         </div>
                     </div>

                     <!-- ✅ ENTREGADOR ATRIBUÍDO (só aparece se já saiu para entrega) -->
                     <div v-if="pedido.status === 'Saiu para entrega' && pedido.entregadorId" class="entregador-atribuido">
                         <div class="entrega-info-mini">
                             <img v-if="pedido.entregadorFoto" :src="pedido.entregadorFoto" class="foto-mini" />
                             <div class="info-mini">
                                 <strong>{{ pedido.entregadorNome }}</strong>
                                 <span>Placa: {{ pedido.entregadorPlaca }}</span>
                             </div>
                             <Bike :size="20" color="#16a34a" />
                         </div>
                     </div>
                 </div>
             </div>
         </template>
     </div>
 </template>

 <style scoped>
 .admin-pedidos { max-width: 1200px; margin: 0 auto; padding: 8px 16px 32px; box-sizing: border-box; }

 .page-header { margin-bottom: 24px; }
 .page-header h1 { font-size: 24px; color: #18181b; margin: 0 0 4px 0; }
 .page-header p { color: #71717a; margin: 0; }

 .vazio { text-align: center; padding: 60px 20px; color: #71717a; background: #fff; border-radius: 12px; border: 1px dashed #e4e4e7; }
 .vazio h2 { margin: 16px 0 8px; color: #3f3f46; }

 .grid-pedidos { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
 .card-pedido { background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border: 1px solid #e4e4e7; display: flex; flex-direction: column; }

 /* Cabeçalho */
 .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
 .num-pedido { font-weight: 800; font-size: 18px; color: #18181b; }
 .hora { font-size: 12px; color: #71717a; margin-left: 8px; }

 .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; text-transform: capitalize; }
 .status-pendente { background: #fef3c7; color: #d97706; }
 .status-visto { background: #e0e7ff; color: #4338ca; }
 .status-preparo { background: #e0f2fe; color: #0284c7; }
 .status-entrega { background: #dcfce7; color: #16a34a; }

 /* Cliente */
 .dados-cliente { margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f4f4f5; font-size: 14px; }
 .dados-cliente strong { display: block; color: #18181b; font-size: 15px; }
 .dados-cliente span { color: #71717a; font-size: 13px; }
 .dados-cliente p { color: #71717a; margin: 4px 0 0 0; font-size: 13px; }

 /* Itens */
 .lista-itens { flex: 1; display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
 .item-bloco { display: flex; gap: 12px; background: #fafafa; padding: 12px; border-radius: 8px; border: 1px solid #f4f4f5; }
 .item-img { width: 60px; height: 60px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
 .item-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
 .item-header { display: flex; gap: 8px; align-items: center; }
 .item-qtd { color: #dc2626; font-size: 16px; font-weight: 800; }
 .item-nome { color: #18181b; font-size: 15px; font-weight: 700; }
 .item-desc { font-size: 12px; color: #71717a; margin: 0; line-height: 1.3; }
 .adicionais-lista { display: flex; flex-direction: column; margin-top: 4px; }
 .adicional { font-size: 12px; color: #dc2626; font-weight: 600; }
 .adicional strong { font-weight: 800; color: #991b1b; }
 .obs { font-size: 12px; color: #b45309; background: #fef3c7; padding: 4px 8px; border-radius: 4px; margin: 4px 0 0 0; font-style: italic; display: inline-block; }

 .divisor { height: 1px; background: #e4e4e7; margin-bottom: 16px; }

 /* Rodapé */
 .card-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; gap: 12px; flex-wrap: wrap; }
 .total-box { display: flex; flex-direction: column; margin-bottom: 4px; }
 .total-box span { font-size: 12px; color: #71717a; }
 .total-box strong { font-size: 20px; color: #18181b; }

 .acoes-admin { display: flex; gap: 12px; flex-wrap: wrap; }
 .select-group { display: flex; flex-direction: column; gap: 4px; }
 .select-group label { font-size: 12px; font-weight: 600; color: #71717a; }

 .select-tempo, .select-status {
     padding: 8px;
     border-radius: 8px;
     font-size: 13px;
     font-weight: 700;
     cursor: pointer;
     border: 1px solid #e4e4e7;
     outline: none;
     background-color: #f4f4f5;
     color: #18181b;
 }

 .select-status.status-pendente { background-color: #fef3c7; color: #d97706; border-color: #fde68a; }
 .select-status.status-visto { background-color: #e0e7ff; color: #4338ca; border-color: #c7d2fe; }
 .select-status.status-preparo { background-color: #e0f2fe; color: #0284c7; border-color: #bae6fd; }
 .select-status.status-entrega { background-color: #dcfce7; color: #16a34a; border-color: #bbf7d0; }

 /* ✅ ATRIBUIÇÃO DE ENTREGADOR */
 .atribuir-entregador {
     margin-top: 16px;
     padding: 12px;
     background: #fef9c3;
     border: 1px dashed #facc15;
     border-radius: 8px;
 }

 .atribuir-header {
     display: flex;
     align-items: center;
     gap: 6px;
     font-size: 13px;
     font-weight: 700;
     color: #854d0e;
     margin-bottom: 10px;
 }

 .atribuir-body {
     display: flex;
     gap: 8px;
     flex-wrap: wrap;
 }

 .select-entregador {
     flex: 1;
     min-width: 180px;
     padding: 10px;
     border: 1px solid #e4e4e7;
     border-radius: 6px;
     font-size: 13px;
     outline: none;
     background: #fff;
 }

 .btn-despachar {
     display: flex;
     align-items: center;
     gap: 6px;
     background: #dc2626;
     color: #fff;
     border: none;
     padding: 10px 16px;
     border-radius: 6px;
     font-weight: 700;
     font-size: 13px;
     cursor: pointer;
     transition: background 0.2s;
 }

 .btn-despachar:hover:not(:disabled) { background: #b91c1c; }
 .btn-despachar:disabled { background: #a1a1aa; cursor: not-allowed; opacity: 0.7; }

 /* ✅ ENTREGADOR ATRIBUÍDO */
 .entregador-atribuido {
     margin-top: 16px;
     padding: 12px;
     background: #f0fdf4;
     border: 1px solid #bbf7d0;
     border-radius: 8px;
 }

 .entrega-info-mini {
     display: flex;
     align-items: center;
     gap: 12px;
 }

 .foto-mini {
     width: 40px;
     height: 40px;
     border-radius: 50%;
     object-fit: cover;
     border: 2px solid #fff;
     box-shadow: 0 2px 4px rgba(0,0,0,0.1);
 }

 .info-mini {
     flex: 1;
     display: flex;
     flex-direction: column;
 }

 .info-mini strong { font-size: 14px; color: #18181b; }
 .info-mini span { font-size: 12px; color: #71717a; }

 /* MOBILE */
 @media (max-width: 640px) {
     .admin-pedidos { padding: 8px 12px 32px; }
     .page-header h1 { font-size: 20px; }
     .grid-pedidos { grid-template-columns: 1fr; }
     .card-pedido { padding: 12px; }
     .acoes-admin { width: 100%; }
     .select-group { flex: 1; }
     .atribuir-body { flex-direction: column; }
     .select-entregador { min-width: 0; }
     .btn-despachar { justify-content: center; }
 }
 </style>
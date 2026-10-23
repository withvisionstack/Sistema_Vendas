<template>
  <div class="entregador">
    <div id="mapa" class="mapa"></div>

    <!-- ✅ Botões do topo (só quando NÃO está navegando e NÃO chegou) -->
    <div v-if="!navegando && !chegou" class="painel-topo">
      <button @click="voltarAoPainel" class="btn-voltar" title="Voltar ao painel">
        ←
      </button>
      <button
        @click="calcularRota"
        :disabled="carregando || !posicao"
        class="btn-calcular"
      >
        {{ carregando ? '⏳ Calculando...' : '🧭 Iniciar navegação' }}
      </button>
      <button @click="obterPosicao" class="btn-gps" title="Minha localização">
        📍
      </button>
      <button @click="toggleModo3D" class="btn-3d" title="Alternar 2D/3D">
        {{ modo3D ? '3D' : '2D' }}
      </button>
    </div>

    <!-- Legenda -->
    <div v-if="navegando" class="legenda-mapa">
      <div class="legenda-item">
        <span class="legenda-simbolo legenda-voce">▲</span>
        <span>Você</span>
      </div>
      <div class="legenda-item">
        <span class="legenda-simbolo legenda-destino">📍</span>
        <span>Destino</span>
      </div>
      <div class="legenda-item">
        <span class="legenda-simbolo legenda-linha"></span>
        <span>Rota</span>
      </div>
    </div>

    <!-- Barra de navegação ativa -->
    <div v-if="navegando && manobraAtual" class="barra-nav">
      <div class="manobra-principal">
        <div class="icone">{{ iconeManobra(manobraAtual.type) }}</div>
        <div class="texto">
          <div class="distancia">{{ formatarDistancia(distanciaProxima) }}</div>
          <div class="instrucao">{{ manobraAtual.instruction }}</div>
        </div>
        <button class="btn-voz" @click="toggleVoz">
          {{ vozAtiva ? '🔊' : '🔇' }}
        </button>
      </div>
      <div v-if="proximaManobra" class="manobra-seguinte">
        <span class="seta">↳</span>
        <span>{{ proximaManobra.instruction }}</span>
      </div>
    </div>

    <!-- ✅ Banner "Você chegou!" -->
    <div v-if="chegou" class="banner-chegou">
      <div class="icone-chegou">✓</div>
      <div>
        <div class="titulo-chegou">Você chegou!</div>
        <div class="subtitulo-chegou">Entregue o pedido ao cliente</div>
      </div>
    </div>

    <!-- ✅ Botões de ação (navegando ou chegou) -->
    <div v-if="navegando || chegou" class="acoes-fim">
    <button v-if="navegando" @click="encerrarNavegacao" class="btn-parar">✕</button>
    <button @click="abrirModalEntrega" class="btn-entregue">
        ✓ Confirmar Entrega
    </button>
</div>

    <!-- Lista de instruções -->
    <div v-if="!navegando && !chegou && rota" class="painel-baixo">
      <InstrucoesRota :rota="rota" />
    </div>

    <Teleport to="body">
    <div v-if="modalAberto" class="modal-overlay">
        <div class="modal-content">
            
            <!-- Status de proximidade -->
            <div v-if="distanciaAtual !== null" :class="distanciaAtual <= 150 ? 'aviso-perto' : 'aviso-longe'">
                {{ distanciaAtual <= 150 ? '✅' : '⚠️' }} 
                Você está a <strong>{{ distanciaAtual }}m</strong> do destino
            </div>

            <!-- MODO PIN -->
            <template v-if="!modoAlternativo">
                <h2>🔐 Confirme a Entrega</h2>
                <p class="sub">Peça o PIN de 4 dígitos ao cliente</p>

                <div class="pin-input-area">
                    <input
                        :value="pinDigitado"
                        @input="formatarPin"
                        type="tel"
                        inputmode="numeric"
                        maxlength="4"
                        class="pin-input"
                        placeholder="0000"
                        autofocus
                    />
                </div>

                <p v-if="erroPin" class="erro-pin">{{ erroPin }}</p>

                <button 
                    @click="confirmarComPin" 
                    class="btn-confirmar-pin"
                    :disabled="pinDigitado.length !== 4"
                >
                    ✓ Confirmar com PIN
                </button>

                <button 
                    @click="modoAlternativo = true" 
                    class="btn-alternativo"
                >
                    Cliente não sabe o PIN?
                </button>
            </template>

            <!-- MODO ALTERNATIVO (foto + justificativa) -->
            <template v-else>
                <h2>📷 Modo Alternativo</h2>
                <p class="sub">
                    Use apenas se o cliente não souber o PIN. 
                    A entrega será registrada como <strong>forçada</strong>.
                </p>

                <!-- Foto -->
                <div class="upload-area">
                    <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        id="foto-input" 
                        @change="capturarFoto"
                        style="display: none"
                    />
                    
                    <label v-if="!fotoComprovante" for="foto-input" class="btn-foto">
                        📷 {{ processandoFoto ? 'Processando...' : 'Tirar Foto do Comprovante' }}
                    </label>

                    <div v-else class="preview-foto">
                        <img :src="fotoComprovante" alt="Comprovante" />
                        <button @click="limparFoto" class="btn-trocar">Tirar outra</button>
                    </div>
                </div>

                <!-- Justificativa -->
                <div class="campo-obs">
                    <label>Por que o cliente não soube o PIN?</label>
                    <textarea 
                        v-model="justificativa" 
                        placeholder="Ex: Cliente idoso não conseguiu acessar o celular"
                        maxlength="200"
                    ></textarea>
                </div>

                <p v-if="erroPin" class="erro-pin">{{ erroPin }}</p>

                <div class="modal-acoes">
                    <button @click="modoAlternativo = false" class="btn-cancelar">
                        Voltar
                    </button>
                    <button @click="confirmarComFoto" class="btn-confirmar-foto">
                        ✓ Confirmar Forçado
                    </button>
                </div>
            </template>

            <!-- Botão fechar -->
            <button @click="modalAberto = false" class="btn-fechar-modal">✕</button>
        </div>
    </div>
</Teleport>

    <!-- Erro -->
    <div v-if="erro" class="erro">{{ erro }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMapa } from '../composables/useMapa.js';
import { useRota } from '../composables/useRota.js';
import { useEntregadorAuth } from '../composables/useEntregadorAuth.js';
import InstrucoesRota from '../components/InstrucoesRota.vue';
import { useValidacaoEntrega } from '../composables/useValidacaoEntrega.js';

const route = useRoute();
const router = useRouter();
const { entregadorLogado } = useEntregadorAuth();

// ─── Estado ────────────────────────────────────────────
const pedido = ref(null);
const destino = ref(null); // ✅ agora é reativo
const posicao = ref(null);
const navegando = ref(false);
const chegou = ref(false); // ✅ NOVO
const manobraAtual = ref(null);
const proximaManobra = ref(null);
const distanciaProxima = ref(0);
const vozAtiva = ref(true);
const modo3D = ref(true);


const pedidoId = route.params.id;


// ─── Estados do modal de entrega ───
const modalAberto = ref(false);
const pinDigitado = ref('');
const modoAlternativo = ref(false);
const justificativa = ref('');
const distanciaAtual = ref(0);        // ✅ ESSA LINHA FALTAVA
const processandoFoto = ref(false);
const erroPin = ref('');

// ─── Composables ───────────────────────────────────────
const {
  mapa,
  inicializar,
  desenharRota,
  marcarDestino,
  voarPara,
  atualizarPosicao,
  atualizarPosicaoComHeading,
  iniciarFollow,
  pararFollow,
} = useMapa();

const { rota, carregando, erro, calcular } = useRota();


const {
    fotoComprovante,
    validarPin,
    verificarProximidade,
    processarFoto,
    limparFoto
} = useValidacaoEntrega();

// ─── Abre modal ───
function abrirModalEntrega() {
    if (!posicao.value || !destino.value) {
        alert('Aguarde o GPS obter sua posição.');
        return;
    }

    const proximidade = verificarProximidade(posicao.value, destino.value);
    distanciaAtual.value = proximidade.distancia;
    
    // Reseta o estado
    pinDigitado.value = '';
    modoAlternativo.value = false;
    justificativa.value = '';
    erroPin.value = '';
    limparFoto();
    
    modalAberto.value = true;
}

// ─── Formata PIN (só números, max 4) ───
function formatarPin(e) {
    pinDigitado.value = e.target.value.replace(/\D/g, '').slice(0, 4);
    erroPin.value = '';
}

// ─── Captura foto ───
async function capturarFoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    processandoFoto.value = true;
    try {
        await processarFoto(file);
    } catch (e) {
        alert('Erro ao processar foto.');
    }
    processandoFoto.value = false;
}

// ─── Confirma entrega com PIN ───
function confirmarComPin() {
    if (pinDigitado.value.length !== 4) {
        erroPin.value = 'Digite os 4 dígitos do PIN';
        return;
    }

    const resultado = validarPin(pedido.value, pinDigitado.value);

    if (!resultado.ok) {
        // Atualiza o contador no localStorage
        const pedidos = JSON.parse(localStorage.getItem('@delivery:pedidos')) || [];
        const idx = pedidos.findIndex(p => p.id == pedido.value.id);
        if (idx !== -1) {
            pedidos[idx].pinTentativas = resultado.tentativas || pedido.value.pinTentativas + 1;
            pedidos[idx].pinBloqueado = resultado.motivo === 'bloqueado';
            localStorage.setItem('@delivery:pedidos', JSON.stringify(pedidos));
            pedido.value.pinTentativas = pedidos[idx].pinTentativas;
            pedido.value.pinBloqueado = pedidos[idx].pinBloqueado;
        }

        erroPin.value = resultado.mensagem;
        
        // Se bloqueou, força modo alternativo
        if (resultado.motivo === 'bloqueado') {
            modoAlternativo.value = true;
        }
        return;
    }

    finalizarEntrega('pin');
}

// ─── Confirma entrega com foto + justificativa (modo alternativo) ───
function confirmarComFoto() {
    if (!fotoComprovante.value) {
        erroPin.value = 'Tire uma foto do comprovante';
        return;
    }
    if (!justificativa.value.trim() || justificativa.value.trim().length < 10) {
        erroPin.value = 'Descreva o motivo (mínimo 10 caracteres)';
        return;
    }

    finalizarEntrega('forcado');
}

// ─── Salva no localStorage ───
function finalizarEntrega(tipo) {
    const pedidos = JSON.parse(localStorage.getItem('@delivery:pedidos')) || [];
    const idx = pedidos.findIndex(p => p.id == pedido.value.id);

    if (idx !== -1) {
        pedidos[idx].status = 'Entregue';
        pedidos[idx].dataEntrega = new Date().toISOString();
        pedidos[idx].coordenadasEntrega = posicao.value 
            ? { lat: posicao.value.lat, lng: posicao.value.lon } 
            : null;
        pedidos[idx].distanciaNoMomento = distanciaAtual.value;
        pedidos[idx].validacao = tipo; // 'pin' ou 'forcado'
        
        if (fotoComprovante.value) {
            pedidos[idx].fotoComprovante = fotoComprovante.value;
        }
        
        if (tipo === 'forcado') {
            pedidos[idx].justificativa = justificativa.value;
            pedidos[idx].entregaForcada = true;
        }

        localStorage.setItem('@delivery:pedidos', JSON.stringify(pedidos));
        window.dispatchEvent(new Event('pedidos-atualizados'));
    }

    modalAberto.value = false;
    limparFoto();
    router.push('/entregador/painel');
}


// ─── Estado interno ────────────────────────────────────
let watchId = null;
let rotaAtual = null;
let ultimaManobraFalada = -1;

// ─── Lifecycle ─────────────────────────────────────────
onMounted(() => {
  // 1. Carrega pedido da URL
  const pedidos = JSON.parse(localStorage.getItem('@delivery:pedidos')) || [];
  const encontrado = pedidos.find(p => p.id == pedidoId);

  if (!encontrado) {
    alert('Pedido não encontrado.');
    router.push('/entregador/painel');
    return;
  }

  if (encontrado.status !== 'Saiu para entrega') {
    alert(`Este pedido não está mais disponível (status: ${encontrado.status}).`);
    router.push('/entregador/painel');
    return;
  }

  if (encontrado.entregadorId !== entregadorLogado.value?.id) {
    alert('Este pedido não está atribuído a você.');
    router.push('/entregador/painel');
    return;
  }

  const coords = encontrado.endereco?.coordenadas;
  if (!coords?.lat || !coords?.lng) {
    alert('Este pedido não possui coordenadas de destino.');
    router.push('/entregador/painel');
    return;
  }

  pedido.value = encontrado;
  // ✅ useMapa usa { lat, lon }; pedido usa { lat, lng }
  destino.value = { lat: coords.lat, lon: coords.lng };

  // 2. Inicializa mapa e marcador de destino
  inicializar('mapa');
  marcarDestino(destino.value.lat, destino.value.lon);
  obterPosicao();

  // 3. Inicia rastreamento GPS contínuo
  if (navigator.geolocation) {
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        posicao.value = { lat: latitude, lon: longitude };
        atualizarPosicaoComHeading(latitude, longitude);
        salvarPosicaoNoPedido(latitude, longitude); // ✅ NOVO

        if (navegando.value && rotaAtual) {
          atualizarInstrucoes(latitude, longitude);
        }
      },
      (err) => console.warn('GPS:', err.message),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
  }
});

onUnmounted(() => {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (window.speechSynthesis) window.speechSynthesis.cancel();
});

// ─── Ações ─────────────────────────────────────────────
async function calcularRota() {
  if (!posicao.value) {
    alert('Aguarde o GPS obter sua posição.');
    return;
  }

  try {
    const r = await calcular(posicao.value, destino.value); // ✅ destino.value
    rotaAtual = r;
    desenharRota(r.polyline);
    voarPara(posicao.value.lat, posicao.value.lon, 17);
    atualizarPosicao(posicao.value.lat, posicao.value.lon, 0);

    iniciarFollow();
    navegando.value = true;

    if (r.instrucoes[0]) {
      falar('Iniciando navegação. ' + r.instrucoes[0].instruction);
    }
  } catch (e) {
    console.error(e);
  }
}

function obterPosicao() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      posicao.value = { lat: latitude, lon: longitude };
      atualizarPosicao(latitude, longitude, 0);
      voarPara(latitude, longitude, 16);
    },
    (err) => alert('GPS: ' + err.message),
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function toggleModo3D() {
  modo3D.value = !modo3D.value;
  if (!mapa.value) return;
  mapa.value.easeTo({
    pitch: modo3D.value ? 45 : 0,
    duration: 800,
  });
}

function encerrarNavegacao(chegouNoDestino = false) {
  pararFollow();
  navegando.value = false;
  rotaAtual = null;
  manobraAtual.value = null;
  proximaManobra.value = null;
  ultimaManobraFalada = -1;

  if (chegouNoDestino) {
    chegou.value = true; // ✅ ativa o banner "Você chegou!"
  }

  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

// ✅ Volta ao painel
function voltarAoPainel() {
  if (navegando.value) {
    if (!confirm('Sair da navegação? O pedido continuará pendente até você confirmar a entrega.')) {
      return;
    }
    encerrarNavegacao();
  }
  router.push('/entregador/painel');
}

// ✅ Marca como entregue
function marcarEntregue() {
  if (!pedido.value) return;

  const idCurto = String(pedido.value.id).slice(-4);
  if (!confirm(`Confirmar entrega do pedido #${idCurto}?`)) {
    return;
  }

  const pedidos = JSON.parse(localStorage.getItem('@delivery:pedidos')) || [];
  const idx = pedidos.findIndex(p => p.id == pedido.value.id);

  if (idx !== -1) {
    pedidos[idx].status = 'Entregue';
    pedidos[idx].dataEntrega = new Date().toISOString();
    if (posicao.value) {
      pedidos[idx].coordenadasEntrega = { lat: posicao.value.lat, lng: posicao.value.lon };
    }
    localStorage.setItem('@delivery:pedidos', JSON.stringify(pedidos));
    window.dispatchEvent(new Event('pedidos-atualizados'));
  }

  router.push('/entregador/painel');
}

// ✅ Salva posição no pedido (para Admin/Cliente verem no mapa)
function salvarPosicaoNoPedido(lat, lon) {
    if (!pedido.value) return;
    const pedidos = JSON.parse(localStorage.getItem('@delivery:pedidos')) || [];
    const idx = pedidos.findIndex(p => p.id == pedido.value.id);
    if (idx !== -1) {
        // ✅ Pega o heading do GPS
        const posAtual = pedidos[idx].coordenadasEntregador;
        let heading = posAtual?.heading || 0;
        
        navigator.geolocation.getCurrentPosition((pos) => {
            heading = pos.coords.heading || 0;
            pedidos[idx].coordenadasEntregador = { 
                lat, 
                lng: lon, 
                heading,  // ✅ salva o heading
                timestamp: Date.now() 
            };
            localStorage.setItem('@delivery:pedidos', JSON.stringify(pedidos));
        });
    }
}
// ─── Navegação ─────────────────────────────────────────
function atualizarInstrucoes(lat, lon) {
  if (!rotaAtual) return;

  const coords = decodificaPolyline(rotaAtual.polyline);
  const manobras = rotaAtual.instrucoes;

  let melhorIdx = 0;
  let menorDist = Infinity;

  for (let i = 0; i < manobras.length - 1; i++) {
    const idx = manobras[i].begin_shape_index;
    if (idx >= coords.length) continue;
    const ponto = coords[idx];
    const d = haversine(lat, lon, ponto[1], ponto[0]);
    if (d < menorDist) {
      menorDist = d;
      melhorIdx = i;
    }
  }

  manobraAtual.value = manobras[melhorIdx];
  proximaManobra.value = manobras[melhorIdx + 1] || null;
  distanciaProxima.value = Math.round(menorDist);

  if (melhorIdx !== ultimaManobraFalada) {
    if (menorDist < 300 && menorDist > 200) {
      falar(manobraAtual.value.instruction + ' em 300 metros');
      ultimaManobraFalada = melhorIdx;
    }
  } else {
    if (menorDist < 100 && menorDist > 80) {
      falar('Em 100 metros, ' + manobraAtual.value.instruction);
    } else if (menorDist < 30 && menorDist > 10) {
      falar(manobraAtual.value.instruction + ' agora');
    }
  }

  if (melhorIdx === manobras.length - 1 && menorDist < 30) {
    falar('Você chegou ao seu destino');
    encerrarNavegacao(true); // ✅ passa "true" para ativar o banner
  }
}

function falar(texto) {
  if (!vozAtiva.value || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(texto);
  utt.lang = 'pt-BR';
  utt.rate = 1.0;
  window.speechSynthesis.speak(utt);
}

function toggleVoz() {
  vozAtiva.value = !vozAtiva.value;
}

// ─── Helpers ───────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = Math.PI / 180;
  const φ1 = lat1 * toRad;
  const φ2 = lat2 * toRad;
  const Δφ = (lat2 - lat1) * toRad;
  const Δλ = (lon2 - lon1) * toRad;
  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function decodificaPolyline(encoded) {
  let index = 0, lat = 0, lng = 0;
  const coords = [];
  while (index < encoded.length) {
    let shift = 0, result = 0, byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift; shift += 5;
    } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift; shift += 5;
    } while (byte >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    coords.push([lng / 1e5, lat / 1e5]);
  }
  return coords;
}

function iconeManobra(tipo) {
  const icones = {
    1: '↗️', 2: '⬆️', 3: '↗️', 4: '🏁', 5: '⬆️',
    6: '↖️', 7: '⬆️', 8: '↗️', 9: '➡️', 10: '➡️',
    11: '⬆️', 12: '➡️', 13: '⬆️', 14: '⬅️', 15: '⬅️',
    16: '↘️', 20: '↩️', 21: '🔄', 22: '↪️', 23: '↩️',
    26: '⬆️', 27: '⬆️',
  };
  return icones[tipo] || '⬆️';
}

function formatarDistancia(m) {
  if (m < 1000) return `${m} m`;
  return `${(m / 1000).toFixed(1)} km`;
}
</script>

<style scoped>
.entregador { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.mapa { width: 100%; height: 100%; position: absolute; inset: 0; }

/* ─── Painel topo ─── */
.painel-topo {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 80px;
  z-index: 1000;
  display: flex;
  gap: 8px;
}

.btn-voltar {
  width: 52px;
  height: 52px;
  background: #fff;
  border: none;
  border-radius: 12px;
  font-size: 24px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
  color: #18181b;
}

.btn-calcular {
  flex: 1;
  padding: 14px;
  background: #16a34a;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}
.btn-calcular:disabled { background: #aaa; cursor: wait; }

.btn-gps, .btn-3d {
  width: 52px;
  height: 52px;
  border: none;
  border-radius: 12px;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}
.btn-gps { background: #fff; }
.btn-3d { background: #4a90e2; color: #fff; font-size: 14px; }

/* ─── Barra de navegação ─── */
.barra-nav {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 80px;
  z-index: 2000;
  background: #1a1a1a;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  color: #fff;
}

.manobra-principal {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
}

.icone { font-size: 42px; line-height: 1; flex-shrink: 0; }
.texto { flex: 1; min-width: 0; }
.distancia { font-size: 28px; font-weight: 800; color: #4a90e2; line-height: 1; }
.instrucao { font-size: 15px; color: #ddd; margin-top: 6px; line-height: 1.3; }

.btn-voz {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  flex-shrink: 0;
}

.manobra-seguinte {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: #0f0f0f;
  font-size: 13px;
  color: #aaa;
  border-top: 1px solid #333;
}

.seta { font-size: 18px; color: #4a90e2; }

/* ─── Banner "Chegou" ─── */
.banner-chegou {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 80px;
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #16a34a;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  color: #fff;
}

.icone-chegou {
  font-size: 28px;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.titulo-chegou { font-size: 20px; font-weight: 800; margin-bottom: 2px; }
.subtitulo-chegou { font-size: 13px; opacity: 0.9; }

/* ─── Ações no rodapé ─── */
.acoes-fim {
  position: absolute;
  bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  left: 16px;
  right: 16px;
  z-index: 2000;
  display: flex;
  gap: 8px;
}

.btn-parar {
  width: 52px;
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 14px;
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.btn-entregue {
  flex: 1;
  background: #16a34a;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}
.btn-entregue:hover { background: #15803d; }

.painel-baixo {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  z-index: 1000;
  max-height: 50vh;
  overflow-y: auto;
}

.erro {
  position: absolute;
  top: 90px;
  left: 16px;
  right: 80px;
  background: #fee;
  color: #c00;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 1000;
}

/* ─── Legenda ─── */
.legenda-mapa {
  position: absolute;
  bottom: 84px;
  right: 16px;
  z-index: 1500;
  background: rgba(20, 20, 20, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.12);
  pointer-events: none;
  user-select: none;
}

.legenda-item { display: flex; align-items: center; gap: 10px; }
.legenda-simbolo {
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; font-size: 10px; color: #fff;
}
.legenda-voce { background: #f59e0b; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.4); }
.legenda-destino { background: #dc2626; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.4); }
.legenda-linha { width: 20px; height: 6px; background: #4dabf7; border-radius: 3px; border: 1.5px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.3); }

/* ─── Mobile ─── */
@media (max-width: 600px) {
  .legenda-mapa {
    bottom: calc(90px + env(safe-area-inset-bottom, 0px));
    right: 16px;
    padding: 8px 12px;
    font-size: 11px;
    gap: 6px;
  }
  .legenda-simbolo { width: 18px; height: 18px; }
  .legenda-linha { width: 18px; height: 5px; }
  .manobra-principal { padding: 12px 14px; gap: 10px; }
  .icone { font-size: 32px; }
  .distancia { font-size: 22px; }
  .instrucao { font-size: 13px; }
  .btn-voz { width: 38px; height: 38px; font-size: 16px; }
}

.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    padding: 16px;
    backdrop-filter: blur(4px);
}

.modal-content {
    background: #fff;
    border-radius: 20px;
    padding: 24px;
    width: 100%;
    max-width: 380px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    text-align: center;
}

.btn-fechar-modal {
    position: absolute;
    top: 12px;
    right: 12px;
    background: #f4f4f5;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    color: #71717a;
}

.aviso-perto, .aviso-longe {
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 16px;
    font-weight: 600;
}

.aviso-perto { background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0; }
.aviso-longe { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }

.modal-content h2 {
    font-size: 20px;
    color: #18181b;
    margin: 0 0 8px 0;
}

.modal-content .sub {
    font-size: 13px;
    color: #71717a;
    margin: 0 0 20px 0;
    line-height: 1.4;
}

.pin-input-area {
    margin-bottom: 16px;
}

.pin-input {
    width: 100%;
    max-width: 220px;
    padding: 16px;
    border: 2px solid #e4e4e7;
    border-radius: 12px;
    font-size: 36px;
    font-weight: 800;
    letter-spacing: 12px;
    text-align: center;
    font-family: 'Courier New', monospace;
    outline: none;
    background: #fafafa;
    transition: border-color 0.2s;
}

.pin-input:focus { border-color: #dc2626; background: #fff; }

.erro-pin {
    background: #fef2f2;
    color: #dc2626;
    padding: 10px;
    border-radius: 8px;
    font-size: 13px;
    margin: 0 0 16px 0;
    border: 1px solid #fecaca;
    font-weight: 600;
}

.btn-confirmar-pin {
    width: 100%;
    background: #16a34a;
    color: #fff;
    border: none;
    padding: 14px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    margin-bottom: 12px;
}

.btn-confirmar-pin:disabled {
    background: #a1a1aa;
    cursor: not-allowed;
}

.btn-alternativo {
    background: transparent;
    border: none;
    color: #dc2626;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    padding: 8px;
}

.upload-area {
    margin-bottom: 16px;
    display: flex;
    justify-content: center;
}

.btn-foto {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f4f4f5;
    border: 2px dashed #d4d4d8;
    border-radius: 12px;
    padding: 28px 20px;
    cursor: pointer;
    font-weight: 600;
    color: #3f3f46;
    width: 100%;
    justify-content: center;
    font-size: 14px;
}

.preview-foto { width: 100%; display: flex; flex-direction: column; gap: 8px; }
.preview-foto img { width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; }

.btn-trocar {
    background: #f4f4f5;
    border: 1px solid #e4e4e7;
    border-radius: 6px;
    padding: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
}

.campo-obs {
    text-align: left;
    margin-bottom: 16px;
}

.campo-obs label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #3f3f46;
    margin-bottom: 6px;
}

.campo-obs textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #e4e4e7;
    border-radius: 8px;
    font-size: 13px;
    font-family: inherit;
    resize: none;
    height: 70px;
    box-sizing: border-box;
}

.modal-acoes {
    display: flex;
    gap: 8px;
}

.btn-cancelar {
    flex: 1;
    background: #f4f4f5;
    color: #3f3f46;
    border: 1px solid #e4e4e7;
    padding: 12px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
}

.btn-confirmar-foto {
    flex: 2;
    background: #16a34a;
    color: #fff;
    border: none;
    padding: 12px;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;
}

</style>
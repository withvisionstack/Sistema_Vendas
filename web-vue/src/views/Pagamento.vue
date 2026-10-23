<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, CreditCard, Banknote, QrCode, CheckCircle2, Copy, Loader2, RefreshCw } from 'lucide-vue-next';
import { useCarrinho } from '../composables/useCarrinho.js';
import { useLoja } from '../composables/useLoja.js';
import { useNotificacoes } from '../composables/useNotificacoes.js';

const router = useRouter();
const { limparCarrinho } = useCarrinho();
const { configLoja } = useLoja();
const { adicionar: adicionarNotificacao } = useNotificacoes();

// ─── ESTADOS ───
const dadosCheckout = ref(null);
const metodoPagamento = ref('cartao');
const cpfPix = ref('');
const pixGerado = ref(false);
const gerandoPix = ref(false);
const copiado = ref(false);
const modalSucesso = ref(false);

const pixPayload = ref('');
const pixQrCodeUrl = ref('');

// ✅ NOVO: Estado de aguardando pagamento
const aguardandoPagamento = ref(false);
const verificandoPagamento = ref(false);
let pollingPagamento = null;
let tempoDecorrido = ref(0);
let cronometro = null;

onMounted(() => {
    const checkoutSalvo = localStorage.getItem('@delivery:checkout');
    if (!checkoutSalvo) {
        router.push('/carrinho');
        return;
    }
    dadosCheckout.value = JSON.parse(checkoutSalvo);
});

onUnmounted(() => {
    if (pollingPagamento) clearInterval(pollingPagamento);
    if (cronometro) clearInterval(cronometro);
});

// ─── COMPUTEDS ───
const subtotal = computed(() => dadosCheckout.value?.total || 0);
const taxaEntrega = computed(() => dadosCheckout.value?.taxaEntrega || 0);
const valorFinal = computed(() => dadosCheckout.value?.valorFinal || 0);

// ─── UTILS ───
const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

const formatarTempo = (segundos) => {
    const min = Math.floor(segundos / 60);
    const sec = segundos % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
};

// ─── GERA PAYLOAD DO PIX ───
const gerarPayloadPix = (chave, nome, cidade, valor, txid = '***') => {
    const formatarCampo = (id, val) => {
        const tamanho = val.length.toString().padStart(2, '0');
        return `${id}${tamanho}${val}`;
    };

    const nomeFormatado = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 25).toUpperCase();
    const cidadeFormatada = cidade.normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 15).toUpperCase();
    const valorFormatado = Number(valor).toFixed(2);

    let merchantAccountInfo = formatarCampo('00', 'BR.GOV.BCB.PIX') + formatarCampo('01', chave);

    let payload = '';
    payload += formatarCampo('00', '01');
    payload += formatarCampo('26', merchantAccountInfo);
    payload += formatarCampo('52', '0000');
    payload += formatarCampo('53', '986');
    payload += formatarCampo('54', valorFormatado);
    payload += formatarCampo('58', 'BR');
    payload += formatarCampo('59', nomeFormatado);
    payload += formatarCampo('60', cidadeFormatada);
    payload += formatarCampo('62', formatarCampo('05', txid));
    payload += '6304';

    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) > 0) crc = (crc << 1) ^ 0x1021;
            else crc = crc << 1;
        }
    }
    const crcFinal = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');

    return payload + crcFinal;
};

// ─── GERAR PIX ───
const gerarPix = () => {
    if (cpfPix.value.length < 11) {
        alert('Por favor, digite um CPF válido (apenas números).');
        return;
    }

    if (!configLoja.value.chavePix || !configLoja.value.nomeBeneficiario) {
        alert('A loja ainda não configurou a Chave Pix e o Nome no painel admin.');
        return;
    }

    gerandoPix.value = true;

    setTimeout(() => {
        const payload = gerarPayloadPix(
            configLoja.value.chavePix,
            configLoja.value.nomeBeneficiario,
            configLoja.value.cidadeBeneficiario || 'BRASIL',
            valorFinal.value
        );

        pixPayload.value = payload;
        pixQrCodeUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payload)}`;

        gerandoPix.value = false;
        pixGerado.value = true;

        // ✅ Entra em modo "aguardando pagamento"
        iniciarAguardandoPagamento();
    }, 1000);
};

// ✅ Inicia o polling/aguardando pagamento
const iniciarAguardandoPagamento = () => {
    aguardandoPagamento.value = true;
    tempoDecorrido.value = 0;

    // Cronômetro (mostra há quanto tempo está esperando)
    cronometro = setInterval(() => {
        tempoDecorrido.value++;
    }, 1000);

    // Polling: verifica a cada 3 segundos
    // No futuro (backend): fetch(`/api/pix/status/${txid}`)
    pollingPagamento = setInterval(() => {
        // ⚠️ TEMPORÁRIO: no futuro, aqui você consulta a API do banco
        // const resposta = await fetch(`/api/pix/status/${txid}`);
        // const data = await resposta.json();
        // if (data.pago) confirmarPagamentoPix();
    }, 3000);

    // Auto-cancelar após 10 minutos
    setTimeout(() => {
        if (aguardandoPagamento.value) {
            cancelarAguardando();
        }
    }, 10 * 60 * 1000);
};

// ✅ SIMULAÇÃO: enquanto não há API, permite o usuário "marcar como pago"
// (esse botão desaparece quando o backend Go estiver integrado)
const simularPagamentoRecebido = () => {
    if (verificandoPagamento.value) return;
    verificandoPagamento.value = true;

    // Simula tempo de verificação no banco
    setTimeout(() => {
        verificandoPagamento.value = false;
        confirmarPagamentoPix();
    }, 2000);
};

// ✅ Quando o banco confirma o pagamento
const confirmarPagamentoPix = () => {
    // Para o polling e cronômetro
    if (pollingPagamento) clearInterval(pollingPagamento);
    if (cronometro) clearInterval(cronometro);
    aguardandoPagamento.value = false;

    // Salva o pedido no histórico
    salvarPedido('pix');
};

// ✅ Cancela se o tempo expirar
const cancelarAguardando = () => {
    if (pollingPagamento) clearInterval(pollingPagamento);
    if (cronometro) clearInterval(cronometro);
    aguardandoPagamento.value = false;
    pixGerado.value = false;
    alert('O tempo para pagamento expirou. Gere um novo QR Code.');
};

// ─── COPIAR PIX ───
const copiarPix = () => {
    navigator.clipboard.writeText(pixPayload.value).then(() => {
        copiado.value = true;
        setTimeout(() => copiado.value = false, 3000);
    });
};

// ─── CONFIRMAR PAGAMENTO (cartão/dinheiro) ───
const confirmarPagamentoOutro = () => {
    if (metodoPagamento.value === 'pix') {
        // Se for PIX e ainda não gerou, obriga a gerar
        if (!pixGerado.value) {
            alert('Gere o QR Code primeiro.');
            return;
        }
        // Se gerou mas não está aguardando (já pagou), prossegue
        if (!aguardandoPagamento.value) return;
        
        alert('Aguardando confirmação do pagamento...');
        return;
    }

    // Cartão ou dinheiro: confirma direto
    salvarPedido(metodoPagamento.value);
};

// ─── SALVA O PEDIDO ───
const salvarPedido = (tipoPagamento) => {
    const pedidoFinal = {
        ...dadosCheckout.value,
        pagamento: tipoPagamento,
        status: 'Em preparo',
        dataPedido: new Date().toISOString()
    };

    const pedidosSalvos = JSON.parse(localStorage.getItem('@delivery:pedidos')) || [];
    pedidosSalvos.unshift(pedidoFinal);
    localStorage.setItem('@delivery:pedidos', JSON.stringify(pedidosSalvos));

    adicionarNotificacao('Pedido Confirmado! 🎉', 'Seu pedido foi recebido e já está em preparo.');
    window.dispatchEvent(new Event('pedidos-atualizados'));

    modalSucesso.value = true;
    limparCarrinho();
    localStorage.removeItem('@delivery:checkout');

    setTimeout(() => {
        router.push('/pedidos');
    }, 3000);
};

const voltar = () => {
    if (aguardandoPagamento.value) {
        if (!confirm('Você ainda não concluiu o pagamento. Sair mesmo assim?')) return;
        cancelarAguardando();
    }
    router.back();
};
</script>
<template>
    <div class="pagamento-page" v-if="dadosCheckout">
        <main class="conteudo">
            <!-- TOPO -->
            <div class="topo">
                <button class="btn-voltar" @click="voltar">
                    <ArrowLeft :size="24" />
                </button>
                <h1>Pagamento</h1>
            </div>

            <!-- RESUMO DO PEDIDO -->
            <div class="card-secao">
                <h2>Resumo do Pedido</h2>
                <div class="lista-itens">
                    <div v-for="item in dadosCheckout.itens" :key="item.id" class="item-resumo">
                        <span class="qtd">{{ item.quantidade }}x</span>
                        <span class="nome">{{ item.nome }}</span>
                        <span class="preco">{{ formatarPreco(item.precoTotal) }}</span>
                    </div>
                </div>

                <div class="divisor"></div>

                <div class="linha-valor">
                    <span>Subtotal</span>
                    <span>{{ formatarPreco(subtotal) }}</span>
                </div>
                <div class="linha-valor">
                    <span>Taxa de Entrega</span>
                    <span>{{ formatarPreco(taxaEntrega) }}</span>
                </div>
                <div class="linha-valor total">
                    <span>Total a Pagar</span>
                    <strong>{{ formatarPreco(valorFinal) }}</strong>
                </div>
            </div>

            <!-- FORMAS DE PAGAMENTO -->
            <div class="card-secao">
                <h2>Como deseja pagar?</h2>

                <div class="opcoes-pagamento">
                    <!-- Cartão -->
                    <label class="opcao" :class="{ 'ativa': metodoPagamento === 'cartao' }">
                        <input type="radio" value="cartao" v-model="metodoPagamento" />
                        <CreditCard :size="20" />
                        <div class="textos">
                            <span>Cartão</span>
                            <small>Na entrega</small>
                        </div>
                    </label>

                    <!-- Dinheiro -->
                    <label class="opcao" :class="{ 'ativa': metodoPagamento === 'dinheiro' }">
                        <input type="radio" value="dinheiro" v-model="metodoPagamento" />
                        <Banknote :size="20" />
                        <div class="textos">
                            <span>Dinheiro</span>
                            <small>Na entrega</small>
                        </div>
                    </label>

                    <!-- Pix -->
                    <label class="opcao" :class="{ 'ativa': metodoPagamento === 'pix' }">
                        <input type="radio" value="pix" v-model="metodoPagamento" />
                        <QrCode :size="20" />
                        <div class="textos">
                            <span>Pix</span>
                            <small>Rápido e seguro</small>
                        </div>
                    </label>
                </div>
            </div>

            <!-- ÁREA DO PIX -->
            <div v-if="metodoPagamento === 'pix'" class="card-secao area-pix">
                <h2><QrCode :size="18" /> Pagamento via Pix</h2>
                
                <!-- Etapa 1: digitar CPF -->
                <template v-if="!pixGerado">
                    <p class="sub">Insira seu CPF para gerar o QR Code.</p>
                    <div class="input-group">
                        <input
                            v-model="cpfPix"
                            type="tel"
                            placeholder="000.000.000-00"
                            maxlength="11"
                        />
                    </div>
                    <button
                        class="btn-gerar-pix"
                        @click="gerarPix"
                        :disabled="gerandoPix || cpfPix.length < 11"
                    >
                        <Loader2 v-if="gerandoPix" class="spin" :size="18" />
                        <QrCode v-else :size="18" />
                        {{ gerandoPix ? 'Gerando QR Code...' : 'Gerar QR Code Pix' }}
                    </button>
                </template>

                <!-- Etapa 2: QR Code gerado + aguardando -->
                <template v-else>
                    <div class="qrcode-box">
                        <p class="instrucao">Escaneie o QR Code no app do seu banco:</p>
                        <img :src="pixQrCodeUrl" alt="QR Code Pix" class="qr-code-img" />

                        <p class="instrucao">Ou copie o código abaixo:</p>
                        <div class="copiar-box">
                            <input type="text" readonly :value="pixPayload" />
                            <button @click="copiarPix" class="btn-copiar" :class="{ 'copiado': copiado }">
                                <CheckCircle2 v-if="copiado" :size="18" />
                                <Copy v-else :size="18" />
                                {{ copiado ? 'Copiado!' : 'Copiar' }}
                            </button>
                        </div>
                    </div>

                    <!-- ✅ Aguardando pagamento -->
                    <div v-if="aguardandoPagamento" class="aguardando-pagamento">
                        <div class="spinner-pagamento">
                            <Loader2 :size="32" class="spin" color="#dc2626" />
                        </div>
                        <h3>Aguardando pagamento...</h3>
                        <p>
                            O pagamento será detectado automaticamente.
                            <br>
                            <span class="tempo-espera">Aguardando há {{ formatarTempo(tempoDecorrido) }}</span>
                        </p>

                        <!-- ⚠️ BOTÃO TEMPORÁRIO -->
                        <button 
                            @click="simularPagamentoRecebido" 
                            class="btn-simular"
                            :disabled="verificandoPagamento"
                        >
                            <RefreshCw v-if="verificandoPagamento" :size="16" class="spin" />
                            <CheckCircle2 v-else :size="16" />
                            {{ verificandoPagamento ? 'Verificando...' : 'Já paguei (simular)' }}
                        </button>

                        <p class="aviso-temp">
                            ⚠️ Este botão desaparecerá quando o sistema estiver integrado ao banco real.
                        </p>

                        <button @click="cancelarAguardando" class="btn-cancelar-pix">
                            Cancelar e gerar novo QR
                        </button>
                    </div>
                </template>
            </div>
        </main>

        <!-- BOTÃO FIXO NO RODAPÉ -->
        <footer class="footer-pagamento">
            <!-- ✅ Esconde o botão se estiver aguardando pagamento PIX -->
            <button 
                v-if="!aguardandoPagamento"
                class="btn-confirmar" 
                @click="confirmarPagamentoOutro"
            >
                {{ metodoPagamento === 'pix' ? 'Gerar QR Code primeiro' : `Confirmar Pagamento • ${formatarPreco(valorFinal)}` }}
            </button>

            <!-- Mostra "aguardando" no rodapé também -->
            <div v-else class="footer-aguardando">
                <Loader2 :size="18" class="spin" color="#dc2626" />
                Aguardando confirmação do Pix...
            </div>
        </footer>

        <!-- MODAL DE SUCESSO -->
        <Teleport to="body">
            <div v-if="modalSucesso" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-icon">
                        <CheckCircle2 :size="48" color="#16a34a" />
                    </div>
                    <h3>Pedido Confirmado! 🎉</h3>
                    <p>
                        Seu pedido foi realizado com sucesso e chegará até você em breve. O restaurante já recebeu seu pedido!
                    </p>
                    <p class="sub-texto">Redirecionando para acompanhar seu pedido...</p>
                    <div class="loader-bar"></div>
                </div>
            </div>
        </Teleport>
    </div>
</template>
<style scoped>
/* ═══════════════════════════════════════════════════════════ */
/* BASE                                                        */
/* ═══════════════════════════════════════════════════════════ */
*, *::before, *::after { box-sizing: border-box; }

.pagamento-page {
    min-height: 100vh;
    min-height: 100dvh;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    padding-bottom: 90px;
}

.conteudo {
    flex: 1;
    padding: 16px;
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
}

/* ═══════════════════════════════════════════════════════════ */
/* TOPO                                                        */
/* ═══════════════════════════════════════════════════════════ */
.topo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
}

.topo h1 {
    font-size: 22px;
    margin: 0;
    color: #1a1a1a;
}

.btn-voltar {
    background: #fff;
    border: 1px solid #eee;
    width: 40px;
    height: 40px;
    padding: 0;
    flex-shrink: 0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

/* ═══════════════════════════════════════════════════════════ */
/* CARDS                                                       */
/* ═══════════════════════════════════════════════════════════ */
.card-secao {
    background: #fff;
    padding: 16px;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    margin-bottom: 16px;
}

.card-secao h2 {
    font-size: 16px;
    margin: 0 0 16px 0;
    color: #1a1a1a;
    display: flex;
    align-items: center;
    gap: 8px;
}

.sub {
    font-size: 13px;
    color: #777;
    margin: -8px 0 12px 0;
}

/* ═══════════════════════════════════════════════════════════ */
/* RESUMO                                                      */
/* ═══════════════════════════════════════════════════════════ */
.lista-itens {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
}

.item-resumo {
    display: flex;
    align-items: center;
    font-size: 14px;
    color: #333;
}

.item-resumo .qtd {
    color: #dc2626;
    font-weight: 700;
    width: 30px;
    flex-shrink: 0;
}

.item-resumo .nome { flex: 1; min-width: 0; }
.item-resumo .preco { font-weight: 600; white-space: nowrap; }

.divisor {
    height: 1px;
    background: #eee;
    margin: 12px 0;
}

.linha-valor {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
    color: #555;
}

.linha-valor.total {
    margin-top: 12px;
    font-size: 18px;
    color: #1a1a1a;
    align-items: center;
}

.linha-valor.total strong {
    font-size: 24px;
    color: #dc2626;
}

/* ═══════════════════════════════════════════════════════════ */
/* OPÇÕES DE PAGAMENTO                                         */
/* ═══════════════════════════════════════════════════════════ */
.opcoes-pagamento {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.opcao {
    position: relative; /* ✅ FIX 1: necessário para o input absoluto */
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border: 2px solid #eee;
    border-radius: 12px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
}

/* Esconde o input mas mantém acessível */
.opcao input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
}

.opcao:focus-within {
    outline: 2px solid #dc2626;
    outline-offset: 2px;
}

.opcao.ativa {
    border-color: #dc2626;
    background: #fef2f2;
}

.opcao .textos {
    display: flex;
    flex-direction: column;
}

.opcao .textos span {
    font-weight: 700;
    font-size: 15px;
    color: #1a1a1a;
}

.opcao .textos small {
    font-size: 12px;
    color: #777;
}

.opcao.ativa svg { color: #dc2626; }

/* ═══════════════════════════════════════════════════════════ */
/* PIX                                                         */
/* ═══════════════════════════════════════════════════════════ */
.area-pix {
    border: 1px dashed #dc2626;
    background: #fff;
}

.input-group input {
    width: 100%;
    padding: 14px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px; /* evita zoom no iOS */
    text-align: center;
    letter-spacing: 2px;
    margin-bottom: 12px;
    outline: none;
}

.input-group input:focus {
    border-color: #dc2626;
}

.btn-gerar-pix {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #dc2626;
    color: #fff;
    border: none;
    padding: 14px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    transition: background 0.2s, opacity 0.2s;
}

.btn-gerar-pix:hover:not(:disabled) { background: #b91c1c; }
.btn-gerar-pix:disabled { opacity: 0.6; cursor: not-allowed; }

.qrcode-box {
    text-align: center;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px dashed #ddd;
}

.instrucao {
    font-size: 13px;
    color: #555;
    margin-bottom: 12px;
}

.qr-code-img {
    width: 200px;
    height: 200px;
    max-width: 100%;
    object-fit: contain;
    border-radius: 8px;
    border: 4px solid #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    margin-bottom: 16px;
}

.copiar-box {
    display: flex;
    gap: 8px;
}

.copiar-box input {
    flex: 1;
    min-width: 0;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 12px;
    color: #777;
    background: #fafafa;
    outline: none;
    text-overflow: ellipsis;
}

.btn-copiar {
    display: flex;
    align-items: center;
    gap: 4px;
    background: #1a1a1a;
    color: #fff;
    border: none;
    padding: 0 16px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
}

.btn-copiar.copiado { background: #16a34a; }

/* ═══════════════════════════════════════════════════════════ */
/* AGUARDANDO PAGAMENTO                                        */
/* ═══════════════════════════════════════════════════════════ */
.aguardando-pagamento {
    margin-top: 20px;
    padding: 24px 16px;
    background: #fef2f2;
    border: 2px dashed #fecaca;
    border-radius: 16px;
    text-align: center;
    animation: fadeIn 0.3s ease-out; /* ✅ FIX 2: sem translateY */
}

.spinner-pagamento {
    width: 56px;
    height: 56px;
    margin: 0 auto 12px;
    background: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.15);
}

.aguardando-pagamento h3 {
    font-size: 18px;
    color: #dc2626;
    margin: 0 0 8px 0;
}

.aguardando-pagamento p {
    font-size: 14px;
    color: #555;
    margin: 0 0 16px 0;
    line-height: 1.5;
}

.tempo-espera {
    font-size: 12px;
    color: #a1a1aa;
    font-family: 'Courier New', monospace;
    font-weight: 600;
    display: block;
    margin-top: 6px;
}

/* ✅ FIX 3: botão simular com inline-flex (centraliza de verdade) */
.btn-simular {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: #dc2626;
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    margin-bottom: 12px;
    transition: background 0.2s, opacity 0.2s;
}

.btn-simular:hover:not(:disabled) { background: #b91c1c; }
.btn-simular:disabled { opacity: 0.6; cursor: wait; }

.aviso-temp {
    font-size: 11px !important;
    color: #a1a1aa !important;
    font-style: italic;
    margin-bottom: 12px !important;
    line-height: 1.4;
}

.btn-cancelar-pix {
    display: block;
    margin: 0 auto;
    background: transparent;
    border: none;
    color: #71717a;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    padding: 4px 8px;
}

/* ═══════════════════════════════════════════════════════════ */
/* RODAPÉ FIXO                                                 */
/* ═══════════════════════════════════════════════════════════ */
.footer-pagamento {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #fff;
    padding: 16px;
    padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
    z-index: 100;
    display: flex;
    justify-content: center;
}

.footer-pagamento > * {
    width: 100%;
    max-width: 600px;
}

.btn-confirmar {
    width: 100%;
    background: #dc2626;
    color: #fff;
    border: none;
    padding: 16px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s, opacity 0.2s;
}

.btn-confirmar:hover:not(:disabled) { background: #b91c1c; }
.btn-confirmar:disabled { opacity: 0.6; cursor: not-allowed; }

.footer-aguardando {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 12px;
    color: #dc2626;
    font-weight: 700;
    font-size: 15px;
}

/* ═══════════════════════════════════════════════════════════ */
/* MODAL                                                       */
/* ═══════════════════════════════════════════════════════════ */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 16px;
    -webkit-backdrop-filter: blur(4px);
    backdrop-filter: blur(4px);
}

.modal-content {
    background: #fff;
    border-radius: 24px;
    padding: 32px 24px;
    width: 100%;
    max-width: 400px;
    max-height: 100%;
    overflow-y: auto;
    text-align: center;
    animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.modal-icon {
    width: 80px;
    height: 80px;
    background: #dcfce7;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px auto;
}

.modal-content h3 {
    font-size: 22px;
    color: #1a1a1a;
    margin: 0 0 12px 0;
}

.modal-content p {
    font-size: 14px;
    color: #555;
    margin: 0 0 16px 0;
    line-height: 1.5;
}

.modal-content .sub-texto {
    font-size: 12px;
    color: #999;
}

.loader-bar {
    height: 4px;
    background: #eee;
    border-radius: 2px;
    overflow: hidden;
    margin-top: 8px;
}

.loader-bar::after {
    content: '';
    display: block;
    height: 100%;
    width: 0;
    background: #dc2626;
    border-radius: 2px;
    animation: load 3s linear forwards;
}

/* ═══════════════════════════════════════════════════════════ */
/* ANIMAÇÕES                                                   */
/* ═══════════════════════════════════════════════════════════ */
.spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

@keyframes slideUp {
    from { transform: translateY(100px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

@keyframes load {
    from { width: 0%; }
    to { width: 100%; }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
    .modal-content,
    .aguardando-pagamento {
        animation: none;
    }
    .spin {
        animation-duration: 2s;
    }
}

/* ═══════════════════════════════════════════════════════════ */
/* MOBILE                                                      */
/* ═══════════════════════════════════════════════════════════ */
@media (max-width: 480px) {
    .conteudo { padding: 12px; }
    .card-secao { padding: 14px; }
    .qr-code-img { width: 180px; height: 180px; }
    .aguardando-pagamento { padding: 20px 12px; }
    .btn-simular { padding: 12px 20px; font-size: 13px; }
}
</style>
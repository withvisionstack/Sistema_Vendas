<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, CreditCard, Banknote, QrCode, CheckCircle2, Copy, Loader2 } from 'lucide-vue-next';
import { useCarrinho } from '../composables/useCarrinho.js';
import { useLoja } from '../composables/useLoja.js';
// ✅ IMPORTAÇÃO CORRETA (pasta lib, com L)
import { gerarPayloadPix } from '../brl/pix.js';

const router = useRouter();
const { limparCarrinho } = useCarrinho();
const { configLoja } = useLoja();

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

onMounted(() => {
    const checkoutSalvo = localStorage.getItem('@delivery:checkout');
    if (!checkoutSalvo) {
        router.push('/carrinho');
        return;
    }
    dadosCheckout.value = JSON.parse(checkoutSalvo);
});

// ─── COMPUTEDS ───
const subtotal = computed(() => dadosCheckout.value?.total || 0);
const taxaEntrega = computed(() => dadosCheckout.value?.taxaEntrega || 0);
const valorFinal = computed(() => dadosCheckout.value?.valorFinal || 0);

// ─── FUNÇÕES ───
const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

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
        // ✅ CHAMANDO A FUNÇÃO DO ARQUIVO EXTERNO
        const payload = gerarPayloadPix({
            chave: configLoja.value.chavePix,
            nome: configLoja.value.nomeBeneficiario,
            cidade: configLoja.value.cidadeBeneficiario || 'BRASIL',
            valor: valorFinal.value,
            txid: `PEDIDO${Date.now().toString().slice(-6)}`
        });

        pixPayload.value = payload;
        pixQrCodeUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payload)}`;

        gerandoPix.value = false;
        pixGerado.value = true;
    }, 1000);
};

const copiarPix = () => {
    navigator.clipboard.writeText(pixPayload.value).then(() => {
        copiado.value = true;
        setTimeout(() => copiado.value = false, 3000);
    });
};

const confirmarPagamento = () => {
    if (metodoPagamento.value === 'pix' && !pixGerado.value) {
        alert('Por favor, gere o QR Code do Pix antes de confirmar.');
        return;
    }

    const pedidoFinal = {
        ...dadosCheckout.value,
        pagamento: metodoPagamento.value,
        status: 'Em preparo',
        dataPedido: new Date().toISOString()
    };

    const pedidosSalvos = JSON.parse(localStorage.getItem('@delivery:pedidos')) || [];
    pedidosSalvos.unshift(pedidoFinal);
    localStorage.setItem('@delivery:pedidos', JSON.stringify(pedidosSalvos));

    window.dispatchEvent(new Event('pedidos-atualizados'));

    modalSucesso.value = true;
    limparCarrinho();
    localStorage.removeItem('@delivery:checkout');

    setTimeout(() => {
        router.push('/pedidos');
    }, 3000);
};

const voltar = () => router.back();
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
                <p class="sub">Insira seu CPF para gerar o QR Code.</p>

                <div class="input-group">
                    <input
                        v-model="cpfPix"
                        type="tel"
                        placeholder="000.000.000-00"
                        maxlength="11"
                        :disabled="pixGerado"
                    />
                </div>

                <button
                    v-if="!pixGerado"
                    class="btn-gerar-pix"
                    @click="gerarPix"
                    :disabled="gerandoPix || cpfPix.length < 11"
                >
                    <Loader2 v-if="gerandoPix" class="spin" :size="18" />
                    <QrCode v-else :size="18" />
                    {{ gerandoPix ? 'Gerando QR Code...' : 'Gerar QR Code Pix' }}
                </button>

                <!-- QR Code Gerado -->
                <div v-if="pixGerado" class="qrcode-box">
                    <p class="instrucao">Escaneie o QR Code no app do seu banco:</p>

                    <!-- ✅ IMAGEM DO QR CODE REAL -->
                    <img
                        :src="pixQrCodeUrl"
                        alt="QR Code Pix"
                        class="qr-code-img"
                    />

                    <p class="instrucao">Ou copie o código abaixo:</p>
                    <div class="copiar-box">
                        <!-- ✅ CÓDIGO REAL COPIÁVEL -->
                        <input
                            type="text"
                            readonly
                            :value="pixPayload"
                        />
                        <button @click="copiarPix" class="btn-copiar" :class="{ 'copiado': copiado }">
                            <CheckCircle2 v-if="copiado" :size="18" />
                            <Copy v-else :size="18" />
                            {{ copiado ? 'Copiado!' : 'Copiar' }}
                        </button>
                    </div>
                </div>
            </div>
        </main>

        <!-- BOTÃO FIXO NO RODAPÉ -->
        <footer class="footer-pagamento">
            <button class="btn-confirmar" @click="confirmarPagamento">
                Confirmar Pagamento • {{ formatarPreco(valorFinal) }}
            </button>
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
/* O seu CSS continua exatamente igual, não precisa mudar nada */
.pagamento-page { min-height: 100vh; background: #ffffff; display: flex; flex-direction: column; padding-bottom: 90px; }
.conteudo { flex: 1; padding: 16px; max-width: 600px; margin: 0 auto; width: 100%; }

.topo { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
.topo h1 { font-size: 22px; margin: 0; color: #1a1a1a; }
.btn-voltar { background: #fff; border: 1px solid #eee; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }

.card-secao { background: #fff; padding: 16px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin-bottom: 16px; }
.card-secao h2 { font-size: 16px; margin: 0 0 16px 0; color: #1a1a1a; display: flex; align-items: center; gap: 8px; }
.sub { font-size: 13px; color: #777; margin: -8px 0 12px 0; }

.lista-itens { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.item-resumo { display: flex; align-items: center; font-size: 14px; color: #333; }
.item-resumo .qtd { color: #dc2626; font-weight: 700; width: 30px; }
.item-resumo .nome { flex: 1; }
.item-resumo .preco { font-weight: 600; }

.divisor { height: 1px; background: #eee; margin: 12px 0; }

.linha-valor { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #555; }
.linha-valor.total { margin-top: 12px; font-size: 18px; color: #1a1a1a; align-items: center; }
.linha-valor.total strong { font-size: 24px; color: #dc2626; }

.opcoes-pagamento { display: flex; flex-direction: column; gap: 12px; }
.opcao { display: flex; align-items: center; gap: 12px; padding: 16px; border: 2px solid #eee; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
.opcao input { display: none; }
.opcao.ativa { border-color: #dc2626; background: #fef2f2; }
.opcao .textos { display: flex; flex-direction: column; }
.opcao .textos span { font-weight: 700; font-size: 15px; color: #1a1a1a; }
.opcao .textos small { font-size: 12px; color: #777; }
.opcao.ativa svg { color: #dc2626; }

.area-pix { border: 1px dashed #dc2626; background: #fff; }
.input-group input { width: 100%; padding: 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; text-align: center; letter-spacing: 2px; margin-bottom: 12px; }
.input-group input:focus { border-color: #dc2626; outline: none; }

.btn-gerar-pix { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: #dc2626; color: #fff; border: none; padding: 14px; border-radius: 8px; font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.2s; }
.btn-gerar-pix:disabled { opacity: 0.6; cursor: not-allowed; }

.qrcode-box { text-align: center; margin-top: 16px; padding-top: 16px; border-top: 1px dashed #ddd; }
.instrucao { font-size: 13px; color: #555; margin-bottom: 12px; }
.qr-code-img { width: 200px; height: 200px; border-radius: 8px; border: 4px solid #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 16px; }

.copiar-box { display: flex; gap: 8px; }
.copiar-box input { flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 12px; color: #777; background: #fafafa; outline: none; }
.btn-copiar { display: flex; align-items: center; gap: 4px; background: #1a1a1a; color: #fff; border: none; padding: 0 16px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.btn-copiar.copiado { background: #16a34a; }

.footer-pagamento { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; padding: 16px; padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px)); box-shadow: 0 -4px 12px rgba(0,0,0,0.05); z-index: 100; }
.btn-confirmar { width: 100%; background: #dc2626; color: #fff; border: none; padding: 16px; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
.btn-confirmar:hover { background: #b91c1c; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px; backdrop-filter: blur(4px); }
.modal-content { background: #fff; border-radius: 24px; padding: 32px 24px; width: 100%; max-width: 400px; text-align: center; animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.modal-icon { width: 80px; height: 80px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; }
.modal-content h3 { font-size: 22px; color: #1a1a1a; margin: 0 0 12px 0; }
.modal-content p { font-size: 14px; color: #555; margin: 0 0 16px 0; line-height: 1.5; }
.sub-texto { font-size: 12px !important; color: #999 !important; }
.loader-bar { height: 4px; background: #eee; border-radius: 2px; overflow: hidden; margin-top: 8px; }
.loader-bar::after { content: ''; display: block; height: 100%; width: 50%; background: #dc2626; border-radius: 2px; animation: load 3s linear forwards; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
@keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes load { from { width: 0%; } to { width: 100%; } }
</style>
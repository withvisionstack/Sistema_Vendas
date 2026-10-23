<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Bike, Loader2 } from 'lucide-vue-next';
import { useEntregadorAuth } from '../composables/useEntregadorAuth.js';

const router = useRouter();
const { loginPorCodigo } = useEntregadorAuth();

const codigo = ref('');
const carregando = ref(false);
const erro = ref('');

const tentarLogin = async () => {
    if (codigo.value.length !== 6) {
        erro.value = 'Digite o código de 6 dígitos';
        return;
    }

    carregando.value = true;
    erro.value = '';

    await new Promise(r => setTimeout(r, 500));

    if (loginPorCodigo(codigo.value)) {
        router.push('/entregador/painel');
    } else {
        erro.value = 'Código inválido ou entregador inativo';
        codigo.value = '';
    }
    carregando.value = false;
};

const formatarCodigo = (e) => {
    codigo.value = e.target.value.replace(/\D/g, '').slice(0, 6);
};
</script>

<template>
    <div class="login-page">
        <div class="login-card">
            <div class="logo-login">
                <div class="logo-icon"><Bike :size="32" color="#fff" /></div>
                <h1>Área do Entregador</h1>
                <p>Digite o código de acesso fornecido pela loja</p>
            </div>

            <form @submit.prevent="tentarLogin" class="login-form">
                <input
                    v-model="codigo"
                    @input="formatarCodigo"
                    type="tel"
                    inputmode="numeric"
                    maxlength="6"
                    placeholder="000000"
                    class="input-codigo"
                    :disabled="carregando"
                    autofocus
                />
                <p v-if="erro" class="erro-msg">{{ erro }}</p>
                <button type="submit" class="btn-entrar" :disabled="carregando || codigo.length !== 6">
                    <Loader2 v-if="carregando" :size="18" class="spin" />
                    <span>{{ carregando ? 'Entrando...' : 'Entrar' }}</span>
                </button>
            </form>

            <p class="info-rodape">Não tem um código? Peça ao administrador da loja.</p>
        </div>
    </div>
</template>

<style scoped>
.login-page { min-height: 100vh; background: linear-gradient(135deg, #18181b 0%, #27272a 100%); display: flex; align-items: center; justify-content: center; padding: 24px; }
.login-card { background: #fff; padding: 40px 32px; border-radius: 20px; width: 100%; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
.logo-login { text-align: center; margin-bottom: 32px; }
.logo-icon { width: 64px; height: 64px; background: linear-gradient(135deg, #dc2626, #f97316); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
.logo-login h1 { font-size: 22px; color: #18181b; margin: 0 0 6px; font-weight: 800; }
.logo-login p { color: #71717a; font-size: 14px; margin: 0; }
.input-codigo { width: 100%; padding: 20px; border: 2px solid #e4e4e7; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 12px; text-align: center; outline: none; font-family: 'Courier New', monospace; background: #fafafa; box-sizing: border-box; transition: border-color 0.2s; }
.input-codigo:focus { border-color: #dc2626; background: #fff; }
.erro-msg { background: #fef2f2; color: #dc2626; padding: 10px; border-radius: 8px; font-size: 13px; text-align: center; margin: 16px 0; border: 1px solid #fecaca; }
.btn-entrar { width: 100%; background: #dc2626; color: #fff; border: none; padding: 15px; border-radius: 10px; font-weight: 700; font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 16px; }
.btn-entrar:disabled { opacity: 0.6; cursor: not-allowed; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
.info-rodape { margin-top: 24px; padding-top: 20px; border-top: 1px solid #f4f4f5; font-size: 13px; color: #71717a; text-align: center; }
</style>
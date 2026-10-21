<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Lock, Store, Eye, EyeOff, Loader2 } from 'lucide-vue-next';
import { useAuth } from '../../composables/useAuth.js';

const router = useRouter();
const { login } = useAuth();

const senha = ref('');
const mostrarSenha = ref(false);
const carregando = ref(false);
const erro = ref('');

const tentarLogin = async () => {
    if (!senha.value) {
        erro.value = 'Digite a senha';
        return;
    }

    carregando.value = true;
    erro.value = '';

    // Simula um pequeno delay (para não parecer instantâneo demais)
    await new Promise(resolve => setTimeout(resolve, 600));

    const sucesso = await login(senha.value);

    if (sucesso) {
        router.push('/admin/dashboard');
    } else {
        erro.value = 'Senha incorreta. Tente novamente.';
        senha.value = '';
        carregando.value = false;
    }
};
</script>

<template>
    <div class="login-page">
        <div class="login-card">
            <div class="logo-login">
                <div class="logo-icon">
                    <Store :size="32" color="#fff" />
                </div>
                <h1>Painel da Loja</h1>
                <p>Acesso restrito ao administrador</p>
            </div>

            <form class="login-form" @submit.prevent="tentarLogin">
                <div class="input-group">
                    <label for="senha">Senha de Acesso</label>
                    <div class="input-senha">
                        <Lock :size="18" class="input-icon" />
                        <input
                            id="senha"
                            v-model="senha"
                            :type="mostrarSenha ? 'text' : 'password'"
                            placeholder="Digite sua senha"
                            :disabled="carregando"
                            autofocus
                        />
                        <button
                            type="button"
                            class="btn-olho"
                            @click="mostrarSenha = !mostrarSenha"
                            :aria-label="mostrarSenha ? 'Esconder senha' : 'Mostrar senha'"
                        >
                            <EyeOff v-if="mostrarSenha" :size="18" />
                            <Eye v-else :size="18" />
                        </button>
                    </div>
                </div>

                <p v-if="erro" class="erro-msg">{{ erro }}</p>

                <button type="submit" class="btn-entrar" :disabled="carregando">
                    <Loader2 v-if="carregando" :size="18" class="spin" />
                    <span>{{ carregando ? 'Entrando...' : 'Entrar no Painel' }}</span>
                </button>
            </form>

            <p class="senha-info">
                <strong>Primeiro acesso?</strong> Use a senha padrão <code>admin123</code>
                e altere depois em Configurações.
            </p>
        </div>
    </div>
</template>

<style scoped>
.login-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    box-sizing: border-box;
}

.login-card {
    background: #fff;
    padding: 40px 32px;
    border-radius: 20px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.logo-login {
    text-align: center;
    margin-bottom: 32px;
}

.logo-icon {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #dc2626, #f97316);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px auto;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
}

.logo-login h1 {
    font-size: 24px;
    color: #18181b;
    margin: 0 0 6px 0;
    font-weight: 800;
}

.logo-login p {
    color: #71717a;
    font-size: 14px;
    margin: 0;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
}

.input-group label {
    font-size: 13px;
    font-weight: 600;
    color: #3f3f46;
}

.input-senha {
    position: relative;
    display: flex;
    align-items: center;
    background: #fafafa;
    border: 1px solid #e4e4e7;
    border-radius: 10px;
    transition: border-color 0.2s;
}

.input-senha:focus-within {
    border-color: #dc2626;
    background: #fff;
}

.input-icon {
    margin-left: 14px;
    color: #a1a1aa;
    flex-shrink: 0;
}

.input-senha input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 14px 12px;
    font-size: 15px;
    outline: none;
    color: #18181b;
    font-family: inherit;
}

.btn-olho {
    background: transparent;
    border: none;
    color: #a1a1aa;
    padding: 0 14px;
    cursor: pointer;
    height: 100%;
    display: flex;
    align-items: center;
}

.btn-olho:hover {
    color: #71717a;
}

.erro-msg {
    background: #fef2f2;
    color: #dc2626;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    margin: 0 0 16px 0;
    text-align: center;
    border: 1px solid #fecaca;
}

.btn-entrar {
    width: 100%;
    background: #dc2626;
    color: #fff;
    border: none;
    padding: 15px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.2s;
}

.btn-entrar:hover:not(:disabled) {
    background: #b91c1c;
}

.btn-entrar:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    100% { transform: rotate(360deg); }
}

@keyframes slideUp {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.senha-info {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #f4f4f5;
    font-size: 13px;
    color: #71717a;
    text-align: center;
    line-height: 1.5;
}

.senha-info strong {
    color: #3f3f46;
}

.senha-info code {
    background: #fef2f2;
    color: #dc2626;
    padding: 2px 8px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-weight: 700;
    font-size: 12px;
}

@media (max-width: 480px) {
    .login-card {
        padding: 32px 24px;
    }
    .logo-login h1 {
        font-size: 20px;
    }
}
</style>
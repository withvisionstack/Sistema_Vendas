<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, User, MapPin, Trash2, CheckCircle2, Plus } from 'lucide-vue-next';
import HeaderCliente from '../components/cliente/HeaderCliente.vue';
import BottomNav from '../components/cliente/BottomNav.vue';
import { usePerfil } from '../composables/usePerfil.js';

const router = useRouter();
const { perfil, salvarDadosPessoais, adicionarEndereco, removerEndereco, definirPrincipal } = usePerfil();

const nome = ref(perfil.value.nome);
const whatsapp = ref(perfil.value.whatsapp);
const mostrarFormEndereco = ref(false);

const novoEnd = ref({ rua: '', numero: '', bairro: '', cidade: '', complemento: '' });

const salvarPerfil = () => {
    salvarDadosPessoais(nome.value, whatsapp.value);
    alert('Dados pessoais salvos com sucesso!');
};

const salvarNovoEndereco = () => {
    if (!novoEnd.value.rua || !novoEnd.value.numero || !novoEnd.value.cidade) {
        alert('Preencha Rua, Número e Cidade.');
        return;
    }
    adicionarEndereco({ ...novoEnd.value, tipo: 'Casa' });
    novoEnd.value = { rua: '', numero: '', bairro: '', cidade: '', complemento: '' };
    mostrarFormEndereco.value = false;
};

const voltar = () => router.back();
</script>

<template>
    <div class="perfil-page">
        <HeaderCliente />

        <main class="conteudo">
            <div class="topo">
                <button class="btn-voltar" @click="voltar"><ArrowLeft :size="24" /></button>
                <h1>Meu Perfil</h1>
            </div>

            <!-- DADOS PESSOAIS -->
            <div class="card-secao">
                <h2><User :size="18" /> Dados Pessoais</h2>
                <div class="input-group">
                    <label>Nome Completo</label>
                    <input v-model="nome" type="text" placeholder="Seu nome" />
                </div>
                <div class="input-group">
                    <label>WhatsApp</label>
                    <input v-model="whatsapp" type="tel" placeholder="(00) 00000-0000" />
                </div>
                <button class="btn-salvar" @click="salvarPerfil">Salvar Dados</button>
            </div>

            <!-- ENDEREÇOS -->
            <div class="card-secao">
                <div class="header-secao">
                    <h2><MapPin :size="18" /> Meus Endereços</h2>
                    <button class="btn-add-endereco" @click="mostrarFormEndereco = !mostrarFormEndereco">
                        <Plus :size="16" /> Adicionar
                    </button>
                </div>

                <!-- Formulário de Novo Endereço -->
                <div v-if="mostrarFormEndereco" class="form-novo-endereco">
                    <div class="row-inputs">
                        <div class="input-group flex-2"><label>Rua</label><input v-model="novoEnd.rua" type="text" placeholder="Nome da rua" /></div>
                        <div class="input-group flex-1"><label>Número</label><input v-model="novoEnd.numero" type="text" placeholder="123" /></div>
                    </div>
                    <div class="row-inputs">
                        <div class="input-group"><label>Cidade</label><input v-model="novoEnd.cidade" type="text" placeholder="Sua cidade" /></div>
                        <div class="input-group"><label>Bairro</label><input v-model="novoEnd.bairro" type="text" placeholder="Seu bairro" /></div>
                    </div>
                    <div class="input-group"><label>Complemento</label><input v-model="novoEnd.complemento" type="text" placeholder="Apto, bloco (opcional)" /></div>
                    <button class="btn-salvar" @click="salvarNovoEndereco">Salvar Endereço</button>
                </div>

                <!-- Lista de Endereços Salvos -->
                <div v-if="perfil.enderecos.length === 0 && !mostrarFormEndereco" class="vazio-enderecos">
                    <p>Nenhum endereço salvo. Adicione um para agilizar suas compras.</p>
                </div>

                <div class="lista-enderecos">
                    <div v-for="end in perfil.enderecos" :key="end.id" class="card-endereco" :class="{ principal: perfil.enderecoPrincipalId === end.id }">
                        <div class="info-end">
                            <strong>{{ end.rua }}, {{ end.numero }}</strong>
                            <span>{{ end.bairro }} - {{ end.cidade }}</span>
                        </div>
                        <div class="acoes-end">
                            <button class="btn-icon" @click="definirPrincipal(end.id)" title="Tornar Principal">
                                <CheckCircle2 :size="18" :color="perfil.enderecoPrincipalId === end.id ? '#16a34a' : '#ccc'" />
                            </button>
                            <button class="btn-icon" @click="removerEndereco(end.id)" title="Excluir">
                                <Trash2 :size="18" color="#dc2626" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <BottomNav :endereco-definido="!!perfil.enderecos.length" />
    </div>
</template>

<style scoped>
.perfil-page { min-height: 100vh; background: #ffffff; display: flex; flex-direction: column; padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); }
.conteudo { flex: 1; padding: 16px; max-width: 600px; margin: 0 auto; width: 100%; box-sizing: border-box; }

.topo { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
.topo h1 { font-size: 22px; margin: 0; color: #1a1a1a; }
.btn-voltar { background: #fff; border: 1px solid #eee; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }

.card-secao { background: #fff; padding: 16px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin-bottom: 16px; }
.card-secao h2 { font-size: 16px; margin: 0 0 16px 0; color: #1a1a1a; display: flex; align-items: center; gap: 8px; }

.header-secao { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.header-secao h2 { margin: 0; }
.btn-add-endereco { display: flex; align-items: center; gap: 4px; background: #fef2f2; color: #dc2626; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; }

/* ✅ CORREÇÃO: Inputs flexíveis e protegidos */
.input-group { margin-bottom: 12px; display: flex; flex-direction: column; width: 100%; }
.input-group label { font-size: 12px; font-weight: 600; color: #555; margin-bottom: 4px; }
.input-group input { padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; background: #fafafa; outline: none; width: 100%; box-sizing: border-box; }
.input-group input:focus { border-color: #dc2626; background: #fff; }

/* ✅ CORREÇÃO: Formulário responsivo */
.row-inputs { display: flex; gap: 12px; margin-bottom: 0; flex-wrap: wrap; width: 100%; }
.row-inputs .input-group { margin-bottom: 12px; flex: 1; min-width: 120px; }
.row-inputs .flex-2 { flex: 2; min-width: 160px; }
.row-inputs .flex-1 { flex: 1; min-width: 80px; }

.btn-salvar { width: 100%; background: #1a1a1a; color: #fff; border: none; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; margin-top: 8px; transition: background 0.2s; }
.btn-salvar:hover { background: #333; }

.form-novo-endereco { background: #f9f9f9; padding: 16px; border-radius: 12px; margin-bottom: 16px; border: 1px dashed #ddd; box-sizing: border-box; }

.lista-enderecos { display: flex; flex-direction: column; gap: 12px; }
.card-endereco { display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid #eee; border-radius: 12px; }
.card-endereco.principal { border-color: #16a34a; background: #f0fdf4; }
.info-end { display: flex; flex-direction: column; word-break: break-word; }
.info-end strong { font-size: 14px; color: #333; }
.info-end span { font-size: 12px; color: #777; }
.acoes-end { display: flex; gap: 8px; flex-shrink: 0; }
.btn-icon { background: transparent; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; }

.vazio-enderecos { text-align: center; color: #777; font-size: 14px; padding: 20px; }
</style>
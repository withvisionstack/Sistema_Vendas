import { ref, computed, watch } from 'vue';

const CONFIG_PADRAO = {
    nome: 'Hamburgueria',
    logo: '🍔',
    capas: [], // ✅ Agora é uma lista de imagens
    cnpj: '',
    chavePix: '',
    nomeBeneficiario: '',
    cidadeBeneficiario: '',
    aberto: true,
    horarioAbertura: '18:00',
    horarioFechamento: '23:59',
    emailContato: 'privacidade@hamburgueria.com.br',
    cidadeSede: 'Apucarana/PR',
    nomeDPO: 'Nome do responsável',
    emailDPO: 'dpo@hamburgueria.com.br',
    coordenadas: {
        lat: -23.5507,
        lng: -51.4607
    }
};

const carregarConfiguracao = () => {
    try {
        const salvo = localStorage.getItem('@delivery:loja');
        if (salvo) {
            const parsed = JSON.parse(salvo);
            // ✅ Se já existir mas não tiver coordenadas, adiciona o padrão
            if (!parsed.coordenadas) {
                parsed.coordenadas = CONFIG_PADRAO.coordenadas;
            }
            // ... resto da lógica de capas antigas
            if (parsed.capaUrl && (!parsed.capas || parsed.capas.length === 0)) {
                parsed.capas = [parsed.capaUrl];
                delete parsed.capaUrl;
            }
            return { ...CONFIG_PADRAO, ...parsed };
        }
    } catch (e) { console.error(e); }
    return CONFIG_PADRAO;
};

const configLoja = ref(carregarConfiguracao());
const agora = ref(new Date());
setInterval(() => { agora.value = new Date(); }, 30000);

export function useLoja() {
    watch(configLoja, (novo) => {
        try { localStorage.setItem('@delivery:loja', JSON.stringify(novo)); }
        catch (e) { alert("Imagem muito grande para salvar."); }
    }, { deep: true });

    const lojaEstaAberta = computed(() => {
        if (!configLoja.value.aberto) return false;
        const horaAtual = agora.value.getHours() * 60 + agora.value.getMinutes();
        const [hAberta, mAberta] = configLoja.value.horarioAbertura.split(':').map(Number);
        const [hFecha, mFecha] = configLoja.value.horarioFechamento.split(':').map(Number);
        const minutosAbertura = hAberta * 60 + mAberta;
        const minutosFechamento = hFecha * 60 + mFecha;

        if (minutosAbertura <= minutosFechamento) {
            return horaAtual >= minutosAbertura && horaAtual <= minutosFechamento;
        } else {
            return horaAtual >= minutosAbertura || horaAtual <= minutosFechamento;
        }
    });

    const salvarConfiguracoes = (dados) => {
        configLoja.value = { ...configLoja.value, ...dados };
        agora.value = new Date();
        window.dispatchEvent(new Event('loja-atualizada'));
    };

    return { configLoja, lojaEstaAberta, salvarConfiguracoes };
}
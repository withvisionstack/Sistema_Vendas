// src/composables/usePerfil.js
import { ref, computed, watch } from 'vue';

const perfil = ref(JSON.parse(localStorage.getItem('@delivery:perfil')) || {
    nome: '',
    whatsapp: '',
    enderecos: [],
    enderecoPrincipalId: null
});

export function usePerfil() {
    watch(perfil, (novo) => {
        localStorage.setItem('@delivery:perfil', JSON.stringify(novo));
    }, { deep: true });

    // Pega o endereço que está marcado como principal
    const enderecoPrincipal = computed(() => {
        if (!perfil.value.enderecoPrincipalId) return null;
        return perfil.value.enderecos.find(e => e.id === perfil.value.enderecoPrincipalId) || null;
    });

    const salvarDadosPessoais = (nome, whatsapp) => {
        perfil.value.nome = nome;
        perfil.value.whatsapp = whatsapp;
    };

    const adicionarEndereco = (endereco) => {
        const novoEndereco = { ...endereco, id: Date.now().toString() };
        perfil.value.enderecos.push(novoEndereco);

        // Se for o primeiro endereço, já define como principal
        if (perfil.value.enderecos.length === 1) {
            perfil.value.enderecoPrincipalId = novoEndereco.id;
        }
    };

    const removerEndereco = (id) => {
        perfil.value.enderecos = perfil.value.enderecos.filter(e => e.id !== id);
        if (perfil.value.enderecoPrincipalId === id) {
            perfil.value.enderecoPrincipalId = perfil.value.enderecos[0]?.id || null;
        }
    };

    const definirPrincipal = (id) => {
        perfil.value.enderecoPrincipalId = id;
    };

    return {
        perfil,
        enderecoPrincipal,
        salvarDadosPessoais,
        adicionarEndereco,
        removerEndereco,
        definirPrincipal
    };
}
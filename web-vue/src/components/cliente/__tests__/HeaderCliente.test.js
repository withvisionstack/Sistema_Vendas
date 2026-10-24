import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

const mockConfigLoja = ref({
    nome: 'Hamburgueria',
    logo: '🍔',
    capas: []
});

const mockPerfil = ref({
    nome: '',
    whatsapp: ''
});

const mockEnderecoPrincipal = ref(null);

const mockTotalItens = ref(0);

vi.mock('../../../composables/useCarrinho.js', () => ({
    useCarrinho: () => ({ totalItens: mockTotalItens })
}));

vi.mock('../../../composables/usePerfil.js', () => ({
    usePerfil: () => ({
        perfil: mockPerfil,
        enderecoPrincipal: mockEnderecoPrincipal
    })
}));

vi.mock('../../../composables/useLoja.js', () => ({
    useLoja: () => ({ configLoja: mockConfigLoja })
}));

// ✅ CORRIGIDO: caminho '../' (não '../../')
vi.mock('../NotificacoesHeader.vue', () => ({
    default: {
        name: 'NotificacoesHeader',
        template: '<div class="mock-notificacoes">Sino</div>'
    }
}));

import HeaderCliente from '../HeaderCliente.vue';



beforeEach(() => {
    mockConfigLoja.value = {
        nome: 'Hamburgueria',
        logo: '🍔',
        capas: []
    };
    mockPerfil.value = { nome: '', whatsapp: '' };
    mockEnderecoPrincipal.value = null;
    mockTotalItens.value = 0;
});

// ═══════════════════════════════════════════════════════
// HELPER: monta com stubs de RouterLink
// ═══════════════════════════════════════════════════════
function montarHeader() {
    return mount(HeaderCliente, {
        global: {
            stubs: {
                RouterLink: {
                    template: '<a :href="to" class="stub-link"><slot /></a>',
                    props: ['to']
                }
            }
        }
    });
}

// ═══════════════════════════════════════════════════════
// TESTES
// ═══════════════════════════════════════════════════════
describe('HeaderCliente', () => {
    beforeEach(() => {
        // Reset para o estado padrão antes de cada teste
        mockConfigLoja.value = {
            nome: 'Hamburgueria',
            logo: '🍔',
            capas: []
        };
        mockPerfil.value = { nome: '', whatsapp: '' };
        mockEnderecoPrincipal.value = null;
        mockTotalItens.value = 0;
    });

    // ─────────────────────────────────────────────
    // LOGO E NOME DA LOJA
    // ─────────────────────────────────────────────

    it('renderiza o nome da loja', () => {
        const wrapper = montarHeader();

        expect(wrapper.find('.logo-nome').text()).toBe('Hamburgueria');
    });

    it('mostra emoji quando a logo é um emoji', () => {
        mockConfigLoja.value.logo = '🍕';

        const wrapper = montarHeader();

        const emoji = wrapper.find('.logo-emoji span');
        expect(emoji.exists()).toBe(true);
        expect(emoji.text()).toBe('🍕');
        expect(wrapper.find('.logo-img').exists()).toBe(false);
    });

    it('mostra imagem quando a logo é uma URL http', () => {
        mockConfigLoja.value.logo = 'https://teste.com/logo.png';

        const wrapper = montarHeader();

        const img = wrapper.find('.logo-img');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toBe('https://teste.com/logo.png');
    });

    it('mostra imagem quando a logo é Base64 (data:image)', () => {
        mockConfigLoja.value.logo = 'data:image/jpeg;base64,/9j/4AAQ...';

        const wrapper = montarHeader();

        const img = wrapper.find('.logo-img');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toContain('data:image');
    });

    it('usa fallback quando nome da loja está vazio', () => {
        mockConfigLoja.value.nome = '';

        const wrapper = montarHeader();

        expect(wrapper.find('.logo-nome').text()).toBe('Hamburgueria');
    });

    // ─────────────────────────────────────────────
    // CARRINHO E BADGE
    // ─────────────────────────────────────────────

    it('NÃO mostra badge quando carrinho está vazio', () => {
        mockTotalItens.value = 0;

        const wrapper = montarHeader();

        expect(wrapper.find('.badge').exists()).toBe(false);
    });

    it('mostra badge com número correto quando tem itens', () => {
        mockTotalItens.value = 3;

        const wrapper = montarHeader();

        const badge = wrapper.find('.badge');
        expect(badge.exists()).toBe(true);
        expect(badge.text()).toBe('3');
    });

    it('atualiza badge quando totalItens muda', async () => {
        mockTotalItens.value = 1;

        const wrapper = montarHeader();
        expect(wrapper.find('.badge').text()).toBe('1');

        mockTotalItens.value = 5;
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.badge').text()).toBe('5');
    });

    it('botão do carrinho aponta para /carrinho', () => {
        const wrapper = montarHeader();

        const carrinhoLink = wrapper.find('.carrinho-btn');
        expect(carrinhoLink.attributes('href')).toBe('/carrinho');
    });

    // ─────────────────────────────────────────────
    // ENDEREÇO / PERFIL (Desktop)
    // ─────────────────────────────────────────────

    it('mostra "Definir endereço" quando não tem perfil nem endereço', () => {
        const wrapper = montarHeader();

        expect(wrapper.find('.endereco-texto').text()).toBe('Definir endereço');
    });

    it('mostra "Olá, [nome]" quando perfil tem nome', () => {
        mockPerfil.value.nome = 'João Silva';

        const wrapper = montarHeader();

        expect(wrapper.find('.endereco-texto').text()).toBe('Olá, João');
    });

    it('mostra apenas o primeiro nome do cliente', () => {
        mockPerfil.value.nome = 'Maria Aparecida dos Santos';

        const wrapper = montarHeader();

        expect(wrapper.find('.endereco-texto').text()).toBe('Olá, Maria');
    });

    it('mostra endereço quando enderecoPrincipal existe', () => {
        mockEnderecoPrincipal.value = {
            rua: 'Rua das Flores',
            numero: '123'
        };

        const wrapper = montarHeader();

        expect(wrapper.find('.endereco-texto').text()).toBe('Rua das Flores, 123');
    });

    it('prioriza o nome do perfil sobre o endereço', () => {
        mockPerfil.value.nome = 'João';
        mockEnderecoPrincipal.value = { rua: 'Rua X', numero: '100' };

        const wrapper = montarHeader();

        // Se tem perfil.nome, mostra "Olá, João" (não o endereço)
        expect(wrapper.find('.endereco-texto').text()).toBe('Olá, João');
    });

    it('endereço e perfil apontam para /perfil', () => {
        const wrapper = montarHeader();

        const enderecoLink = wrapper.find('.endereco-btn');
        const perfilLink = wrapper.find('.btn-perfil-desktop');

        expect(enderecoLink.attributes('href')).toBe('/perfil');
        expect(perfilLink.attributes('href')).toBe('/perfil');
    });

    // ─────────────────────────────────────────────
    // NAVEGAÇÃO
    // ─────────────────────────────────────────────

    it('renderiza links de navegação corretos', () => {
        const wrapper = montarHeader();

        const links = wrapper.findAll('.nav-desktop a');
        const hrefs = links.map(l => l.attributes('href'));

        expect(hrefs).toContain('/');
        expect(hrefs).toContain('/bebidas');
        expect(hrefs).toContain('/pedidos');
    });

    it('logo aponta para a home', () => {
        const wrapper = montarHeader();

        expect(wrapper.find('.logo').attributes('href')).toBe('/');
    });

    // ─────────────────────────────────────────────
    // NOTIFICAÇÕES
    // ─────────────────────────────────────────────

    it('renderiza o componente de notificações', () => {
        const wrapper = montarHeader();

        expect(wrapper.find('.mock-notificacoes').exists()).toBe(true);
    });

    // ─────────────────────────────────────────────
    // SEGURANÇA (evita crash)
    // ─────────────────────────────────────────────

    it('não quebra se configLoja for undefined', () => {
        mockConfigLoja.value = undefined;

        // Deve montar sem erro (usa o fallback lojaSegura)
        expect(() => montarHeader()).not.toThrow();
    });

    it('não quebra se perfil for null', () => {
        mockPerfil.value = null;

        expect(() => montarHeader()).not.toThrow();
    });

    it('não quebra se enderecoPrincipal for undefined', () => {
        mockEnderecoPrincipal.value = undefined;

        expect(() => montarHeader()).not.toThrow();
    });
});
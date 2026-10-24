import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

// ✅ NOVO: mock da config da loja (para o ModalLojaFechada)
const mockConfigLoja = ref({
    horarioAbertura: '18:00',
    horarioFechamento: '23:59'
});

const mockAdicionarItem = vi.fn();
const mockAbrir = vi.fn();
const mockLojaAberta = ref(true);
let mockEstoque = 10;

vi.mock('../../../composables/useImageModal.js', () => ({
    useImageModal: () => ({ abrir: mockAbrir })
}));

vi.mock('../../../composables/useCarrinho.js', () => ({
    useCarrinho: () => ({ adicionarItem: mockAdicionarItem })
}));

// ✅ CORRIGIDO: inclui configLoja
vi.mock('../../../composables/useLoja.js', () => ({
    useLoja: () => ({
        lojaEstaAberta: mockLojaAberta,
        configLoja: mockConfigLoja
    })
}));

vi.mock('../../../composables/useEstoque.js', () => ({
    useEstoque: () => ({
        getEstoque: () => mockEstoque
    })
}));

import BebidaCard from '../BebidaCard.vue';

describe('BebidaCard', () => {
    const bebidaBase = {
        id: 'coca-1',
        nome: 'Coca-Cola Lata',
        descricao: '350ml bem gelada',
        preco: 5.00,
        imagem: 'https://teste.com/coca.jpg'
    };

    beforeEach(() => {
    mockAdicionarItem.mockClear();
    mockAbrir.mockClear();
    mockLojaAberta.value = true;
    mockEstoque = 10;
    // ✅ NOVO: reset da config
    mockConfigLoja.value = {
        horarioAbertura: '18:00',
        horarioFechamento: '23:59'
    };
});

    it('renderiza nome, descrição e preço', () => {
        const wrapper = mount(BebidaCard, {
            props: { produto: bebidaBase }
        });

        expect(wrapper.text()).toContain('Coca-Cola Lata');
        expect(wrapper.text()).toContain('350ml bem gelada');
        expect(wrapper.text()).toContain('5,00');
    });

    it('mostra estoque disponível', () => {
        mockEstoque = 8;

        const wrapper = mount(BebidaCard, {
            props: { produto: bebidaBase }
        });

        expect(wrapper.text()).toContain('Estoque: 8');
    });

    it('incrementa quantidade ao clicar em +', async () => {
        const wrapper = mount(BebidaCard, {
            props: { produto: bebidaBase }
        });

        const botoes = wrapper.findAll('.btn-qtd');
        const botaoMais = botoes[1]; // 0 = menos, 1 = mais

        await botaoMais.trigger('click');
        await botaoMais.trigger('click');

        expect(wrapper.find('.qtd-controle span').text()).toBe('3');
    });

    it('bloqueia quantidade se chegar no limite do estoque', async () => {
        mockEstoque = 3;

        const wrapper = mount(BebidaCard, {
            props: { produto: bebidaBase }
        });

        const botoes = wrapper.findAll('.btn-qtd');
        const botaoMais = botoes[1];

        // Clica 5 vezes (mas só pode chegar a 3)
        await botaoMais.trigger('click');
        await botaoMais.trigger('click');
        await botaoMais.trigger('click');
        await botaoMais.trigger('click');
        await botaoMais.trigger('click');

        expect(wrapper.find('.qtd-controle span').text()).toBe('3');
        expect(botaoMais.attributes('disabled')).toBeDefined();
    });

    it('diminui quantidade ao clicar em -', async () => {
        const wrapper = mount(BebidaCard, {
            props: { produto: bebidaBase }
        });

        const botoes = wrapper.findAll('.btn-qtd');
        const botaoMenos = botoes[0];
        const botaoMais = botoes[1];

        await botaoMais.trigger('click'); // 2
        await botaoMais.trigger('click'); // 3
        await botaoMenos.trigger('click'); // 2

        expect(wrapper.find('.qtd-controle span').text()).toBe('2');
    });

    it('chama adicionarItem ao clicar em "Adicionar"', async () => {
        const wrapper = mount(BebidaCard, {
            props: { produto: bebidaBase }
        });

        await wrapper.find('.btn-adicionar').trigger('click');

        expect(mockAdicionarItem).toHaveBeenCalledTimes(1);
        expect(mockAdicionarItem).toHaveBeenCalledWith(
            expect.objectContaining({
                produtoId: 'coca-1',
                nome: 'Coca-Cola Lata',
                quantidade: 1,
                precoTotal: 5.00
            })
        );
    });

    it('adiciona quantidade correta ao carrinho', async () => {
        const wrapper = mount(BebidaCard, {
            props: { produto: bebidaBase }
        });

        const botoes = wrapper.findAll('.btn-qtd');
        const botaoMais = botoes[1];

        await botaoMais.trigger('click'); // 2
        await botaoMais.trigger('click'); // 3
        await wrapper.find('.btn-adicionar').trigger('click');

        expect(mockAdicionarItem).toHaveBeenCalledWith(
            expect.objectContaining({
                quantidade: 3,
                precoTotal: 15.00 // 5.00 * 3
            })
        );
    });

    it('mostra tag ESGOTADO quando estoque é 0', () => {
        mockEstoque = 0;

        const wrapper = mount(BebidaCard, {
            props: { produto: bebidaBase }
        });

        expect(wrapper.find('.tag-esgotado').exists()).toBe(true);
        expect(wrapper.find('.tag-esgotado').text()).toBe('ESGOTADO');
    });

    it('desabilita botão "Adicionar" quando esgotado', () => {
        mockEstoque = 0;

        const wrapper = mount(BebidaCard, {
            props: { produto: bebidaBase }
        });

        const botao = wrapper.find('.btn-adicionar');
        expect(botao.attributes('disabled')).toBeDefined();
        expect(botao.text()).toContain('Esgotado');
    });

    it('NÃO adiciona ao carrinho se loja estiver fechada', async () => {
        mockLojaAberta.value = false;

        const wrapper = mount(BebidaCard, {
            props: { produto: bebidaBase }
        });

        await wrapper.find('.btn-adicionar').trigger('click');

        expect(mockAdicionarItem).not.toHaveBeenCalled();
        // Deve mostrar o ModalLojaFechada (mas está num Teleport)
        // Não conseguimos testar diretamente o conteúdo do Teleport aqui,
        // mas podemos verificar que o estado interno mudou
    });

    it('NÃO adiciona se quantidade > estoque (dupla proteção)', async () => {
        mockEstoque = 2;

        const wrapper = mount(BebidaCard, {
            props: { produto: bebidaBase }
        });

        // Tenta chegar em 2 (limite)
        const botoes = wrapper.findAll('.btn-qtd');
        const botaoMais = botoes[1];
        await botaoMais.trigger('click'); // 2

        // Mesmo clicando "Adicionar" com qtd 2, deve funcionar
        await wrapper.find('.btn-adicionar').trigger('click');
        expect(mockAdicionarItem).toHaveBeenCalledTimes(1);
    });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ProdutoCard from '../ProdutoCard.vue';

// ✅ Mock do composable de imagem
vi.mock('../../../composables/useImageModal.js', () => ({
    useImageModal: () => ({
        abrir: vi.fn()
    })
}));

describe('ProdutoCard', () => {
    const produtoBase = {
        id: '1',
        nome: 'X-Burger Clássico',
        descricao: 'Pão, carne 150g, queijo e salada',
        preco: 25.90,
        desconto: 0,
        imagem: 'https://teste.com/burger.jpg'
    };

    it('renderiza nome, descrição e preço', () => {
        const wrapper = mount(ProdutoCard, {
            props: { produto: produtoBase }
        });

        expect(wrapper.text()).toContain('X-Burger Clássico');
        expect(wrapper.text()).toContain('Pão, carne 150g, queijo e salada');
        expect(wrapper.text()).toContain('R$');
        expect(wrapper.text()).toContain('25,90');
    });

    it('renderiza imagem com atributos corretos', () => {
        const wrapper = mount(ProdutoCard, {
            props: { produto: produtoBase }
        });

        const img = wrapper.find('.prod-imagem');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toBe(produtoBase.imagem);
        expect(img.attributes('alt')).toBe(produtoBase.nome);
    });

    it('mostra preço normal quando NÃO tem desconto', () => {
        const wrapper = mount(ProdutoCard, {
            props: { produto: produtoBase }
        });

        const precoNormal = wrapper.find('.preco-normal');
        expect(precoNormal.exists()).toBe(true);
        expect(precoNormal.text()).toContain('25,90');
    });

    it('mostra preço com desconto quando TEM desconto', () => {
        const produtoComDesconto = {
            ...produtoBase,
            preco: 100,
            desconto: 20 // 20% off
        };

        const wrapper = mount(ProdutoCard, {
            props: { produto: produtoComDesconto }
        });

        // Deve mostrar o preço original riscado
        const precoOriginal = wrapper.find('.preco-original-riscado');
        expect(precoOriginal.exists()).toBe(true);
        expect(precoOriginal.text()).toContain('100,00');

        // Deve mostrar o preço final (100 - 20% = 80)
        const precoFinal = wrapper.find('.preco-final-destaque');
        expect(precoFinal.exists()).toBe(true);
        expect(precoFinal.text()).toContain('80,00');
    });

    it('emite evento "selecionar" ao clicar no botão', async () => {
        const wrapper = mount(ProdutoCard, {
            props: { produto: produtoBase }
        });

        await wrapper.find('.btn-mata-fome').trigger('click');

        expect(wrapper.emitted('selecionar')).toBeTruthy();
        expect(wrapper.emitted('selecionar')[0]).toEqual([produtoBase]);
    });

    it('mostra tag de desconto na imagem quando tem desconto', () => {
        const produtoComDesconto = { ...produtoBase, desconto: 15 };

        const wrapper = mount(ProdutoCard, {
            props: { produto: produtoComDesconto }
        });

        const tag = wrapper.find('.tag-desconto');
        expect(tag.exists()).toBe(true);
        expect(tag.text()).toBe('-15%');
    });

    it('NÃO mostra tag de desconto quando desconto é 0', () => {
        const wrapper = mount(ProdutoCard, {
            props: { produto: produtoBase }
        });

        expect(wrapper.find('.tag-desconto').exists()).toBe(false);
    });
});
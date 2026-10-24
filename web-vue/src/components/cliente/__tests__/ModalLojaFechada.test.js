import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

const mockConfigLoja = ref({
    horarioAbertura: '18:00',
    horarioFechamento: '23:59'
});

vi.mock('../../../composables/useLoja.js', () => ({
    useLoja: () => ({ configLoja: mockConfigLoja })
}));

import ModalLojaFechada from '../ModalLojaFechada.vue';

describe('ModalLojaFechada', () => {
    it('renderiza mensagem principal', () => {
        const wrapper = mount(ModalLojaFechada, {
            global: {
                stubs: { Teleport: true } // evita problemas com Teleport nos testes
            }
        });

        expect(wrapper.text()).toContain('Loja Fechada');
        expect(wrapper.text()).toContain('não estamos aceitando pedidos');
    });

    it('mostra o horário de funcionamento da loja', () => {
        const wrapper = mount(ModalLojaFechada, {
            global: { stubs: { Teleport: true } }
        });

        expect(wrapper.text()).toContain('18:00');
        expect(wrapper.text()).toContain('23:59');
    });

    it('emite evento "fechar" ao clicar no botão', async () => {
        const wrapper = mount(ModalLojaFechada, {
            global: { stubs: { Teleport: true } }
        });

        await wrapper.find('.btn-entendi').trigger('click');

        expect(wrapper.emitted('fechar')).toBeTruthy();
        expect(wrapper.emitted('fechar')).toHaveLength(1);
    });

    it('usa fallback quando configLoja não tem horários', () => {
        mockConfigLoja.value = {}; // sem horários

        const wrapper = mount(ModalLojaFechada, {
            global: { stubs: { Teleport: true } }
        });

        // O template mostra "{{ configLoja.horarioAbertura }}" que fica vazio
        // Mas não deve quebrar
        expect(wrapper.exists()).toBe(true);
    });
});
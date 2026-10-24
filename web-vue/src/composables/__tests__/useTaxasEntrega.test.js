import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('useTaxasEntrega', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.resetModules();
    });

    it('obtém taxa de bairro cadastrado', async () => {
        const { useTaxasEntrega } = await import('../useTaxasEntrega.js');
        const { salvarTaxa, obterTaxaPorBairro } = useTaxasEntrega();

        salvarTaxa('Centro', 5.00);

        expect(obterTaxaPorBairro('Centro')).toBe(5.00);
    });

    it('retorna 0 para bairro não cadastrado', async () => {
        const { useTaxasEntrega } = await import('../useTaxasEntrega.js');
        const { obterTaxaPorBairro } = useTaxasEntrega();

        expect(obterTaxaPorBairro('Bairro Inexistente')).toBe(0);
    });

    it('ignora maiúsculas/minúsculas no nome do bairro', async () => {
        const { useTaxasEntrega } = await import('../useTaxasEntrega.js');
        const { salvarTaxa, obterTaxaPorBairro } = useTaxasEntrega();

        salvarTaxa('Centro', 5.00);

        expect(obterTaxaPorBairro('centro')).toBe(5.00);
        expect(obterTaxaPorBairro('CENTRO')).toBe(5.00);
    });

    it('atualiza taxa de bairro já existente', async () => {
        const { useTaxasEntrega } = await import('../useTaxasEntrega.js');
        const { salvarTaxa, obterTaxaPorBairro } = useTaxasEntrega();

        salvarTaxa('Centro', 5.00);
        salvarTaxa('Centro', 8.00); // atualiza

        expect(obterTaxaPorBairro('Centro')).toBe(8.00);
    });

    it('permite taxa gratuita (R$ 0,00)', async () => {
        const { useTaxasEntrega } = await import('../useTaxasEntrega.js');
        const { salvarTaxa, obterTaxaPorBairro } = useTaxasEntrega();

        salvarTaxa('Zona Sul', 0);

        expect(obterTaxaPorBairro('Zona Sul')).toBe(0);
    });

    it('remove taxa de bairro', async () => {
        const { useTaxasEntrega } = await import('../useTaxasEntrega.js');
        const { salvarTaxa, removerTaxa, obterTaxaPorBairro } = useTaxasEntrega();

        salvarTaxa('Centro', 5.00);
        removerTaxa('Centro');

        expect(obterTaxaPorBairro('Centro')).toBe(0);
    });
});
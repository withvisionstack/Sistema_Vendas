import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('useLoja - Horários de funcionamento', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
        vi.resetModules();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // ─────────────────────────────────────────────
    // Horário normal (08:00 - 18:00)
    // ─────────────────────────────────────────────

    it('loja FECHADA antes da abertura (normal)', async () => {
        vi.setSystemTime(new Date('2026-01-15T07:00:00'));
        localStorage.setItem('@delivery:loja', JSON.stringify({
            aberto: true,
            horarioAbertura: '08:00',
            horarioFechamento: '18:00'
        }));

        const { useLoja } = await import('../useLoja.js');
        const { lojaEstaAberta } = useLoja();

        expect(lojaEstaAberta.value).toBe(false);
    });

    it('loja ABERTA dentro do horário (normal)', async () => {
        vi.setSystemTime(new Date('2026-01-15T12:00:00'));
        localStorage.setItem('@delivery:loja', JSON.stringify({
            aberto: true,
            horarioAbertura: '08:00',
            horarioFechamento: '18:00'
        }));

        const { useLoja } = await import('../useLoja.js');
        const { lojaEstaAberta } = useLoja();

        expect(lojaEstaAberta.value).toBe(true);
    });

    it('loja FECHADA depois do fechamento (normal)', async () => {
        vi.setSystemTime(new Date('2026-01-15T20:00:00'));
        localStorage.setItem('@delivery:loja', JSON.stringify({
            aberto: true,
            horarioAbertura: '08:00',
            horarioFechamento: '18:00'
        }));

        const { useLoja } = await import('../useLoja.js');
        const { lojaEstaAberta } = useLoja();

        expect(lojaEstaAberta.value).toBe(false);
    });

    // ─────────────────────────────────────────────
    // Horário que VIRA A MADRUGADA (18:00 - 02:00)
    // ─────────────────────────────────────────────

    it('loja ABERTA às 20h (horário vira madrugada)', async () => {
        vi.setSystemTime(new Date('2026-01-15T20:00:00'));
        localStorage.setItem('@delivery:loja', JSON.stringify({
            aberto: true,
            horarioAbertura: '18:00',
            horarioFechamento: '02:00'
        }));

        const { useLoja } = await import('../useLoja.js');
        const { lojaEstaAberta } = useLoja();

        expect(lojaEstaAberta.value).toBe(true);
    });

    it('loja ABERTA à 01h da manhã (horário vira madrugada)', async () => {
        vi.setSystemTime(new Date('2026-01-16T01:00:00'));
        localStorage.setItem('@delivery:loja', JSON.stringify({
            aberto: true,
            horarioAbertura: '18:00',
            horarioFechamento: '02:00'
        }));

        const { useLoja } = await import('../useLoja.js');
        const { lojaEstaAberta } = useLoja();

        expect(lojaEstaAberta.value).toBe(true);
    });

    it('loja FECHADA às 15h (fora do horário madrugada)', async () => {
        vi.setSystemTime(new Date('2026-01-15T15:00:00'));
        localStorage.setItem('@delivery:loja', JSON.stringify({
            aberto: true,
            horarioAbertura: '18:00',
            horarioFechamento: '02:00'
        }));

        const { useLoja } = await import('../useLoja.js');
        const { lojaEstaAberta } = useLoja();

        expect(lojaEstaAberta.value).toBe(false);
    });

    it('loja FECHADA às 03h (depois do fechamento)', async () => {
        vi.setSystemTime(new Date('2026-01-16T03:00:00'));
        localStorage.setItem('@delivery:loja', JSON.stringify({
            aberto: true,
            horarioAbertura: '18:00',
            horarioFechamento: '02:00'
        }));

        const { useLoja } = await import('../useLoja.js');
        const { lojaEstaAberta } = useLoja();

        expect(lojaEstaAberta.value).toBe(false);
    });

    // ─────────────────────────────────────────────
    // Botão manual (aberto = false)
    // ─────────────────────────────────────────────

    it('botão manual desligado fecha a loja mesmo em horário', async () => {
        vi.setSystemTime(new Date('2026-01-15T12:00:00'));
        localStorage.setItem('@delivery:loja', JSON.stringify({
            aberto: false,  // ← manualmente fechada
            horarioAbertura: '08:00',
            horarioFechamento: '18:00'
        }));

        const { useLoja } = await import('../useLoja.js');
        const { lojaEstaAberta } = useLoja();

        expect(lojaEstaAberta.value).toBe(false);
    });
});
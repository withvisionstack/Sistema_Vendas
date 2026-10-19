import { describe, it, expect } from 'vitest';
import { haversine, calcularBearing } from '../geo.js';

describe('haversine', () => {
    it('retorna 0 para o mesmo ponto', () => {
        expect(haversine(-23.55, -51.46, -23.55, -51.46)).toBe(0);
    });

    it('calcula distância de ~1km para leste', () => {
        // Apucarana: 1km a leste aproximadamente = +0.011 em longitude
        const d = haversine(-23.55, -51.46, -23.55, -51.449);
        expect(d).toBeGreaterThan(1000);
        expect(d).toBeLessThan(1200);
    });

    it('calcula distância de ~1km para norte', () => {
        const d = haversine(-23.55, -51.46, -23.541, -51.46);
        expect(d).toBeGreaterThan(950);
        expect(d).toBeLessThan(1050);
    });

    it('é simétrico (A→B = B→A)', () => {
        const d1 = haversine(-23.55, -51.46, -23.54, -51.45);
        const d2 = haversine(-23.54, -51.45, -23.55, -51.46);
        expect(Math.abs(d1 - d2)).toBeLessThan(1); // margem de 1 metro
    });
});

describe('calcularBearing', () => {
    it('retorna ~0 (norte) para ponto ao norte', () => {
        const b = calcularBearing(-23.55, -51.46, -23.54, -51.46);
        expect(b).toBeCloseTo(0, 0);
    });

    it('retorna ~90 (leste) para ponto a leste', () => {
        const b = calcularBearing(-23.55, -51.46, -23.55, -51.45);
        expect(b).toBeCloseTo(90, 0);
    });

    it('retorna ~180 (sul) para ponto ao sul', () => {
        const b = calcularBearing(-23.55, -51.46, -23.56, -51.46);
        expect(b).toBeCloseTo(180, 0);
    });

    it('retorna ~270 (oeste) para ponto a oeste', () => {
        const b = calcularBearing(-23.55, -51.46, -23.55, -51.47);
        expect(b).toBeCloseTo(270, 0);
    });

    it('sempre retorna valor entre 0 e 360', () => {
        const pontos = [
            [-23.55, -51.46, -23.54, -51.45],
            [-23.55, -51.46, -23.56, -51.47],
            [-23.55, -51.46, -23.54, -51.47],
            [-23.55, -51.46, -23.56, -51.45],
        ];
        pontos.forEach(([a, b, c, d]) => {
            const bearing = calcularBearing(a, b, c, d);
            expect(bearing).toBeGreaterThanOrEqual(0);
            expect(bearing).toBeLessThan(360);
        });
    });
});
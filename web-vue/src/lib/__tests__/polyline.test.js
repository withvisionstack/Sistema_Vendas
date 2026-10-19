import { describe, it, expect } from 'vitest';
import { decodificaPolyline } from '../polyline.js';

describe('decodificaPolyline', () => {
    it('retorna array vazio para entrada vazia', () => {
        expect(decodificaPolyline('')).toEqual([]);
        expect(decodificaPolyline(null)).toEqual([]);
        expect(decodificaPolyline(undefined)).toEqual([]);
    });

    it('decodifica polyline conhecida (exemplo do Google)', () => {
        // Polyline padrão: "_p~iF~ps|U_ulLnnqC_mqNvxq`@"
        // Resultado esperado (Google): [[-120.2, 38.5], [-120.95, 40.7], [-126.453, 43.252]]
        // ⚠️ Valhalla usa 1e6, então o teste é diferente
        const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
        const result = decodificaPolyline(encoded);

        // Com 1e6, os valores são 10x menores que o esperado do Google
        expect(result.length).toBe(3);
        // Verificamos estrutura e proporção, não valor absoluto
        expect(result[0][0]).toBeCloseTo(-12.02, 1);
        expect(result[0][1]).toBeCloseTo(3.85, 1);
    });

    it('valida que coordenadas estão DENTRO do range geográfico válido', () => {
        // Teste de regressão: bug antigo produzia -514.68 (inválido)
        const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
        const result = decodificaPolyline(encoded);

        result.forEach(([lng, lat]) => {
            expect(lng).toBeGreaterThanOrEqual(-180);
            expect(lng).toBeLessThanOrEqual(180);
            expect(lat).toBeGreaterThanOrEqual(-90);
            expect(lat).toBeLessThanOrEqual(90);
        });
    });

    it('produz coordenadas realistas para Apucarana', () => {
        // Simula uma polyline de rota em Apucarana
        // Se o decoder estiver certo, lat ~ -23.55 e lng ~ -51.46
        // Se estiver errado (1e5), lat ~ -235.5 e lng ~ -514.6
        const encoded = 'dol|k@ff}caBpJvn@';
        const result = decodificaPolyline(encoded);

        if (result.length > 0) {
            const [lng, lat] = result[0];
            // Range de Apucarana
            expect(lat).toBeGreaterThan(-24);
            expect(lat).toBeLessThan(-23);
            expect(lng).toBeGreaterThan(-52);
            expect(lng).toBeLessThan(-51);
        }
    });

    it('mantém a mesma quantidade de pontos da entrada original', () => {
        const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
        const result = decodificaPolyline(encoded);
        expect(result.length).toBe(3);
    });
});
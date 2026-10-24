import { test, expect } from '@playwright/test';
import { limparStorage, fazerPedidoCliente } from './helpers.js';

const BASE_URL = 'http://localhost:5173';

test.describe('Fluxo do Cliente', () => {

    test.beforeEach(async ({ page }) => {
        await limparStorage(page);
    });

    test('Cliente consegue ver o cardápio', async ({ page }) => {
        await page.goto(BASE_URL);

        await expect(
            page.locator('h1:has-text("Olá! O que você quer comer hoje?")')
        ).toBeVisible({ timeout: 5000 });

        await expect(page.locator('h2:has-text("Lanches")')).toBeVisible();
        await expect(page.locator('h2:has-text("Porções")')).toBeVisible();
    });

    test('Cliente consegue adicionar item ao carrinho', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(2000);

        // ✅ Clica no botão do card
        await page.locator('.btn-mata-fome').first().click();
        await page.waitForTimeout(1500);

        // Clica em "Adicionar"
        await page.locator('button.btn-add-carrinho').click();
        await page.waitForTimeout(1500);

        // Verifica badge do carrinho
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);

        const badge = await page.locator('.badge').first().textContent();
        expect(badge?.trim()).toBe('1');
    });

    test('Cliente consegue fazer pedido completo', async ({ page }) => {
        const pedidoId = await fazerPedidoCliente(page);

        // ✅ Log para debug
        console.log(`🔍 Pedido criado: ${pedidoId}`);

        expect(pedidoId).toBeTruthy();

        // ✅ Aguarda com timeout maior
        await expect(page.locator('.card-pedido')).toBeVisible({ timeout: 15000 });
    });

    test('Cliente vê PIN de entrega após admin despachar', async ({ page }) => {
        const pedidoId = await fazerPedidoCliente(page);

        // Simula admin alterando status
        await page.evaluate((id) => {
            const pedidos = JSON.parse(localStorage.getItem('@delivery:pedidos'));
            const pedido = pedidos.find(p => p.id === id);
            pedido.status = 'Saiu para entrega';
            pedido.pinEntrega = '1234';
            pedido.entregadorId = 'entregador-teste';
            pedido.entregadorNome = 'João';
            pedido.entregadorPlaca = 'ABC-1234';
            localStorage.setItem('@delivery:pedidos', JSON.stringify(pedidos));
        }, pedidoId);

        await page.goto(`${BASE_URL}/acompanhar/${pedidoId}`);
        await page.waitForTimeout(2500);

        // Verifica se o PIN aparece
        await expect(page.locator('.pin-digits')).toBeVisible({ timeout: 5000 });

        const digitos = await page.locator('.digito').allTextContents();
        expect(digitos.join('')).toBe('1234');
    });
});
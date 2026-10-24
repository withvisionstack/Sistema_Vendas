import { expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

export async function limparStorage(page) {
    await page.goto(BASE_URL);

    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();

        // Configura loja aberta 24h para os testes
        localStorage.setItem('@delivery:loja', JSON.stringify({
            nome: 'Hamburgueria Teste',
            logo: '🍔',
            capas: [],
            cnpj: '12345678000199',
            chavePix: '12345678900',
            nomeBeneficiario: 'JOAO TESTE',
            cidadeBeneficiario: 'APUCARANA',
            aberto: true,
            horarioAbertura: '00:00',
            horarioFechamento: '23:59',
            emailContato: 'teste@teste.com',
            cidadeSede: 'Apucarana/PR',
            nomeDPO: 'DPO Teste',
            emailDPO: 'dpo@teste.com',
            coordenadas: { lat: -23.5507, lng: -51.4607 }
        }));

        sessionStorage.setItem('modalLojaFechadaVisto', 'true');
    });

    await page.reload();
    await page.waitForTimeout(800);
}

export async function fazerPedidoCliente(page, opcoes = {}) {
    // 1. Cardápio
    await page.goto(BASE_URL);
    await page.waitForSelector('.btn-mata-fome', { timeout: 10000 });

    // 2. Detalhe
    await page.locator('.btn-mata-fome').first().click();
    await page.waitForSelector('button.btn-add-carrinho', { timeout: 10000 });

    // 3. Adicionar ao carrinho
    await page.locator('button.btn-add-carrinho').click();
    await page.waitForTimeout(1500);

    // 4. Carrinho
    await page.goto(`${BASE_URL}/carrinho`);
    await page.waitForSelector('button:has-text("Continuar para Entrega")', { timeout: 10000 });

    // 5. Checkout
    await page.click('button:has-text("Continuar para Entrega")');
    await page.waitForSelector('input[placeholder*="Como podemos"]', { timeout: 10000 });

    // 6. Preenche dados
    await page.fill('input[placeholder*="Como podemos"]', opcoes.nome || 'Cliente Teste');
    await page.fill('input[placeholder*="(00)"]', opcoes.whatsapp || '43988888888');
    await page.fill('input[placeholder*="Nome da rua"]', opcoes.rua || 'Rua Teste');
    await page.fill('input[placeholder*="Ex: 123"]', opcoes.numero || '123');
    await page.fill('input[placeholder*="Sua cidade"]', opcoes.cidade || 'Apucarana');
    await page.fill('input[placeholder*="Seu bairro"]', opcoes.bairro || 'Centro');

    // 7. Ir para pagamento
    await page.click('button:has-text("Ir para Pagamento")');
    await page.waitForURL(`${BASE_URL}/pagamento`, { timeout: 10000 });

    // ✅ Aguarda a página de pagamento carregar
    await page.waitForSelector('.opcoes-pagamento', { timeout: 10000 });

    // 8. Seleciona Cartão
    await page.click('.opcao:has-text("Cartão")');
    await page.waitForTimeout(500);

    // ✅ Debug: verifica se o botão existe antes de clicar
    const botaoConfirmar = await page.locator('button.btn-confirmar').count();
    console.log(`🔍 Botões "Confirmar Pagamento" encontrados: ${botaoConfirmar}`);

    // 9. Confirma
    await page.click('button.btn-confirmar');

    // 10. Aguarda redirecionamento (o app espera 3s + navegação)
    await page.waitForURL(`${BASE_URL}/pedidos`, { timeout: 15000 });

    // 11. Aguarda a lista de pedidos carregar (skeleton de 600ms)
    await page.waitForTimeout(1000);

    // 12. Pega ID
    const pedidoId = await page.evaluate(() => {
        const pedidos = JSON.parse(localStorage.getItem('@delivery:pedidos')) || [];
        return pedidos[0]?.id;
    });

    return pedidoId;
}
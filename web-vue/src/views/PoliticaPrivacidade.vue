<script setup>
import { useRouter } from 'vue-router';
import { ArrowLeft, Shield } from 'lucide-vue-next';
import { useLoja } from '../composables/useLoja.js'; // ✅ Importa a loja

const router = useRouter();
const { configLoja } = useLoja(); // ✅ Puxa os dados

const voltar = () => {
    router.back();
};
</script>

<template>
    <div class="politica">
        <!-- Header simples com botão voltar -->
        <header class="header">
            <button class="btn-voltar" @click="voltar">
                <ArrowLeft :size="20" />
                <span>Voltar</span>
            </button>
            <div class="header-titulo">
                <Shield :size="20" class="icone-escudo" />
                <span>Política de Privacidade</span>
            </div>
        </header>

        <main class="conteudo">
            <p class="data-atualizacao">
                Última atualização: <strong>19 de outubro de 2026</strong>
            </p>

            <section>
                <h2>1. Quem somos</h2>
                <p>
                    Este site é operado por <strong>{{ configLoja.nome || 'Hamburgueria Delivery' }}</strong>,
                    inscrita no CNPJ <strong>{{ configLoja.cnpj || 'Não informado' }}</strong>, com sede em
                    {{ configLoja.cidadeSede || 'Cidade não informada' }}. Somos os controladores dos dados pessoais coletados
                    por meio deste site, conforme a Lei Geral de Proteção de Dados
                    (Lei nº 13.709/2018).
                </p>
            </section>

            <section>
                <h2>2. Quais dados coletamos</h2>
                <p>
                    Coletamos apenas os dados necessários para realizar a entrega
                    dos pedidos e processar o pagamento via PIX:
                </p>
                <ul>
                    <li><strong>Dados de identificação:</strong> nome completo</li>
                    <li><strong>Dados de contato:</strong> telefone (WhatsApp) e e-mail (opcional)</li>
                    <li><strong>Dados de endereço:</strong> rua, número, bairro, complemento, referência e CEP</li>
                    <li><strong>Dados de localização:</strong> coordenadas GPS (para melhorar o nosso serviço de logística e garantir entrega ágil)</li>
                    <li><strong>Dados do pedido:</strong> itens escolhidos, observações e valor total</li>
                    <li>
                        <strong>Dados de pagamento (CPF/CNPJ):</strong> exigido para gerar a
                        cobrança PIX conforme regulamentação do Banco Central do Brasil
                        (Resolução BCB nº 1/2020). O CPF é usado <strong>exclusivamente</strong>
                        para processar o pagamento e emitir nota fiscal.
                    </li>
                </ul>
                <p>
                    <strong>Não coletamos</strong> dados de cartão de crédito, senhas
                    bancárias ou informações financeiras além do CPF/CNPJ necessário
                    para o PIX.
                </p>
            </section>

            <section>
                <h2>3. Para que usamos seus dados</h2>
                <ul>
                    <li>Processar e entregar seu pedido</li>
                    <li>Entrar em contato sobre o status da entrega</li>
                    <li>Enviar confirmação do pedido via WhatsApp</li>
                    <li>
                        <strong>Gerar a cobrança PIX:</strong> o CPF/CNPJ é exigido pelo
                        Banco Central do Brasil para emissão de QR Code PIX. Sem esse dado,
                        o pagamento via PIX não pode ser gerado.
                    </li>
                    <li>
                        <strong>Emitir nota fiscal:</strong> conforme legislação fiscal
                        brasileira, o CPF é obrigatório para emissão de NF-e.
                    </li>
                    <li>Melhorar nosso serviço com base no histórico de pedidos</li>
                </ul>
                <p>
                    <strong>Não vendemos, alugamos ou compartilhamos</strong> seus dados
                    com terceiros para fins de marketing.
                </p>
            </section>

            <section>
                <h2>4. Base legal para o tratamento</h2>
                <p>Tratamos seus dados com base em:</p>
                <ul>
                    <li><strong>Execução de contrato:</strong> para processar e entregar o pedido (Art. 7º, V da LGPD)</li>
                    <li><strong>Cumprimento de obrigação legal:</strong> retenção do CPF para fins fiscais (Art. 7º, II da LGPD) e para emissão do PIX conforme regras do Banco Central</li>
                    <li><strong>Consentimento:</strong> para uso de geolocalização (GPS) (Art. 7º, I da LGPD)</li>
                    <li><strong>Legítimo interesse:</strong> para melhorar nosso serviço (Art. 7º, IX da LGPD)</li>
                </ul>
            </section>

            <section>
                <h2>5. Por quanto tempo guardamos</h2>
                <p>
                    Seus dados são mantidos pelo período necessário para cumprir as
                    finalidades descritas acima, respeitando os prazos legais:
                </p>
                <ul>
                    <li><strong>Dados do pedido:</strong> 5 anos (obrigação fiscal — Receita Federal)</li>
                    <li><strong>CPF/CNPJ:</strong> 5 anos (obrigação fiscal para emissão de nota e comprovação de transações PIX)</li>
                    <li><strong>Dados de localização (GPS):</strong> apagados após a entrega</li>
                    <li><strong>Dados de contato:</strong> até você solicitar exclusão (mas CPF é mantido por 5 anos por obrigação legal)</li>
                </ul>
                <p>
                    <strong>Atenção:</strong> mesmo que você solicite a exclusão dos
                    seus dados, o CPF será <strong>mantido pelo prazo legal de 5 anos</strong>
                    para cumprimento de obrigações fiscais, conforme Art. 16, I da LGPD.
                </p>
            </section>

            <section>
                <h2>6. Cookies</h2>
                <p>
                    Usamos cookies essenciais para o funcionamento do site e para
                    lembrar suas preferências (como a escolha de consentimento).
                    Não usamos cookies de rastreamento publicitário.
                </p>
            </section>

            <section>
                <h2>7. Compartilhamento com terceiros</h2>
                <p>Compartilhamos seus dados apenas com:</p>
                <ul>
                    <li><strong>O entregador:</strong> nome, telefone e endereço (para realizar a entrega). O CPF <strong>não</strong> é compartilhado com o entregador.</li>
                    <li><strong>Instituição financeira / PSP (Provedor de Serviço de Pagamento):</strong> quando você paga via PIX, o CPF é enviado ao banco/PSP para gerar a cobrança. O PSP é obrigado a manter sigilo bancário conforme regulação do Banco Central.</li>
                    <li><strong>Receita Federal:</strong> emissão de nota fiscal eletrônica (obrigação legal)</li>
                    <li><strong>Serviços essenciais:</strong> como hospedagem e WhatsApp (apenas o necessário)</li>
                </ul>
            </section>

            <section>
                <h2>8. Seus direitos (LGPD)</h2>
                <p>Você tem direito a:</p>
                <ul>
                    <li>Confirmar se tratamos seus dados</li>
                    <li>Acessar seus dados</li>
                    <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                    <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários</li>
                    <li>Solicitar a portabilidade dos dados</li>
                    <li>Revogar o consentimento a qualquer momento</li>
                    <li>Solicitar a exclusão dos dados</li>
                </ul>
                <p>
                    <strong>Ressalva importante:</strong> o CPF vinculado a pedidos com
                    pagamento via PIX <strong>não pode ser excluído antes do prazo de
                    5 anos</strong>, pois a Receita Federal exige a manutenção desses
                    dados para fins fiscais. Os demais dados podem ser excluídos mediante
                    solicitação.
                </p>
            </section>

            <section>
                <h2>9. Como exercer seus direitos</h2>
                <p>
                    Para exercer qualquer direito previsto na LGPD, entre em contato
                    pelo e-mail <strong>{{ configLoja.emailContato || 'privacidade@sualoja.com' }}</strong>.
                    Responderemos em até 15 dias úteis.
                </p>
            </section>

            <section>
                <h2>10. Segurança</h2>
                <p>
                    Adotamos medidas técnicas e administrativas para proteger seus
                    dados, incluindo conexão criptografada (HTTPS) e acesso
                    restrito às informações.
                </p>
            </section>

            <section>
                <h2>11. Alterações nesta política</h2>
                <p>
                    Podemos atualizar esta política periodicamente. A data de
                    "última atualização" será sempre alterada quando isso ocorrer.
                    Alterações significativas serão comunicadas no site.
                </p>
            </section>

            <section>
                <h2>12. Encarregado de Proteção de Dados (DPO)</h2>
                <p>
                    Responsável pelo tratamento de dados:<br />
                    <strong>{{ configLoja.nomeDPO || 'Nome do responsável' }}</strong><br />
                    E-mail: <strong>{{ configLoja.emailDPO || 'dpo@sualoja.com' }}</strong>
                </p>
            </section>

            <section class="aviso">
                <p>
                    <strong>⚠️ Importante:</strong> Este é um modelo base.
                    Consulte um advogado especializado em LGPD antes de publicar,
                    para garantir que todos os requisitos legais sejam cumpridos
                    no seu caso específico.
                </p>
            </section>
        </main>

        <footer class="footer">
            <button class="btn-voltar-footer" @click="voltar">
                ← Voltar ao site
            </button>
        </footer>
    </div>
</template>
<style scoped>
.politica {
    min-height: 100vh;
    background: #f5f0e8;
    color: #333;
    font-family: system-ui, -apple-system, sans-serif;
    line-height: 1.6;
}

.header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #1a1a1a;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.btn-voltar {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #fff;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
}

.btn-voltar:hover {
    background: rgba(255, 255, 255, 0.2);
}

.header-titulo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 15px;
}

.icone-escudo {
    color: #f59e0b;
}

.conteudo {
    max-width: 800px;
    margin: 0 auto;
    padding: 32px 20px 60px;
}

.data-atualizacao {
    font-size: 13px;
    color: #666;
    margin-bottom: 32px;
    padding: 8px 12px;
    background: #fff;
    border-left: 4px solid #f59e0b;
    border-radius: 4px;
}

section {
    margin-bottom: 32px;
}

section h2 {
    font-size: 18px;
    color: #1a1a1a;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #f59e0b;
}

section p {
    margin-bottom: 12px;
    color: #444;
}

section ul {
    margin: 8px 0 16px 20px;
    padding: 0;
}

section ul li {
    margin-bottom: 6px;
    color: #444;
}

section ul li strong {
    color: #1a1a1a;
}

.aviso {
    background: #fff8e1;
    border: 1px solid #f59e0b;
    border-radius: 8px;
    padding: 16px;
    margin-top: 40px;
}

.aviso p {
    margin: 0;
    font-size: 13px;
    color: #8a5c00;
}

.footer {
    background: #1a1a1a;
    padding: 24px 16px;
    text-align: center;
}

.btn-voltar-footer {
    background: #f59e0b;
    color: #1a1a1a;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-size: 14px;
    transition: transform 0.15s;
}

.btn-voltar-footer:active {
    transform: scale(0.96);
}

@media (max-width: 600px) {
    .conteudo {
        padding: 24px 16px 40px;
    }
    section h2 {
        font-size: 16px;
    }
}
</style>
// src/lib/pix.js

/// src/lib/pix.js

// Função para calcular o CRC16 (obrigatório no Pix)
function crc16(payload) {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) > 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

// Função para formatar os campos (ID + Tamanho + Valor)
function formatarCampo(id, valor) {
    const tamanho = valor.length.toString().padStart(2, '0');
    return `${id}${tamanho}${valor}`;
}

export function gerarPayloadPix({ chave, nome, cidade, valor, txid = '***' }) {
    // 1. Remove acentos, caracteres especiais e limita o tamanho
    const nomeFormatado = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 25).toUpperCase();
    const cidadeFormatada = cidade.normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 15).toUpperCase();
    const valorFormatado = Number(valor).toFixed(2);

    // 2. Monta o Merchant Account Information (Tag 26)
    // Note que o 00 é BR.GOV.BCB.PIX e o 01 é a chave (CPF/CNPJ/Email)
    let merchantAccountInfo = formatarCampo('00', 'BR.GOV.BCB.PIX') + formatarCampo('01', chave);

    // 3. Monta o Payload principal
    let payload = '';
    payload += formatarCampo('00', '01'); // ✅ CORRIGIDO: Tag 00 é sempre '01'
    payload += formatarCampo('26', merchantAccountInfo); // ✅ CORRIGIDO: Tag 26 recebe a estrutura acima
    payload += formatarCampo('52', '0000'); // Merchant Category Code
    payload += formatarCampo('53', '986'); // Moeda (BRL)
    payload += formatarCampo('54', valorFormatado); // Valor da transação
    payload += formatarCampo('58', 'BR'); // País
    payload += formatarCampo('59', nomeFormatado); // Nome do recebedor
    payload += formatarCampo('60', cidadeFormatada); // Cidade do recebedor
    payload += formatarCampo('62', formatarCampo('05', txid)); // ID da transação (txid)

    // 4. Adiciona a Tag 63 e o CRC16
    payload += '6304'; // Tag do CRC e tamanho (04)
    payload += crc16(payload); // Calcula o CRC em cima de tudo que foi montado

    return payload;
}
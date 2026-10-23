import { ref, computed } from 'vue';

// ═══════════════════════════════════════════════════════════
// CONFIGURAÇÕES DE SEGURANÇA
// ═══════════════════════════════════════════════════════════
const SENHA_PADRAO = 'admin123';
const ITERACOES_PBKDF2 = 100000;
const MAX_TENTATIVAS = 5;
const TEMPO_BLOQUEIO_MS = 15 * 60 * 1000;  // 15 min
const TEMPO_SESSAO_MS = 2 * 60 * 60 * 1000; // 2h
const TEMPO_INATIVIDADE_MS = 30 * 60 * 1000; // 30 min

// ═══════════════════════════════════════════════════════════
// ESTADO REATIVO
// ═══════════════════════════════════════════════════════════
const estaLogado = ref(false);
const ultimaAtividade = ref(Date.now());

// ─── Helpers de criptografia ───
const bufferToHex = (buffer) =>
    Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');

const gerarSalt = () => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return bufferToHex(array.buffer);
};

// ✅ PBKDF2: MUITO mais seguro que SHA-256 puro
const hashSenha = async (senha, salt) => {
    const encoder = new TextEncoder();
    const senhaBuffer = encoder.encode(senha);
    const saltBuffer = new Uint8Array(salt.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    const keyMaterial = await crypto.subtle.importKey(
        'raw', senhaBuffer, { name: 'PBKDF2' }, false, ['deriveBits']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: saltBuffer, iterations: ITERACOES_PBKDF2, hash: 'SHA-256' },
        keyMaterial,
        256
    );

    return bufferToHex(hashBuffer);
};

// ─── Sessão persistida ───
const carregarSessao = () => {
    try {
        const sessao = JSON.parse(sessionStorage.getItem('@delivery:admin_sessao'));
        if (!sessao) return false;

        const { token, timestamp, ultimaAtividadeSalva } = sessao;

        // ✅ Sessão expirou por tempo?
        if (Date.now() - timestamp > TEMPO_SESSAO_MS) {
            sessionStorage.removeItem('@delivery:admin_sessao');
            return false;
        }

        // ✅ Sessão expirou por inatividade?
        if (Date.now() - ultimaAtividadeSalva > TEMPO_INATIVIDADE_MS) {
            sessionStorage.removeItem('@delivery:admin_sessao');
            return false;
        }

        // ✅ Token íntegro?
        const tokenEsperado = gerarTokenSessao(timestamp);
        if (token !== tokenEsperado) {
            sessionStorage.removeItem('@delivery:admin_sessao');
            return false;
        }

        ultimaAtividade.value = ultimaAtividadeSalva;
        estaLogado.value = true;
        return true;
    } catch {
        return false;
    }
};

// Token de sessão = hash simples de timestamp + salt da instalação
const gerarTokenSessao = (timestamp) => {
    const salt = localStorage.getItem('@delivery:install_salt') || '';
    let hash = 0;
    const input = `${timestamp}:${salt}`;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) - hash) + input.charCodeAt(i);
        hash |= 0;
    }
    return hash.toString(36) + timestamp.toString(36);
};

// ─── Rate limiting ───
const obterTentativas = () => {
    try {
        return JSON.parse(localStorage.getItem('@delivery:tentativas_login')) || {
            count: 0, bloqueadoAte: 0
        };
    } catch {
        return { count: 0, bloqueadoAte: 0 };
    }
};

const salvarTentativas = (dados) => {
    localStorage.setItem('@delivery:tentativas_login', JSON.stringify(dados));
};

const verificarBloqueio = () => {
    const t = obterTentativas();
    if (t.bloqueadoAte && Date.now() < t.bloqueadoAte) {
        const minutos = Math.ceil((t.bloqueadoAte - Date.now()) / 60000);
        return { bloqueado: true, minutosRestantes: minutos };
    }
    return { bloqueado: false };
};

const registrarTentativaFalha = () => {
    const t = obterTentativas();
    t.count = (t.count || 0) + 1;

    if (t.count >= MAX_TENTATIVAS) {
        t.bloqueadoAte = Date.now() + TEMPO_BLOQUEIO_MS;
        t.count = 0;
        salvarTentativas(t);
        return { bloqueado: true };
    }

    salvarTentativas(t);
    return { bloqueado: false, tentativasRestantes: MAX_TENTATIVAS - t.count };
};

const limparTentativas = () => {
    localStorage.removeItem('@delivery:tentativas_login');
};

// ═══════════════════════════════════════════════════════════
// API PÚBLICA
// ═══════════════════════════════════════════════════════════
export function useAuth() {
    // ─── Inicialização ───
    const inicializarSistema = async () => {
        // Gera salt da instalação (uma vez por navegador)
        if (!localStorage.getItem('@delivery:install_salt')) {
            localStorage.setItem('@delivery:install_salt', gerarSalt());
        }

        // Cria senha padrão se não existir
        if (!localStorage.getItem('@delivery:admin_senha')) {
            const salt = localStorage.getItem('@delivery:install_salt');
            const hash = await hashSenha(SENHA_PADRAO, salt);
            localStorage.setItem('@delivery:admin_senha', hash);
        }

        // Tenta restaurar sessão
        carregarSessao();
    };

    // ─── Login ───
    const login = async (senha) => {
        // ✅ Verifica bloqueio por rate limit
        const bloqueio = verificarBloqueio();
        if (bloqueio.bloqueado) {
            return {
                ok: false,
                motivo: 'bloqueado',
                mensagem: `Muitas tentativas. Aguarde ${bloqueio.minutosRestantes} minuto(s).`
            };
        }

        await inicializarSistema();

        const salt = localStorage.getItem('@delivery:install_salt');
        const hashInformado = await hashSenha(senha, salt);
        const hashSalvo = localStorage.getItem('@delivery:admin_senha');

        if (hashInformado === hashSalvo) {
            // ✅ SUCESSO
            limparTentativas();

            const timestamp = Date.now();
            estaLogado.value = true;
            ultimaAtividade.value = timestamp;

            const sessao = {
                token: gerarTokenSessao(timestamp),
                timestamp,
                ultimaAtividadeSalva: timestamp
            };
            sessionStorage.setItem('@delivery:admin_sessao', JSON.stringify(sessao));

            return { ok: true };
        } else {
            // ❌ FALHA
            const resultado = registrarTentativaFalha();

            if (resultado.bloqueado) {
                return {
                    ok: false,
                    motivo: 'bloqueado',
                    mensagem: `Senha incorreta. Conta bloqueada por 15 minutos.`
                };
            }

            return {
                ok: false,
                motivo: 'senha_errada',
                mensagem: 'Senha incorreta.',
                tentativasRestantes: resultado.tentativasRestantes
            };
        }
    };

    // ─── Logout ───
    const logout = () => {
        estaLogado.value = false;
        sessionStorage.removeItem('@delivery:admin_sessao');
    };

    // ─── Registro de atividade (chamar em cada navegação) ───
    const registrarAtividade = () => {
        if (!estaLogado.value) return;

        const agora = Date.now();
        ultimaAtividade.value = agora;

        try {
            const sessao = JSON.parse(sessionStorage.getItem('@delivery:admin_sessao'));
            if (sessao) {
                sessao.ultimaAtividadeSalva = agora;
                sessionStorage.setItem('@delivery:admin_sessao', JSON.stringify(sessao));
            }
        } catch { /* ignora */ }
    };

    // ─── Alterar senha ───
    const alterarSenha = async (senhaAtual, novaSenha) => {
        await inicializarSistema();

        const salt = localStorage.getItem('@delivery:install_salt');
        const hashAtual = await hashSenha(senhaAtual, salt);
        const hashSalvo = localStorage.getItem('@delivery:admin_senha');

        if (hashAtual !== hashSalvo) {
            return { ok: false, msg: 'Senha atual incorreta' };
        }

        // ✅ Validações de força
        if (novaSenha.length < 8) {
            return { ok: false, msg: 'A nova senha deve ter no mínimo 8 caracteres' };
        }
        if (!/[A-Z]/.test(novaSenha)) {
            return { ok: false, msg: 'A nova senha deve ter pelo menos 1 letra maiúscula' };
        }
        if (!/[0-9]/.test(novaSenha)) {
            return { ok: false, msg: 'A nova senha deve ter pelo menos 1 número' };
        }
        if (novaSenha === senhaAtual) {
            return { ok: false, msg: 'A nova senha deve ser diferente da atual' };
        }

        const novoHash = await hashSenha(novaSenha, salt);
        localStorage.setItem('@delivery:admin_senha', novoHash);

        // ✅ Força re-login após trocar senha
        logout();

        return { ok: true, msg: 'Senha alterada! Faça login novamente.' };
    };

    // ─── Verificação de expiração (chamar via setInterval) ───
    const verificarExpiracao = () => {
        if (!estaLogado.value) return false;

        const expirouPorInatividade = (Date.now() - ultimaAtividade.value) > TEMPO_INATIVIDADE_MS;

        try {
            const sessao = JSON.parse(sessionStorage.getItem('@delivery:admin_sessao'));
            const expirouPorTempo = sessao && (Date.now() - sessao.timestamp > TEMPO_SESSAO_MS);

            if (expirouPorInatividade || expirouPorTempo) {
                logout();
                return true; // expirou
            }
        } catch { /* ignora */ }

        return false;
    };

    const tempoRestanteSessao = computed(() => {
        if (!estaLogado.value) return 0;
        try {
            const sessao = JSON.parse(sessionStorage.getItem('@delivery:admin_sessao'));
            if (!sessao) return 0;
            const restante = TEMPO_SESSAO_MS - (Date.now() - sessao.timestamp);
            return Math.max(0, restante);
        } catch {
            return 0;
        }
    });

    return {
        estaLogado,
        login,
        logout,
        alterarSenha,
        inicializarSistema,
        registrarAtividade,
        verificarExpiracao,
        tempoRestanteSessao
    };
}
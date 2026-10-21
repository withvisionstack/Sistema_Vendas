import { ref } from 'vue';

const SENHA_PADRAO = 'admin123'; // ⚠️ O dono DEVE trocar após o primeiro acesso

export function useAuth() {
    const estaLogado = ref(sessionStorage.getItem('@delivery:admin_logado') === 'true');

    // Hash SHA-256 nativo do navegador
    const hashSenha = async (senha) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(senha);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    };

    // Inicializa a senha padrão na primeira vez
    const inicializarSenha = async () => {
        if (!localStorage.getItem('@delivery:admin_senha')) {
            const hash = await hashSenha(SENHA_PADRAO);
            localStorage.setItem('@delivery:admin_senha', hash);
        }
    };

    // Login
    const login = async (senha) => {
        await inicializarSenha();
        const hash = await hashSenha(senha);
        const senhaSalva = localStorage.getItem('@delivery:admin_senha');

        if (hash === senhaSalva) {
            estaLogado.value = true;
            sessionStorage.setItem('@delivery:admin_logado', 'true');
            return true;
        }
        return false;
    };

    // Logout
    const logout = () => {
        estaLogado.value = false;
        sessionStorage.removeItem('@delivery:admin_logado');
    };

    // Alterar senha
    const alterarSenha = async (senhaAtual, novaSenha) => {
        await inicializarSenha();
        const hashAtual = await hashSenha(senhaAtual);
        const senhaSalva = localStorage.getItem('@delivery:admin_senha');

        if (hashAtual !== senhaSalva) {
            return { ok: false, msg: 'Senha atual incorreta' };
        }
        if (novaSenha.length < 6) {
            return { ok: false, msg: 'A nova senha deve ter pelo menos 6 caracteres' };
        }

        const novoHash = await hashSenha(novaSenha);
        localStorage.setItem('@delivery:admin_senha', novoHash);
        return { ok: true };
    };

    return { estaLogado, login, logout, alterarSenha };
}
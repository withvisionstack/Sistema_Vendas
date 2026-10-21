<script setup>
</script>

<template>
    <footer class="footer">
        <div class="footer-conteudo">
            <p class="copyright">
                &copy; {{ new Date().getFullYear() }} Hamburgueria Delivery.
                Todos os direitos reservados.
            </p>
            <nav class="footer-links">
                <RouterLink to="/politica-de-privacidade">
                    Política de Privacidade
                </RouterLink>
                <span class="separador">|</span>
                <a href="mailto:contato@hamburgueria.com.br">
                    Contato
                </a>
            </nav>
        </div>
    </footer>
</template>

<style scoped>
.footer {
    background: #1a1a1a;
    color: #888;
    padding: 20px 16px;
    font-size: 12px;
    text-align: center;
}

.footer-conteudo {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.copyright {
    margin: 0;
}

.footer-links {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
}

.footer-links a {
    color: #f59e0b;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s;
}

.footer-links a:hover {
    color: #fff;
}

.separador {
    color: #444;
}

/* Esconde o footer no mobile */
@media (max-width: 767px) {
    .footer {
        display: none;
    }
}
</style>
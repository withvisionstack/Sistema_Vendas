<script setup>
import { ref, onMounted } from 'vue';

const visivel = ref(false);
const CHAVE_CONSENTIMENTO = 'lgpd_consentimento_delivery';

onMounted(() => {
  const consentimento = localStorage.getItem(CHAVE_CONSENTIMENTO);
  if (!consentimento) {
    // Pequeno delay para não aparecer instantaneamente ao carregar a página
    setTimeout(() => {
      visivel.value = true;
    }, 1500);
  }
});

const aceitar = () => {
  localStorage.setItem(CHAVE_CONSENTIMENTO, 'aceito');
  visivel.value = false;
};

const recusar = () => {
  localStorage.setItem(CHAVE_CONSENTIMENTO, 'recusado');
  visivel.value = false;
};
</script>
<template>
  <Transition name="fade">
    <div v-if="visivel" class="cookie-banner">
      <p>
        Nós usamos cookies para melhorar sua experiência e personalizar o conteúdo.
        Ao clicar em "Aceitar", você concorda com a nossa
        <RouterLink to="/politica-de-privacidade" @click="visivel = false">
          Política de Privacidade
        </RouterLink>.
      </p>
      <div class="cookie-actions">
        <button class="btn-recusar" @click="recusar">Recusar</button>
        <button class="btn-aceitar" @click="aceitar">Aceitar</button>
      </div>
    </div>
  </Transition>
</template>
<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  max-width: 480px;
  background: #1a1a1a;
  color: #fff;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 14px;
  line-height: 1.4;
}

.cookie-banner a {
  color: #f59e0b;
  text-decoration: underline;
}

.cookie-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.cookie-actions button {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
  transition: transform 0.15s;
}

.cookie-actions button:active {
  transform: scale(0.95);
}

.btn-recusar {
  background: #444;
  color: #ddd;
}

.btn-aceitar {
  background: #f59e0b;
  color: #1a1a1a;
}

/* Animação de fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
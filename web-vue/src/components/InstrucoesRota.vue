<template>
  <div v-if="rota" class="instrucoes">
    <div class="resumo">
      <div class="metrica">
        <span class="valor">{{ rota.distanciaKm.toFixed(1) }}</span>
        <span class="unidade">km</span>
      </div>
      <div class="metrica">
        <span class="valor">{{ rota.duracaoMin }}</span>
        <span class="unidade">min</span>
      </div>
    </div>

    <ol class="lista">
      <li v-for="(m, i) in rota.instrucoes" :key="i">
        <span class="num">{{ i + 1 }}</span>
        <div class="texto">
          <p class="instrucao">{{ m.instruction }}</p>
          <p v-if="m.length > 0" class="dist">{{ formatarDistancia(m.length) }}</p>
        </div>
      </li>
    </ol>
  </div>
</template>

<script setup>
defineProps({
  rota: { type: Object, default: null },
});

function formatarDistancia(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
</script>

<style scoped>
.instrucoes {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-height: 50vh;
  display: flex;
  flex-direction: column;
}

.resumo {
  display: flex;
  gap: 24px;
  background: #4a90e2;
  color: #fff;
  padding: 12px 16px;
}

.metrica { display: flex; align-items: baseline; gap: 4px; }
.valor { font-size: 22px; font-weight: 700; }
.unidade { font-size: 13px; opacity: 0.9; }

.lista { list-style: none; margin: 0; padding: 0; overflow-y: auto; }

.lista li {
  display: flex;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #f5f5f5;
  align-items: flex-start;
}

.lista li:last-child { border-bottom: none; }

.num {
  width: 22px;
  height: 22px;
  background: #4a90e2;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 2px;
}

.texto { flex: 1; }
.instrucao { margin: 0; font-size: 14px; color: #333; line-height: 1.4; }
.dist { margin: 2px 0 0; font-size: 12px; color: #888; }
</style>
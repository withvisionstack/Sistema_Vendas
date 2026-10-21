<script setup>
defineProps({
    linhas: { type: Number, default: 3 },
    altura: { type: String, default: '80px' },
});
</script>

<template>
    <div class="skeleton" :style="{ height: altura }">
        <div v-for="i in linhas" :key="i" class="linha" />
    </div>
</template>

<style scoped>
.skeleton {
    background: #f0f0f0;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    animation: pulse 1.5s ease-in-out infinite;
}

.linha {
    height: 12px;
    background: #e0e0e0;
    border-radius: 4px;
}

.linha:nth-child(2) { width: 80%; }
.linha:nth-child(3) { width: 60%; }

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
</style>
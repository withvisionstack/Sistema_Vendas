import { ref } from 'vue';

export function useRota() {
    const rota = ref(null);
    const carregando = ref(false);
    const erro = ref('');

    async function calcular(origem, destino) {
        carregando.value = true;
        erro.value = '';
        rota.value = null;

        try {
            const r = await fetch('/api/rota', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    origem_lat: origem.lat,
                    origem_lon: origem.lon,
                    destino_lat: destino.lat,
                    destino_lon: destino.lon,
                }),
            });

            if (!r.ok) throw new Error('Erro ' + r.status);
            const dados = await r.json();

            if (dados.trip?.legs?.[0]) {
                const leg = dados.trip.legs[0];
                rota.value = {
                    polyline: leg.shape,
                    instrucoes: leg.maneuvers,
                    distanciaKm: leg.summary.length,
                    duracaoMin: Math.round(leg.summary.time / 60),
                };
                return rota.value;
            }
            throw new Error('Rota não encontrada');
        } catch (e) {
            erro.value = e.message;
            throw e;
        } finally {
            carregando.value = false;
        }
    }

    return { rota, carregando, erro, calcular };
}
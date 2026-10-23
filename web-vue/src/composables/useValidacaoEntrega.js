import { ref } from 'vue';

const RAIO_PROXIMIDADE_METROS = 150;
const MAX_TENTATIVAS_PIN = 3;

const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const toRad = Math.PI / 180;
    const φ1 = lat1 * toRad;
    const φ2 = lat2 * toRad;
    const Δφ = (lat2 - lat1) * toRad;
    const Δλ = (lon2 - lon1) * toRad;
    const a = Math.sin(Δφ / 2) ** 2 +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
};

export function useValidacaoEntrega() {
    const fotoComprovante = ref(null);

    // ✅ Verifica PIN digitado
    const validarPin = (pedido, pinDigitado) => {
        if (!pedido.pinEntrega) {
            return { ok: false, motivo: 'sem_pin', mensagem: 'Pedido sem PIN configurado' };
        }

        if (pedido.pinBloqueado) {
            return { ok: false, motivo: 'bloqueado', mensagem: 'PIN bloqueado por excesso de tentativas. Use o modo alternativo (foto).' };
        }

        if (pinDigitado === pedido.pinEntrega) {
            return { ok: true };
        }

        const tentativas = (pedido.pinTentativas || 0) + 1;
        const bloqueado = tentativas >= MAX_TENTATIVAS_PIN;

        return {
            ok: false,
            motivo: bloqueado ? 'bloqueado' : 'pin_errado',
            tentativas,
            tentativasRestantes: MAX_TENTATIVAS_PIN - tentativas,
            mensagem: bloqueado 
                ? 'PIN bloqueado após 3 tentativas. Use foto + justificativa.'
                : `PIN incorreto. ${MAX_TENTATIVAS_PIN - tentativas} tentativa(s) restante(s).`
        };
    };

    // ✅ Verifica proximidade GPS
    const verificarProximidade = (posicaoAtual, destino) => {
        if (!posicaoAtual || !destino) {
            return { ok: false, motivo: 'sem_gps', mensagem: 'GPS indisponível', distancia: null };
        }

        const distancia = Math.round(haversine(
            posicaoAtual.lat, posicaoAtual.lon,
            destino.lat, destino.lon
        ));

        return {
            ok: distancia <= RAIO_PROXIMIDADE_METROS,
            distancia,
            motivo: distancia <= RAIO_PROXIMIDADE_METROS ? 'perto' : 'longe'
        };
    };

    // ✅ Processa e comprime foto
    const processarFoto = (file) => {
        return new Promise((resolve, reject) => {
            if (!file) return reject('Nenhum arquivo');

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX = 800;
                    let { width, height } = img;

                    if (width > height && width > MAX) {
                        height *= MAX / width;
                        width = MAX;
                    } else if (height > MAX) {
                        width *= MAX / height;
                        height = MAX;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d').drawImage(img, 0, 0, width, height);

                    const base64 = canvas.toDataURL('image/jpeg', 0.7);
                    fotoComprovante.value = base64;
                    resolve(base64);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const limparFoto = () => { fotoComprovante.value = null; };

    return {
        fotoComprovante,
        validarPin,
        verificarProximidade,
        processarFoto,
        limparFoto,
        MAX_TENTATIVAS_PIN,
        RAIO_PROXIMIDADE_METROS
    };
}
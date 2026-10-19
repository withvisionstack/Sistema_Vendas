import { shallowRef, markRaw } from 'vue';
import * as maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import { layers, namedFlavor } from '@protomaps/basemaps';
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';

// 🆕 Importa funções puras (testadas isoladamente)
import { haversine, calcularBearing } from '../lib/geo.js';
import { decodificaPolyline } from '../lib/polyline.js';

setWorkerUrl(workerUrl);

export function useMapa() {
    const mapa = shallowRef(null);
    const marcadorPosicao = shallowRef(null);
    const marcadorDestino = shallowRef(null);

    let seguirPosicao = false;
    let lastBearing = 0;
    let lastPosicao = null;

    function inicializar(containerId) {
        if (mapa.value) return mapa.value;

        try {
            const protocol = new Protocol();
            maplibregl.addProtocol('pmtiles', protocol.tile);
        } catch (e) {
            if (!e.message?.includes('already')) console.warn(e);
        }

        try {
            mapa.value = markRaw(new maplibregl.Map({
                container: containerId,
                style: {
                    version: 8,
                    glyphs: 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
                    sprite: 'https://protomaps.github.io/basemaps-assets/sprites/v4/light',
                    sources: {
                        protomaps: {
                            type: 'vector',
                            url: 'pmtiles:///tiles/regiao-sul-proto.pmtiles',
                            maxzoom: 16,
                        },
                    },
                    layers: [
                        ...layers('protomaps', namedFlavor('light'), { lang: 'pt' }),
                    ],
                },
                center: [-51.46, -23.55],
                zoom: 15,
                maxZoom: 19,
                minZoom: 6,
                pitch: 45,
                bearing: 0,
                maxBounds: [[-57.65, -33.75], [-47.90, -22.50]],
                pitchWithRotate: true,
                dragRotate: true,
                touchPitch: true,
            }));
        } catch (e) {
            console.error('❌ Erro ao criar mapa:', e);
            return null;
        }

        if (!mapa.value) return null;

        mapa.value.on('load', () => console.log('✅ Mapa carregado'));
        mapa.value.on('error', (e) => console.error('❌ Erro MapLibre:', e.error || e));
        mapa.value.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

        return mapa.value;
    }

    function iniciarFollow() { seguirPosicao = true; }
    function pararFollow() { seguirPosicao = false; }

    function atualizarPosicaoComHeading(lat, lon) {
        if (!mapa.value) return;
        const lngLat = [lon, lat];

        if (lastPosicao) {
            const dist = haversine(lastPosicao.lat, lastPosicao.lon, lat, lon);
            if (dist > 3) {
                lastBearing = calcularBearing(lastPosicao.lat, lastPosicao.lon, lat, lon);
            }
        }
        lastPosicao = { lat, lon };

        atualizarPosicao(lat, lon, lastBearing);

        if (seguirPosicao) {
            mapa.value.easeTo({
                center: lngLat,
                bearing: lastBearing,
                pitch: 60,
                zoom: 17,
                duration: 800,
            });
        }
    }

    function atualizarPosicao(lat, lon, heading = 0) {
        if (!mapa.value) return;
        const lngLat = [lon, lat];

        if (!marcadorPosicao.value) {
            const el = document.createElement('div');
            el.innerHTML = `
                <div style="
                    width: 32px; height: 32px;
                    background: #f59e0b;
                    border: 3px solid #fff;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 18px; color: #fff;
                    box-shadow: 0 2px 8px rgba(0,0,0,.4);
                    transform: rotate(${heading}deg);
                    transition: transform .3s ease;
                ">▲</div>
            `;
            marcadorPosicao.value = markRaw(new maplibregl.Marker({ element: el })
                .setLngLat(lngLat)
                .addTo(mapa.value));
        } else {
            marcadorPosicao.value.setLngLat(lngLat);
            const seta = marcadorPosicao.value.getElement()?.querySelector('div');
            if (seta) seta.style.transform = `rotate(${heading}deg)`;
        }
    }

    function marcarDestino(lat, lon) {
        if (!mapa.value) return;
        if (marcadorDestino.value) marcadorDestino.value.remove();

        const el = document.createElement('div');
        el.innerHTML = `
            <div style="
                width: 28px; height: 28px;
                background: #dc2626;
                border: 3px solid #fff;
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-size: 14px;
                box-shadow: 0 2px 8px rgba(0,0,0,.4);
            ">📍</div>
        `;

        marcadorDestino.value = markRaw(new maplibregl.Marker({ element: el })
            .setLngLat([lon, lat])
            .addTo(mapa.value));
    }

    function desenharRota(polylineEncoded) {
        if (!mapa.value || !polylineEncoded) return;
        const coords = decodificaPolyline(polylineEncoded);

        if (coords.length === 0) {
            console.warn('[ROTA] Nenhuma coordenada decodificada');
            return;
        }

        if (mapa.value.getSource('rota')) {
            ['rota-linha', 'rota-casing'].forEach(id => {
                if (mapa.value.getLayer(id)) mapa.value.removeLayer(id);
            });
            mapa.value.removeSource('rota');
        }

        mapa.value.addSource('rota', {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: coords },
            },
        });

        mapa.value.addLayer({
            id: 'rota-casing',
            type: 'line',
            source: 'rota',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': '#ffffff', 'line-width': 14, 'line-opacity': 0.95 },
        });

        mapa.value.addLayer({
            id: 'rota-linha',
            type: 'line',
            source: 'rota',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': '#4dabf7', 'line-width': 10, 'line-opacity': 1 },
        });

        if (mapa.value.getLayer('rota-casing')) mapa.value.moveLayer('rota-casing');
        if (mapa.value.getLayer('rota-linha')) mapa.value.moveLayer('rota-linha');

        try {
            const bounds = new maplibregl.LngLatBounds();
            coords.forEach(c => bounds.extend(c));
            mapa.value.fitBounds(bounds, { padding: 60, duration: 1000, pitch: 45 });
        } catch (e) {
            console.error('[ROTA] Erro no fitBounds:', e);
            if (coords[0]) mapa.value.easeTo({ center: coords[0], zoom: 15, duration: 1000 });
        }
    }

    function voarPara(lat, lon, zoom = 17) {
        if (mapa.value) {
            mapa.value.flyTo({ center: [lon, lat], zoom, pitch: 45, duration: 1200 });
        }
    }

    return {
        mapa,
        inicializar,
        desenharRota,
        atualizarPosicao,
        atualizarPosicaoComHeading,
        marcarDestino,
        voarPara,
        iniciarFollow,
        pararFollow,
    };
}
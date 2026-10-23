// src/pkg/mapProtocol.js
import { Protocol } from 'pmtiles';
import * as maplibregl from 'maplibre-gl';
import { layers, namedFlavor } from '@protomaps/basemaps';

let registrado = false;

export function registrarProtocoloPmtiles() {
    if (registrado) return;
    const protocol = new Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);
    registrado = true;
}

export const PMTILES_URL = 'pmtiles:///tiles/cidades-2026-10.pmtiles';

// ⚠️ MUDE AQUI SE O MAPA CONTINUAR CINZA
// Tente 'openmaptiles' primeiro. Se não funcionar, mude para 'protomaps'
const SOURCE_NAME = 'openmaptiles';

export function criarStyleProtomaps(tema = 'light') {
    return {
        version: 8,
        glyphs: 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
        sprite: `https://protomaps.github.io/basemaps-assets/sprites/v4/${tema}`,
        sources: {
            [SOURCE_NAME]: {
                type: 'vector',
                url: PMTILES_URL,
                attribution: '© OpenStreetMap'
            }
        },
        layers: layers(SOURCE_NAME, namedFlavor(tema), { lang: 'pt' })
    };
}

maplibregl.setWorkerUrl('https://unpkg.com/maplibre-gl@^6.0.0/dist/maplibre-gl-worker.mjs');
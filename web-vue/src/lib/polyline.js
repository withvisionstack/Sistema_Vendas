/**
 * Decodificador de polyline do Valhalla.
 *
 * ⚠️ IMPORTANTE: Valhalla usa escala 1e6 (não 1e5 como o Google Maps).
 * Se mudar pra 1e5, as coordenadas ficam 10x maiores e o MapLibre rejeita
 * ("Invalid LngLat latitude value: must be between -90 and 90").
 *
 * @param {string} encoded - Polyline codificada
 * @returns {Array<[number, number]>} Array de [lng, lat] (ordem do MapLibre)
 */


export function decodificaPolyline(encoded) {
    if (!encoded || typeof encoded !== 'string') {
        return [];
    }

    let index = 0;
    let lat = 0;
    let lng = 0;
    const coords = [];

    while (index < encoded.length) {
        let shift = 0;
        let result = 0;
        let byte;

        // Decodifica latitude
        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        lat += (result & 1) ? ~(result >> 1) : (result >> 1);

        // Decodifica longitude
        shift = 0;
        result = 0;
        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        lng += (result & 1) ? ~(result >> 1) : (result >> 1);

        // ⚠️ Escala 1e6 (Valhalla). Retorna [lng, lat] (MapLibre).
        coords.push([lng / 1e6, lat / 1e6]);
    }

    return coords;
}
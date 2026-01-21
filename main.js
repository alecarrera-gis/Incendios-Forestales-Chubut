/**
 * Visor simple de tiles estáticos de Sentinel-2
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Iniciando visor de incendios...');

    // Crear el mapa centrado en la zona de Chubut
    const map = L.map('map', {
        center: [-42.73, -71.69],
        zoom: 12,
        minZoom: 12,
        maxZoom: 12
    });

    // Capa base de OpenStreetMap (opcional, para referencia)
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Capa de tiles de Sentinel-2 (carpeta 20260119)
    const sentinel2Layer = L.tileLayer('20260119/{z}/{x}/{y}.jpg', {
        maxZoom: 12,
        minZoom: 12,
        attribution: 'Sentinel-2 © Copernicus',
        tileSize: 256
      }).addTo(map);
    
map.setMinZoom(12);
map.setMaxZoom(12);
    // Control de capas
    const baseLayers = {
        'OpenStreetMap': osmLayer
    };

    const overlayLayers = {
        'Sentinel-2 (2026-01-19)': sentinel2Layer
    };

    L.control.layers(baseLayers, overlayLayers, { collapsed: false }).addTo(map);

    console.log('✅ Mapa inicializado correctamente');

    // Cuando tengas otra carpeta de tiles (ej: "20260125"), descomentá esto:
    /*
    const sentinel2Before = L.tileLayer('20260119/{z}/{x}/{y}.jpg', {
        maxZoom: 18,
        attribution: 'Sentinel-2 Antes'
    });

    const sentinel2After = L.tileLayer('20260125/{z}/{x}/{y}.jpg', {
        maxZoom: 18,
        attribution: 'Sentinel-2 Después'
    });

    // Control side-by-side
    L.control.sideBySide(sentinel2Before, sentinel2After).addTo(map);
    */
});

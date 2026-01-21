/**
 * Visor simple de tiles estáticos de Sentinel-2
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Iniciando visor de incendios...');

    // Crear el mapa centrado en la zona de Chubut
    const map = L.map('map', {
        center: [-42.73, -71.69],
        zoom: 14,
        minZoom: 12,
        maxZoom: 14
    });

    // Capa base de OpenStreetMap (opcional, para referencia)
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // ========================================
    // Capas de Sentinel-2 (4 fechas distintas)
    // ========================================
    
    const sentinel2_20260119 = L.tileLayer('20260119/{z}/{x}/{y}.jpg', {
        maxZoom: 14,
        minZoom: 12,
        attribution: 'Sentinel-2 © Copernicus',
        tileSize: 256
    });

    const sentinel2_20260109 = L.tileLayer('20260109/{z}/{x}/{y}.jpg', {
        maxZoom: 14,
        minZoom: 12,
        attribution: 'Sentinel-2 © Copernicus',
        tileSize: 256
    });

    const sentinel2_20260104 = L.tileLayer('20260104/{z}/{x}/{y}.jpg', {
        maxZoom: 14,
        minZoom: 12,
        attribution: 'Sentinel-2 © Copernicus',
        tileSize: 256
    });

    const sentinel2_20251125 = L.tileLayer('20251125/{z}/{x}/{y}.jpg', {
        maxZoom: 14,
        minZoom: 12,
        attribution: 'Sentinel-2 © Copernicus',
        tileSize: 256
    });

    // Agregar la más reciente por defecto
    sentinel2_20260119.addTo(map);

    // ========================================
    // Cargar el GeoJSON de áreas afectadas
    // ========================================
    
    fetch('Areas_afectadas.geojson')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: function (feature) {
                    return {
                        color: "#ff0000",      // Borde rojo
                        weight: 2,             // Grosor del borde
                        opacity: 0.8,          // Opacidad del borde
                        fillColor: "#ff7800",  // Relleno naranja
                        fillOpacity: 0.3       // Transparencia del relleno
                    };
                },
                onEachFeature: function (feature, layer) {
                    // Si el GeoJSON tiene propiedades, podés mostrarlas en un popup
                    if (feature.properties) {
                        let popupContent = '<strong>Área Afectada</strong><br>';
                        for (let key in feature.properties) {
                            popupContent += `${key}: ${feature.properties[key]}<br>`;
                        }
                        layer.bindPopup(popupContent);
                    }
                }
            }).addTo(map);
            console.log('✅ GeoJSON cargado correctamente');
        })
        .catch(error => console.error('❌ Error cargando el GeoJSON:', error));

    // ========================================
    // Control de capas
    // ========================================
    
    const baseLayers = {
        'OpenStreetMap': osmLayer
    };

    const overlayLayers = {
        'Sentinel-2 (19 Ene 2026)': sentinel2_20260119,
        'Sentinel-2 (09 Ene 2026)': sentinel2_20260109,
        'Sentinel-2 (04 Ene 2026)': sentinel2_20260104,
        'Sentinel-2 (25 Nov 2025)': sentinel2_20251125
    };

    L.control.layers(baseLayers, overlayLayers, { collapsed: false }).addTo(map);

    console.log('✅ Mapa inicializado correctamente');
});
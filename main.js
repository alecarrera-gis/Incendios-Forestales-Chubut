// Variables globales
let map;
let drawnItems;
let activeOrthoLayers = {};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Iniciando aplicación...');
    
    // 1. Inicializar Mapa
    map = L.map('map', {
        center: [-42.73, -71.69],
        zoom: 13,
        minZoom: 8,
        maxZoom: 14
    });

    // Capa base OSM
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // 2. Configurar checkboxes de ortomosaicos
    setupOrthoCheckboxes();

    // 3. Cargar GeoJSON de áreas afectadas
    cargarGeoJSON();
    
    console.log('✅ Aplicación iniciada correctamente');
});

/**
 * Configura los checkboxes de ortomosaicos
 */
function setupOrthoCheckboxes() {
    const checkboxes = document.querySelectorAll('.ortho-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const folderName = this.value; // Ej: "20251125 Sentinel"
            const layerName = this.getAttribute('data-name'); // Ej: "20251125"
            
            if (this.checked) {
                // Crear y agregar la capa
                // IMPORTANTE: Asegúrate de que la ruta sea correcta
                const tileUrl = `./${encodeURIComponent(folderName)}/{z}/{x}/{y}.png`;
                
                const layer = L.tileLayer(tileUrl, {
                    maxZoom: 14,
                    minZoom: 8,
                    attribution: `Sentinel-2 ${layerName} © Copernicus`,
                    // Opciones importantes para evitar problemas de carga
                    tileSize: 256,
                    noWrap: true,
                    detectRetina: false,
                    crossOrigin: true
                });
                
                layer.addTo(map);
                activeOrthoLayers[layerName] = layer;
                console.log(`✅ Capa ${layerName} activada`);
                console.log(`🔗 URL de ejemplo: ./${encodeURIComponent(folderName)}/13/2462/160.png`);
            } else {
                // Remover la capa
                if (activeOrthoLayers[layerName]) {
                    map.removeLayer(activeOrthoLayers[layerName]);
                    delete activeOrthoLayers[layerName];
                    console.log(`❌ Capa ${layerName} desactivada`);
                }
            }
        });
    });
}

/**
 * Carga el GeoJSON de áreas afectadas
 */
function cargarGeoJSON() {
    fetch('Areas_afectadas.geojson')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: function () {
                    return {
                        color: "#ff0000",
                        weight: 2,
                        opacity: 0.8,
                        fillOpacity: 0
                    };
                },
                onEachFeature: function (feature, layer) {
                    if (feature.properties) {
                        let popupContent = '<strong>Área Afectada</strong><br>';
                        for (let key in feature.properties) {
                            popupContent += `<strong>${key}:</strong> ${feature.properties[key]}<br>`;
                        }
                        layer.bindPopup(popupContent);
                    }
                }
            }).addTo(map);
            console.log('✅ GeoJSON cargado correctamente');
        })
        .catch(error => {
            console.error('❌ Error cargando el GeoJSON:', error);
            console.log('ℹ️ Asegurate de que el archivo Areas_afectadas.geojson esté en la raíz del proyecto');
        });
}
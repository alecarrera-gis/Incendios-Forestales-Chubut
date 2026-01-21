/**
 * Visor de Incendios con Comparador Side-by-Side
 */

// Variables globales para el comparador
let sideBySideControl = null;
let isComparing = false;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Iniciando visor de incendios...');

    // Crear el mapa centrado en la zona de Chubut
    const map = L.map('map', {
        center: [-42.73, -71.69],
        zoom: 14,
        minZoom: 12,
        maxZoom: 14
    });

    // Hacer el mapa accesible globalmente
    window.map = map;

    // Capa base de OpenStreetMap
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

    // Hacer las capas accesibles globalmente
    window.layers = {
        '20260119': sentinel2_20260119,
        '20260109': sentinel2_20260109,
        '20260104': sentinel2_20260104,
        '20251125': sentinel2_20251125
    };

    // ========================================
    // Cargar el GeoJSON de áreas afectadas
    // ========================================
    
    fetch('Areas_afectadas.geojson')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: function (feature) {
                    return {
                        color: "#ff0000",
                        weight: 2,
                        opacity: 0.8,
                        fillColor: "#ff7800",
                        fillOpacity: 0.3
                    };
                },
                onEachFeature: function (feature, layer) {
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

    // ========================================
    // Panel de Comparación
    // ========================================
    
    createComparisonPanel();

    console.log('✅ Mapa inicializado correctamente');
});

/**
 * Crea el panel de comparación con selectores
 */
function createComparisonPanel() {
    const panel = document.createElement('div');
    panel.id = 'comparison-panel';
    panel.innerHTML = `
        <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); position: absolute; top: 10px; right: 10px; z-index: 1000; min-width: 250px;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px;">🔍 Comparador</h3>
            
            <div style="margin-bottom: 10px;">
                <label style="font-size: 12px; font-weight: bold;">Imagen Izquierda:</label>
                <select id="left-layer" style="width: 100%; padding: 5px; margin-top: 3px;">
                    <option value="20251125">25 Nov 2025 (Antes)</option>
                    <option value="20260104">04 Ene 2026</option>
                    <option value="20260109">09 Ene 2026</option>
                    <option value="20260119">19 Ene 2026</option>
                </select>
            </div>
            
            <div style="margin-bottom: 10px;">
                <label style="font-size: 12px; font-weight: bold;">Imagen Derecha:</label>
                <select id="right-layer" style="width: 100%; padding: 5px; margin-top: 3px;">
                    <option value="20251125">25 Nov 2025</option>
                    <option value="20260104">04 Ene 2026</option>
                    <option value="20260109">09 Ene 2026</option>
                    <option value="20260119" selected>19 Ene 2026 (Después)</option>
                </select>
            </div>
            
            <button id="btn-start-compare" onclick="startComparison()" style="width: 100%; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-bottom: 5px;">
                ▶ Iniciar Comparación
            </button>
            
            <button id="btn-stop-compare" onclick="stopComparison()" style="width: 100%; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; display: none;">
                ⏹ Detener Comparación
            </button>
        </div>
    `;
    document.body.appendChild(panel);
}

/**
 * Inicia la comparación side-by-side
 */
function startComparison() {
    const leftLayerId = document.getElementById('left-layer').value;
    const rightLayerId = document.getElementById('right-layer').value;

    if (leftLayerId === rightLayerId) {
        alert('⚠️ Seleccioná dos fechas diferentes para comparar');
        return;
    }

    const map = window.map;
    const leftLayer = window.layers[leftLayerId];
    const rightLayer = window.layers[rightLayerId];

    // Limpiar capas anteriores
    map.eachLayer(layer => {
        if (layer instanceof L.TileLayer && layer !== map._layers[Object.keys(map._layers)[0]]) {
            map.removeLayer(layer);
        }
    });

    // Agregar las capas seleccionadas
    leftLayer.addTo(map);
    rightLayer.addTo(map);

    // Crear el control side-by-side
    try {
        sideBySideControl = L.control.sideBySide(leftLayer, rightLayer);
        sideBySideControl.addTo(map);
        
        isComparing = true;
        document.getElementById('btn-start-compare').style.display = 'none';
        document.getElementById('btn-stop-compare').style.display = 'block';
        
        console.log('✅ Comparación iniciada');
    } catch (error) {
        console.error('❌ Error al iniciar comparación:', error);
        alert('Error al crear el comparador. Verificá la consola.');
    }
}

/**
 * Detiene la comparación
 */
function stopComparison() {
    if (sideBySideControl) {
        const map = window.map;
        map.removeControl(sideBySideControl);
        sideBySideControl = null;
        
        // Limpiar capas
        map.eachLayer(layer => {
            if (layer instanceof L.TileLayer && layer !== map._layers[Object.keys(map._layers)[0]]) {
                map.removeLayer(layer);
                
                // Limpiar el clip CSS
                if (layer.getContainer) {
                    const container = layer.getContainer();
                    if (container) {
                        container.style.clip = '';
                    }
                }
            }
        });
        
        // Restaurar la capa más reciente
        window.layers['20260119'].addTo(map);
        
        isComparing = false;
        document.getElementById('btn-start-compare').style.display = 'block';
        document.getElementById('btn-stop-compare').style.display = 'none';
        
        console.log('❌ Comparación detenida');
    }
}
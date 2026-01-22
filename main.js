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
        minZoom: 8,
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
    
    const sentinel2_20260119 = L.tileLayer('20260119 Sentinel/{z}/{x}/{y}.jpg', {
        maxZoom: 14,
        minZoom: 8,
        attribution: 'Sentinel-2 © Copernicus',
        tileSize: 256,
        className: 'sentinel-layer' // Para aplicar el filtro de transparencia
    });

    const sentinel2_20260109 = L.tileLayer('20260109 Sentinel/{z}/{x}/{y}.jpg', {
        maxZoom: 14,
        minZoom: 8,
        attribution: 'Sentinel-2 © Copernicus',
        tileSize: 256,
        className: 'sentinel-layer'
    });

    const sentinel2_20260104 = L.tileLayer('20260104 Sentinel/{z}/{x}/{y}.jpg', {
        maxZoom: 14,
        minZoom: 8,
        attribution: 'Sentinel-2 © Copernicus',
        tileSize: 256,
        className: 'sentinel-layer'
    });

    const sentinel2_20251125 = L.tileLayer('20251125 Sentinel/{z}/{x}/{y}.jpg', {
        maxZoom: 14,
        minZoom: 8,
        attribution: 'Sentinel-2 © Copernicus',
        tileSize: 256,
        className: 'sentinel-layer'
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
    // Aplicar filtro de transparencia a las capas Sentinel
    // ========================================
    applyTransparencyFilter();

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
    // Panel de Comparación con Checkboxes
    // ========================================
    
    createComparisonPanel();

    console.log('✅ Mapa inicializado correctamente');
});

/**
 * Aplica filtro CSS para hacer transparente el blanco en las imágenes Sentinel
 */
function applyTransparencyFilter() {
    const style = document.createElement('style');
    style.innerHTML = `
        .sentinel-layer {
            mix-blend-mode: multiply;
            opacity: 0.95;
        }
        
        /* Alternativa más agresiva (descomentá si la anterior no funciona bien) */
        /*
        .sentinel-layer img {
            filter: brightness(1.1) contrast(1.1);
            mix-blend-mode: darken;
        }
        */
    `;
    document.head.appendChild(style);
    console.log('✅ Filtro de transparencia aplicado');
}

/**
 * Crea el panel de comparación con checkboxes
 */
function createComparisonPanel() {
    const panel = document.createElement('div');
    panel.id = 'comparison-panel';
    panel.innerHTML = `
        <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); position: absolute; top: 10px; right: 10px; z-index: 1000; min-width: 280px;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px;">🔍 Comparador de Imágenes</h3>
            
            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold;">Seleccioná 2 imágenes para comparar:</p>
                
                <label style="display: block; margin-bottom: 5px; font-size: 12px; cursor: pointer;">
                    <input type="checkbox" class="compare-checkbox" value="20251125" style="margin-right: 5px;">
                    25 Nov 2025 (Antes del incendio)
                </label>
                
                <label style="display: block; margin-bottom: 5px; font-size: 12px; cursor: pointer;">
                    <input type="checkbox" class="compare-checkbox" value="20260104" style="margin-right: 5px;">
                    04 Ene 2026
                </label>
                
                <label style="display: block; margin-bottom: 5px; font-size: 12px; cursor: pointer;">
                    <input type="checkbox" class="compare-checkbox" value="20260109" style="margin-right: 5px;">
                    09 Ene 2026
                </label>
                
                <label style="display: block; margin-bottom: 5px; font-size: 12px; cursor: pointer;">
                    <input type="checkbox" class="compare-checkbox" value="20260119" style="margin-right: 5px;">
                    19 Ene 2026 (Más reciente)
                </label>
            </div>
            
            <button id="btn-start-compare" onclick="startComparison()" style="width: 100%; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-bottom: 5px;">
                ▶ Iniciar Comparación
            </button>
            
            <button id="btn-stop-compare" onclick="stopComparison()" style="width: 100%; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; display: none;">
                ⏹ Detener Comparación
            </button>
            
            <p id="compare-status" style="margin: 8px 0 0 0; font-size: 11px; color: #666; text-align: center;"></p>
        </div>
    `;
    document.body.appendChild(panel);

    // Listener para actualizar el contador y limitar a 2 selecciones
    document.querySelectorAll('.compare-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checked = document.querySelectorAll('.compare-checkbox:checked');
            
            // Si ya hay 2 seleccionados, deshabilitar los demás
            if (checked.length >= 2) {
                document.querySelectorAll('.compare-checkbox:not(:checked)').forEach(cb => {
                    cb.disabled = true;
                });
            } else {
                document.querySelectorAll('.compare-checkbox').forEach(cb => {
                    cb.disabled = false;
                });
            }
            
            updateCompareStatus();
        });
    });
    
    updateCompareStatus();
}

/**
 * Actualiza el mensaje de estado según cuántas capas están seleccionadas
 */
function updateCompareStatus() {
    const checked = document.querySelectorAll('.compare-checkbox:checked');
    const status = document.getElementById('compare-status');
    
    if (checked.length === 0) {
        status.textContent = 'Seleccioná 2 imágenes';
        status.style.color = '#666';
    } else if (checked.length === 1) {
        status.textContent = 'Seleccioná 1 imagen más';
        status.style.color = '#ff9800';
    } else if (checked.length === 2) {
        status.textContent = '✓ Listo para comparar';
        status.style.color = '#28a745';
    }
}

/**
 * Inicia la comparación side-by-side
 */
function startComparison() {
    const checked = document.querySelectorAll('.compare-checkbox:checked');
    
    if (checked.length !== 2) {
        alert('⚠️ Tenés que seleccionar exactamente 2 imágenes para comparar');
        return;
    }

    const map = window.map;
    const leftLayerId = checked[0].value;
    const rightLayerId = checked[1].value;
    
    const leftLayer = window.layers[leftLayerId];
    const rightLayer = window.layers[rightLayerId];

    console.log('Comparando:', leftLayerId, 'vs', rightLayerId);

    // Limpiar capas de Sentinel-2 anteriores (mantener OSM)
    map.eachLayer(layer => {
        if (layer instanceof L.TileLayer && layer._url && layer._url.includes('Sentinel')) {
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
        
        // Deshabilitar checkboxes durante la comparación
        document.querySelectorAll('.compare-checkbox').forEach(cb => cb.disabled = true);
        
        console.log('✅ Comparación iniciada');
    } catch (error) {
        console.error('❌ Error al iniciar comparación:', error);
        alert('Error al crear el comparador: ' + error.message);
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
        
        // Limpiar capas de Sentinel-2
        map.eachLayer(layer => {
            if (layer instanceof L.TileLayer && layer._url && layer._url.includes('Sentinel')) {
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
        
        // Rehabilitar checkboxes y limpiar selección
        document.querySelectorAll('.compare-checkbox').forEach(cb => {
            cb.disabled = false;
            cb.checked = false;
        });
        
        updateCompareStatus();
        
        console.log('❌ Comparación detenida');
    }
}

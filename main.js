/**
 * Visor de Incendios Forestales - Chubut
 * Versión GitHub Pages con Side-by-Side funcional
 */

// Variables globales para el comparador
let sideBySideControl = null;
let comparisonLayers = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log('Iniciando visor de incendios...');

    // Crear el mapa centrado en la zona de Chubut
    const map = L.map('map', {
        center: [-42.73, -71.69],
        zoom: 13,
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
    // NO SE AGREGAN AL MAPA AUTOMÁTICAMENTE
    // ========================================
    
    const sentinel2_20260119 = L.tileLayer('20260119 Sentinel/{z}/{x}/{y}.jpg', {
        maxZoom: 14,
        minZoom: 8,
        attribution: 'Sentinel-2 © Copernicus',
        tileSize: 256,
        className: 'sentinel-layer'
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

    // Hacer las capas accesibles globalmente
    window.layers = {
        '20260119': sentinel2_20260119,
        '20260109': sentinel2_20260109,
        '20260104': sentinel2_20260104,
        '20251125': sentinel2_20251125
    };

    // ========================================
    // Aplicar filtro de transparencia
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
                        fillOpacity: 0
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
    // Listeners para los checkboxes
    // ========================================
    setupLayerCheckboxes();

    // ========================================
    // Botones de comparación
    // ========================================
    const btnCompare = document.getElementById('btn-compare-orthos');
    const btnStop = document.getElementById('btn-stop-compare');
    
    if (btnCompare) btnCompare.addEventListener('click', startComparison);
    if (btnStop) btnStop.addEventListener('click', stopComparison);

    console.log('✅ Mapa inicializado correctamente');
});

/**
 * Aplica filtro CSS para hacer transparente el blanco
 */
function applyTransparencyFilter() {
    const style = document.createElement('style');
    style.innerHTML = `
        .sentinel-layer {
            mix-blend-mode: multiply;
            opacity: 0.95;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Configura los checkboxes para mostrar/ocultar capas
 */
function setupLayerCheckboxes() {
    const checkboxes = document.querySelectorAll('.ortho-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const layerId = this.value;
            const layer = window.layers[layerId];
            const map = window.map;
            
            if (this.checked) {
                layer.addTo(map);
                console.log(`✅ Capa ${layerId} agregada`);
            } else {
                map.removeLayer(layer);
                console.log(`❌ Capa ${layerId} removida`);
            }
        });
    });
}

/**
 * Inicia la comparación side-by-side
 */
function startComparison() {
    const checkedBoxes = document.querySelectorAll('.ortho-checkbox:checked');
    
    if (checkedBoxes.length < 2) {
        alert('⚠️ Necesitás activar al menos 2 ortomosaicos para comparar');
        return;
    }

    const map = window.map;
    const layerLeft = window.layers[checkedBoxes[0].value];
    const layerRight = window.layers[checkedBoxes[1].value];

    if (!layerLeft || !layerRight) {
        alert('❌ Error al obtener las capas seleccionadas');
        return;
    }

    try {
        // 1. Limpieza previa
        stopComparison();

        // 2. Crear Panes personalizados
        if (!map.getPane('leftPane')) map.createPane('leftPane');
        if (!map.getPane('rightPane')) map.createPane('rightPane');
        map.getPane('leftPane').style.zIndex = 401;
        map.getPane('rightPane').style.zIndex = 402;

        // 3. Asignar capas a los panes
        layerLeft.options.pane = 'leftPane';
        layerRight.options.pane = 'rightPane';

        // 4. Remover y re-agregar para forzar el cambio de pane
        map.removeLayer(layerLeft);
        map.removeLayer(layerRight);
        map.addLayer(layerLeft);
        map.addLayer(layerRight);

        // 5. Crear el control side-by-side
        sideBySideControl = L.control.sideBySide(layerLeft, layerRight);
        
        // 6. Sobreescribir el método _updateClip para que funcione con panes
        sideBySideControl._updateClip = function() {
            const map = this._map;
            if (!map) return;
            
            const nw = map.containerPointToLayerPoint([0, 0]);
            const se = map.containerPointToLayerPoint(map.getSize());
            const clipX = nw.x + (this._range.value * map.getSize().x);
            const dividerX = this._range.value * map.getSize().x;
            
            this._divider.style.left = dividerX + 'px';

            const clipLeft = `rect(${nw.y}px, ${clipX}px, ${se.y}px, ${nw.x}px)`;
            const clipRight = `rect(${nw.y}px, ${se.x}px, ${se.y}px, ${clipX}px)`;

            map.getPane('leftPane').style.clip = clipLeft;
            map.getPane('rightPane').style.clip = clipRight;
        };

        // 7. Agregar al mapa
        sideBySideControl.addTo(map);

        // 8. Cambiar botones
        document.getElementById('btn-compare-orthos').style.display = 'none';
        document.getElementById('btn-stop-compare').style.display = 'block';

        comparisonLayers = [layerLeft, layerRight];
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
    const map = window.map;
    if (!map) return;

    // 1. Quitar control
    if (sideBySideControl) {
        try {
            map.removeControl(sideBySideControl);
        } catch (e) {
            console.warn('Error al remover control:', e);
        }
    }

    // 2. Limpiar elementos del DOM
    document.querySelectorAll('.leaflet-sbs').forEach(el => el.remove());

    // 3. Limpiar clips de los panes
    if (map.getPane('leftPane')) map.getPane('leftPane').style.clip = '';
    if (map.getPane('rightPane')) map.getPane('rightPane').style.clip = '';

    // 4. Devolver capas al pane original
    comparisonLayers.forEach(layer => {
        if (layer) {
            layer.options.pane = 'tilePane';
            if (map.hasLayer(layer)) {
                map.removeLayer(layer);
                map.addLayer(layer);
            }
        }
    });

    // 5. Resetear variables y UI
    sideBySideControl = null;
    comparisonLayers = [];
    
    document.getElementById('btn-compare-orthos').style.display = 'block';
    document.getElementById('btn-stop-compare').style.display = 'none';
    
    map.invalidateSize();
    console.log('❌ Comparación detenida');
}

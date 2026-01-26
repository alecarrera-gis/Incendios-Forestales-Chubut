/**
 * Lógica principal de la aplicación - Versión Limpia (Sin Slider)
 */

// Variables globales para el perfil de elevación
let elevChart;
let drawnItems;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Iniciando aplicación...');
    
    // 1. Inicializar Mapa 2D
    const map2dObj = new Map2D('map-2d');
    window.map2d = map2dObj;

    // 2. Inicializar Control de Capas
    if (window.LayerControl) {
        const layerControl = new LayerControl(map2dObj);
        window.layerControl = layerControl;
    }

    // 3. Configurar navegación
    setupNavigation();

    // 4. Inicializar herramientas de dibujo
    setTimeout(() => {
        if (map2dObj.map) {
            initDrawTools(map2dObj.map);
        }
    }, 500);

    // 5. Inicializar arrastre del perfil
    initDragProfile();
    
    // 6. Cargar GeoJSON de áreas afectadas
    cargarGeoJSON(map2dObj.map);
});

/**
 * Carga el GeoJSON de áreas afectadas con estilo de solo borde
 */
function cargarGeoJSON(map) {
    fetch('Areas_afectadas.geojson')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: function (feature) {
                    return {
                        color: "#ff0000",
                        weight: 2,
                        opacity: 0.8,
                        fillOpacity: 0 // Sin relleno
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
}

/**
 * Inicializa las herramientas de dibujo de Leaflet.Draw
 */
function initDrawTools(map) {
    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
        edit: { featureGroup: drawnItems },
        draw: {
            polyline: { 
                shapeOptions: { color: '#f39c12', weight: 4 },
                metric: true,
                feet: false
            },
            polygon: false,
            rectangle: false,
            circle: false,
            marker: false,
            circlemarker: false
        }
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, async (e) => {
        drawnItems.clearLayers();
        drawnItems.addLayer(e.layer);

        if (e.layerType !== 'polyline') return;

        const coordinates = e.layer.getLatLngs().map(p => [p.lng, p.lat]);
        const demCheckboxes = document.querySelectorAll('#dem-layers input[type="checkbox"]:checked');
        const activeDems = Array.from(demCheckboxes).map(cb => cb.value);

        if (activeDems.length === 0) {
            alert('Activá al menos un DEM para generar el perfil');
            return;
        }

        try {
            const requests = activeDems.map(dem =>
                fetch('http://localhost:3001/api/elevation/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        coordinates,
                        file: dem,
                        numSamples: 100
                    })
                }).then(r => r.json())
            );

            const results = await Promise.all(requests);
            renderMultiElevChart(results, activeDems);

        } catch (err) {
            console.error(err);
            alert('Error al obtener perfiles');
        }
    });
}

/**
 * Configura la navegación entre vistas
 */
function setupNavigation() {
    const btn2d = document.getElementById('btn-2d');
    const btn3d = document.getElementById('btn-3d');
    const map2dContainer = document.getElementById('map-2d');
    const map3dContainer = document.getElementById('map-3d');

    if (btn2d) {
        btn2d.addEventListener('click', () => {
            map2dContainer.style.display = 'block';
            map3dContainer.style.display = 'none';
            btn2d.classList.add('active');
            btn3d.classList.remove('active');
        });
    }

    if (btn3d) {
        btn3d.addEventListener('click', () => {
            alert('Vista 3D en desarrollo');
        });
    }
}

/**
 * Renderiza el gráfico de elevación
 */
function renderMultiElevChart(results, demNames) {
    const ctx = document.getElementById('elevChart');
    if (!ctx) return;

    if (elevChart) elevChart.destroy();

    const colors = ['#2c7be5', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6'];
    const datasets = results.map((res, idx) => {
        const rawProfile = res.profile || [];
        const cleanData = rawProfile
            .filter(p => p.elevation !== null && p.elevation !== undefined)
            .map(p => ({ x: parseFloat(p.distance), y: parseFloat(p.elevation) }))
            .filter(p => !isNaN(p.x) && !isNaN(p.y))
            .sort((a, b) => a.x - b.x);

        return {
            label: demNames[idx].replace('_cog.tif', ''),
            data: cleanData,
            borderColor: colors[idx % colors.length],
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.2
        };
    });

    document.getElementById('profileContainer').style.display = 'flex';

    elevChart = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top' }
            },
            scales: {
                x: { type: 'linear', title: { display: true, text: 'Distancia (m)' } },
                y: { title: { display: true, text: 'Elevación (m)' } }
            }
        }
    });
}

function closeProfile() {
    document.getElementById('profileContainer').style.display = 'none';
    if (drawnItems) drawnItems.clearLayers();
    if (elevChart) elevChart.destroy();
}

function initDragProfile() {
    const dragItem = document.getElementById('profileContainer');
    const dragHeader = document.getElementById('profileHeader');
    if (!dragItem || !dragHeader) return;

    let active = false, currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

    dragHeader.addEventListener('mousedown', (e) => {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        if (e.target === dragHeader || dragHeader.contains(e.target)) active = true;
    });
    document.addEventListener('mouseup', () => {
        initialX = currentX; initialY = currentY; active = false;
    });
    document.addEventListener('mousemove', (e) => {
        if (active) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX; yOffset = currentY;
            dragItem.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        }
    });
}
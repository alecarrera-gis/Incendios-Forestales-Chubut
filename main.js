// Variables globales
let map;
let drawnItems;
let elevChart;
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

    // 3. Configurar botones de herramientas
    setupToolButtons();

    // 4. Cargar GeoJSON de áreas afectadas
    cargarGeoJSON();

    // 5. Inicializar arrastre del perfil
    initDragProfile();
    
    console.log('✅ Aplicación iniciada correctamente');
});

/**
 * Configura los checkboxes de ortomosaicos
 */
function setupOrthoCheckboxes() {
    const checkboxes = document.querySelectorAll('.ortho-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const folderName = this.value;
            const layerName = this.getAttribute('data-name');
            
            if (this.checked) {
                // Crear y agregar la capa
                const tileUrl = `${encodeURIComponent(folderName)}/{z}/{x}/{y}.png`;
                const layer = L.tileLayer(tileUrl, {
                    maxZoom: 14,
                    minZoom: 8,
                    attribution: `Sentinel-2 ${layerName} © Copernicus`
                });
                
                layer.addTo(map);
                activeOrthoLayers[layerName] = layer;
                console.log(`✅ Capa ${layerName} activada`);
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
 * Configura los botones de herramientas
 */
function setupToolButtons() {
    // Botón para dibujar
    document.getElementById('btn-draw').addEventListener('click', () => {
        initDrawTools();
        alert('Modo dibujo activado. Dibujá una línea en el mapa para generar el perfil.');
    });
    
    // Botón para limpiar
    document.getElementById('btn-clear').addEventListener('click', () => {
        if (drawnItems) {
            drawnItems.clearLayers();
        }
        closeProfile();
    });
}

/**
 * Inicializa las herramientas de dibujo
 */
function initDrawTools() {
    // Limpiar herramientas anteriores si existen
    if (drawnItems) {
        map.removeLayer(drawnItems);
    }
    
    // Crear nuevo grupo de elementos dibujados
    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    
    // Configurar control de dibujo
    const drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems,
            remove: true
        },
        draw: {
            polyline: {
                shapeOptions: {
                    color: '#f39c12',
                    weight: 4
                },
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
    
    // Agregar control al mapa
    map.addControl(drawControl);
    
    // Escuchar eventos de dibujo
    map.on(L.Draw.Event.CREATED, (e) => {
        const layer = e.layer;
        drawnItems.addLayer(layer);
        
        // Si es una línea, generar perfil simulado
        if (e.layerType === 'polyline') {
            generateSimulatedProfile(layer);
        }
        
        // Remover el control de dibujo después de crear
        map.removeControl(drawControl);
    });
}

/**
 * Genera un perfil de elevación simulado (para demo)
 */
function generateSimulatedProfile(polylineLayer) {
    const latlngs = polylineLayer.getLatLngs();
    
    if (latlngs.length < 2) {
        alert('La línea debe tener al menos 2 puntos');
        return;
    }
    
    // Calcular distancia total aproximada
    let totalDistance = 0;
    for (let i = 1; i < latlngs.length; i++) {
        const prev = latlngs[i-1];
        const curr = latlngs[i];
        totalDistance += prev.distanceTo(curr);
    }
    
    // Generar datos simulados del perfil
    const profileData = [];
    const numPoints = 50;
    
    for (let i = 0; i <= numPoints; i++) {
        const distance = (totalDistance / numPoints) * i;
        // Simular elevación con variaciones
        const elevation = 500 + Math.sin(i * 0.3) * 200 + Math.random() * 50;
        
        profileData.push({
            x: distance,
            y: elevation
        });
    }
    
    // Mostrar el gráfico
    renderElevationChart(profileData, totalDistance);
}

/**
 * Renderiza el gráfico de elevación
 */
function renderElevationChart(data, totalDistance) {
    const ctx = document.getElementById('elevChart');
    if (!ctx) return;
    
    // Destruir gráfico anterior si existe
    if (elevChart) {
        elevChart.destroy();
    }
    
    // Configurar el gráfico
    const chartConfig = {
        type: 'line',
        data: {
            datasets: [{
                label: 'Perfil de Elevación',
                data: data,
                borderColor: '#2c7be5',
                backgroundColor: 'rgba(44, 123, 229, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Distancia (metros)'
                    },
                    min: 0,
                    max: totalDistance
                },
                y: {
                    title: {
                        display: true,
                        text: 'Elevación (metros)'
                    },
                    beginAtZero: false
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `Elevación: ${context.parsed.y.toFixed(1)} m`;
                        }
                    }
                }
            }
        }
    };
    
    elevChart = new Chart(ctx, chartConfig);
    
    // Mostrar el contenedor del perfil
    document.getElementById('profileContainer').style.display = 'flex';
}

/**
 * Cierra el panel del perfil
 */
function closeProfile() {
    document.getElementById('profileContainer').style.display = 'none';
    if (elevChart) {
        elevChart.destroy();
        elevChart = null;
    }
}

/**
 * Inicializa el arrastre del panel de perfil
 */
function initDragProfile() {
    const dragItem = document.getElementById('profileContainer');
    const dragHeader = document.getElementById('profileHeader');
    if (!dragItem || !dragHeader) return;

    let isDragging = false;
    let currentX, currentY, initialX, initialY;

    dragHeader.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);

    function startDragging(e) {
        isDragging = true;
        initialX = e.clientX - dragItem.offsetLeft;
        initialY = e.clientY - dragItem.offsetTop;
        dragHeader.style.cursor = 'grabbing';
    }

    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        // Limitar el arrastre dentro de la ventana
        const maxX = window.innerWidth - dragItem.offsetWidth;
        const maxY = window.innerHeight - dragItem.offsetHeight;
        
        currentX = Math.max(0, Math.min(currentX, maxX));
        currentY = Math.max(0, Math.min(currentY, maxY));
        
        dragItem.style.left = currentX + 'px';
        dragItem.style.top = currentY + 'px';
    }

    function stopDragging() {
        isDragging = false;
        dragHeader.style.cursor = 'move';
    }
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
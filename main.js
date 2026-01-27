L.TileLayer.WhiteTransparent = L.TileLayer.extend({
    createTile: function(coords, done) {
        const tile = document.createElement('canvas');
        tile.width = tile.height = 256;
        const ctx = tile.getContext('2d');
        const img = new Image();
        img.crossOrigin = ''; // Para evitar problemas CORS si es necesario
        
        img.onload = function() {
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, 256, 256);
            const data = imgData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];
                
                // Calcular luminosidad aproximada (escala de grises)
                const luminosity = 0.299 * r + 0.587 * g + 0.114 * b;
                
                // Condición para hacer transparente:
                // - Luminosidad alta (muy claro)
                // - Y los colores no muy saturados (diferencia entre RGB pequeña)
                const maxRGB = Math.max(r, g, b);
                const minRGB = Math.min(r, g, b);
                const diff = maxRGB - minRGB;
                
                if (luminosity > 220 && diff < 30) {
                    data[i + 3] = 0; // Transparente
                }
            }
            
            ctx.putImageData(imgData, 0, 0);
            done(null, tile);
        };
        
        img.onerror = function() {
            done(new Error('Error cargando tile'));
        };
        
        img.src = this.getTileUrl(coords);
        return tile;
    }
});

// Función auxiliar para crear la capa fácilmente
L.tileLayer.whiteTransparent = function(url, options) {
    return new L.TileLayer.WhiteTransparent(url, options);
};

document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map', {
        center: [-42.4530,-71.6061],
        zoom: 10,
        minZoom: 8,
        maxZoom: 14,
        zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const activeLayers = {};

    // PRIORIDAD: Los números más altos quedan ARRIBA (tapan a los bajos)
    const layerPriority = {
        "20251125 Sentinel": 10,
        "20260104 Sentinel": 20,
        "20260109 Sentinel": 30,
        "20260119 Sentinel": 40,
        "20260124 Sentinel": 50
    };

    const checkboxes = document.querySelectorAll('.ortho-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const folder = this.value;
            
            if (this.checked) {
                // Usamos nuestra nueva capa de transparencia real
                const layer = L.tileLayer.whiteTransparent(`./${folder}/{z}/{x}/{y}.jpg`, {
                    maxZoom: 14,
                    minZoom: 8,
                    zIndex: layerPriority[folder] || 1, // Esto hace que lo nuevo tape a lo viejo
                    attribution: 'Sentinel-2 © Copernicus'
                });
                
                layer.addTo(map);
                activeLayers[folder] = layer;
            } else {
                if (activeLayers[folder]) {
                    map.removeLayer(activeLayers[folder]);
                    delete activeLayers[folder];
                }
            }
        });
    });

    // Cargar GeoJSON (Bordes rojos de áreas afectadas)


    fetch('Areas_afectadas.geojson')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: {
                    color: "#ff0000",
                    weight: 3,
                    fillOpacity: 0, // Un toque de color adentro ayuda a poder hacer clic mejor
                    fillColor: "#ff0000"
                },
            onEachFeature: function (feature, layer) {
                if (feature.properties) {
                    let popupContent = '<div style="font-family: Arial; min-width: 150px;">';
                    popupContent += '<h4 style="margin:0 0 5px 0; color: #d32f2f;">🔥 Área Afectada</h4>';
                    popupContent += '<hr style="border: 0; border-top: 1px solid #eee;">';

                    for (let key in feature.properties) {
                        // AQUÍ AGREGAMOS LA EXCEPCIÓN:
                        // Si la clave es 'id', 'ID', 'fid' o cualquier otra que quieras ocultar, la saltamos
                        if (key.toLowerCase() !== 'id' && key.toLowerCase() !== 'fid') {
                            popupContent += `<strong>${key}:</strong> ${feature.properties[key]}<br>`;
                        }
                    }

                    popupContent += '</div>';
                    layer.bindPopup(popupContent);
                }
            }
            }).addTo(map);
            console.log('✅ GeoJSON con popups cargado');
        })
        .catch(error => console.error('❌ Error:', error));
});
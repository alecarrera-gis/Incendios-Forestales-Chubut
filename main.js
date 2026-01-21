// Crear el mapa centrado en tu zona
var map = L.map('map', {
  center: [-42.73, -71.69], // ajustar levemente si hace falta
  zoom: 12
});

// (Opcional) Agregar un fondo OSM tenue para referencia
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Capa "antes" desde tus tiles
var layerBefore = L.tileLayer('20251125/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: 'Sentinel-2 Copernicus (antes)'
});

// Capa "después" desde tus tiles
var layerAfter = L.tileLayer('200119/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: 'Sentinel-2 Copernicus (después)'
});

// Agregamos inicialmente solo una (por ejemplo, la de después)
layerAfter.addTo(map);

// Control de capas (por si querés alternar)
var baseLayers = {
  'OSM': osm
};

var overlayLayers = {
  'Antes (tiles)': layerBefore,
  'Después (tiles)': layerAfter
};

L.control.layers(baseLayers, overlayLayers, { collapsed: true }).addTo(map);

// Control Side-by-Side
L.control
  .sideBySide(layerBefore, layerAfter)
  .addTo(map);

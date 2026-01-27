# 🔥 Visor de Incendios Forestales - Chubut (Sentinel-2)

Este proyecto es un visor cartográfico interactivo desarrollado para monitorear la evolución de las áreas afectadas por incendios forestales en la provincia de Chubut, Argentina. Utiliza imágenes satelitales del programa **Copernicus Sentinel-2** y capas vectoriales de análisis de daños.

## 🚀 Demo
Puedes ver el visor funcionando aquí: (https://alecarrera-gis.github.io/Incendios-Forestales-Chubut/)

## 🛠️ Características Técnicas
- **Visualización Temporal:** Comparación de ortomosaicos satelitales en 5 fechas críticas (Nov 2025 - Ene 2026).
- **Transparencia Inteligente:** Procesamiento de imágenes para superponer capas sin perder visibilidad del terreno.
- **Datos Vectoriales:** Integración de archivos GeoJSON con información detallada de las áreas quemadas.
- **Interfaz Personalizada:** Barra lateral intuitiva para control de capas, eliminando los controles nativos de Leaflet para una experiencia más limpia.

## 🏗️ Stack Tecnológico
- **Leaflet.js:** Librería principal para el renderizado del mapa.
- **JavaScript (ES6+):** Lógica para manipulación de capas, z-index dinámico y filtrado de datos.
- **HTML5/CSS3:** Diseño responsivo y efectos de transparencia.
- **GitHub Pages:** Hosting del proyecto y gestión de tiles.

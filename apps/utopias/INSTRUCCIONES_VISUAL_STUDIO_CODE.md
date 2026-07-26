# Encuentra tu UTOPÍA más cercana

Geovisualizador web de las UTOPÍAS abiertas en la Ciudad de México. Incluye geolocalización, búsqueda, clasificación por distancia y rutas caminando, en vehículo o en transporte público.

## Requisitos

- Visual Studio Code.
- Node.js 22.13 o posterior.
- Conexión a internet para cargar el mapa y calcular rutas.

## Abrir y ejecutar

1. Descomprime el archivo ZIP.
2. Abre la carpeta completa en Visual Studio Code.
3. Abre **Terminal → Nueva terminal**.
4. Ejecuta:

```bash
npm install
npm run dev
```

5. Abre `http://localhost:5173` en el navegador.
6. Autoriza el acceso a tu ubicación.

Para detener el servidor presiona `Control + C`.

## Archivos principales

- `app/page.tsx`: sedes, coordenadas, filtros, mapa y rutas.
- `app/globals.css`: colores, tipografía y diseño adaptable.
- `app/layout.tsx`: título y metadatos del sitio.

## Modificar una sede

En `app/page.tsx`, busca la constante `UTOPIAS`. Cada sede incluye nombre, alcaldía, domicilio, latitud, longitud y fuente.

## Servicios externos

- Cartografía: OpenStreetMap.
- Rutas a pie: OSRM Foot.
- Rutas en vehículo: OSRM.
- Transporte público: Google Maps mediante una URL de indicaciones; no requiere clave API.

La ubicación del usuario se procesa en el navegador y no se guarda.

La configuración local funciona aunque la carpeta oculta `.openai` no esté presente.

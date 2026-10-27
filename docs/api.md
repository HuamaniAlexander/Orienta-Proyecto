# Contratos HTTP MVP 1

- GET /health: vivacidad del proceso; no comprueba proveedores.
- GET /api/ofertas: q, carrera_id, institucion_id, tipo_id, modalidad_id,
  distrito_id, area_id, page (1+), page_size (1–48), order (nombre/institucion).
  Respuesta: items, total, page, page_size. Todos los filtros se combinan por AND.
  Búsqueda sin tildes; cada palabra debe coincidir. Orden estable por oferta_id.
- GET /api/ofertas/{oferta_id}: oferta concreta y fuentes documentadas.
- GET /api/filtros: catálogos de filtros y conteos reales; caché de cinco minutos.
- POST /api/comparaciones: {"oferta_ids":[10,110]}. Exige dos IDs positivos
  distintos. Devuelve opciones frescas, criterios, diferencias documentadas,
  estado de misma carrera, pendientes y diferencia de duración solo si es homogénea.
- GET /api/ml/estado: disponibilidad, procedencia y alcance editorial.
- GET /api/ml/clasificar?nombre=...: clasificación auxiliar o abstención.

El recurso se llama oferta para no confundir oferta_id con carrera_id.
Errores: 404 opción inexistente, 422 parámetros inválidos, 503 persistencia
no disponible. Los errores del proveedor y las credenciales no llegan al cliente.
OpenAPI interactivo en /docs. El frontend nunca consulta InsForge directamente.

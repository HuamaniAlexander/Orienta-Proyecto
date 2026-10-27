# Plan MVP 1

## Diagnóstico inicial — 2026-10-26

Repositorio con un commit inicial y README; sin aplicación ni AGENTS.md. Se establece
`dev` local desde `main` y la rama `chore/ori-004-configuracion-base`.
No se modifica main. La publicación está bloqueada por permisos GitHub:
Git local se autentica como AlexHC21 (403); la integración HuamaniAlexander
devuelve Resource not accessible by integration al crear dev.

Se revisaron Excel, notebook y manifiestos del ZIP de Colab. Se localizaron
prototipos PC/tablet/celular y logo oficial en Descargas. Su revisión visual
corresponde a la etapa de interfaz. InsForge responde y no tiene tablas.

## Trazabilidad propuesta

El archivo ORIENTA_MVP1_Trello_80_tareas.csv aporta identificadores propuestos;
no acredita que las tarjetas existan en un tablero. No hay conexión Trello disponible.
El pedido actual usa `dev`; prevalece sobre `develop` mencionado en el CSV.

| Etapa | Referencia CSV | Entrega y dependencia |
|---|---|---|
| Configuración inicial | ORI-004, ORI-006, ORI-012 | Variables, CI, contratos de salud, plantillas y diagnóstico |
| Arquitectura y contratos | ORI-008, ORI-010 | Puertos y contratos HTTP; depende de base integrada |
| PostgreSQL e importación | ORI-009; resto por mapear | Migraciones, validación, idempotencia y rollback |
| Sistema visual e inicio | Por mapear | Logo oficial, tokens, responsive, inicio |
| Catálogo y detalle | Por mapear | Datos PostgreSQL, filtros URL y paginación |
| Comparador | Por mapear | Dos ofertas, diferencias y fuentes |
| Adaptador ML | Por mapear | Validación de artefactos y carga única por proceso |
| Gemini | Por mapear | Contexto acotado y respuesta validada, sin bloquear comparador |
| Verificación integrada | Por mapear | Responsive, accesibilidad, despliegue preparado |

Cada etapa usa rama y PR propios hacia dev. Un PR abierto queda en revisión;
ningún PR se fusiona automáticamente. No se agrupan funcionalidades posteriores
en la rama de configuración para evitar dependencias de PR no integrados.

## Recursos y límites

- Excel: 170 carreras, 414 ofertas, 23 instituciones, 27 sedes.
- Tarifas UCSS, registros MINEDU y BecaTEC requieren tratamiento separado.
- El logo se conserva; imágenes editoriales podrán ser WebP en el frontend.
  InsForge se reserva para PostgreSQL según el pedido; no se guardan binarios
  de imagen en tablas ni se configura Storage sin aclarar el alcance.
- Modelos, catálogo funcional, interfaz final, importación y Gemini aún pendientes.
- Las claves permanecen locales; el frontend solo tendrá VITE_API_BASE_URL.

## Evidencia de configuración

- Rama: chore/ori-004-configuracion-base; referencias CSV ORI-004/006/012.
- Frontend: lint, tipos y build ejecutados correctamente con Vite 6.4.5.
- npm audit tras corregir dependencias: cero vulnerabilidades reportadas.
- Backend: Ruff y mypy correctos; dos pruebas de salud/CORS correctas.
- Auditoría ML: dos pruebas negativas correctas y 21 archivos verificados.
- Docker no está instalado en el entorno; la imagen no fue construida localmente.
  GitHub Actions incluye su construcción, pendiente de publicación y ejecución.
- No se ejecutó QA responsive del producto: la pantalla actual es solo un
  marcador del entorno, no el diseño de inicio del MVP.
- PR pendiente: recuperar permisos de escritura del repositorio, publicar dev
  y la rama de configuración y abrir PR. No hay enlace de PR creado.

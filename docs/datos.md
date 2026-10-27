# Datos PostgreSQL

Fuente: Orienta_MVP1_Lima_Norte.xlsx entregado por el usuario. Se preservan IDs,
fechas y fuentes. El catálogo es una vista sobre tablas normalizadas; los textos
oficiales de cada oferta se conservan con su evidencia de sede.

La migración inicial es aditiva sobre la instancia vacía comprobada. No se crea
una rama de backend de pago para esta inicialización; no hay datos existentes
ni políticas de usuarios que modificar. Todas las tablas tienen RLS y se revocan
permisos anon/authenticated: FastAPI utiliza la clave administrativa solo en servidor.
No se requiere autenticación del estudiante.

Desde la raíz: `npx -y @insforge/cli db migrations up --all`.
Las migraciones viven en migrations/ porque es la ubicación del CLI de InsForge.
Desde backend:

```powershell
uv run python -m app.infrastructure.persistence.import_excel RUTA_AL_EXCEL
uv run python -m app.infrastructure.persistence.import_excel RUTA_AL_EXCEL --apply
```

Sin --apply solo valida. La importación llama una función PostgreSQL restringida
al administrador: un upsert de todo el libro dentro de una transacción. Cualquier
violación de claves o referencias revierte el lote completo. No elimina filas.

Tarifas UCSS se preservan como cálculos condicionados por créditos, categoría y
periodo; no se convierten en mensualidades de todas las instituciones.
Registro MINEDU y BecaTEC 2025 viven en tablas históricas distintas de ofertas.
Los campos editoriales no equivalen a mallas, perfiles oficiales ni garantía de empleo.

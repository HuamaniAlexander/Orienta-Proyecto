# ORIENTA

MVP para explorar y comparar opciones académicas de Lima Norte. El alcance
previsto incluye inicio, catálogo, filtros, detalle, comparación de dos ofertas
y explicación contextual con Gemini; no incluye cuentas ni test vocacional.

## Estado actual

Base de desarrollo React + TypeScript y FastAPI + Python, configuración de CI,
Docker y variables. Endpoint `GET /health`. El catálogo, PostgreSQL, ML y Gemini
están pendientes. No hay despliegue publicado.

La revisión inicial de Colab está en [docs/auditoria-ml.md](docs/auditoria-ml.md).
El orden de entrega y los bloqueos están en [docs/plan-mvp1.md](docs/plan-mvp1.md).

## Ejecución

Requisitos: Node 22.12+, Python 3.13, uv 0.11.0.

```powershell
Copy-Item .env.example .env
Copy-Item frontend/.env.example frontend/.env
cd backend
uv sync --frozen
uv run uvicorn app.main:app --reload
```

En otra terminal:

```powershell
cd frontend
npm ci
npm run dev
```

## Verificación

```powershell
cd backend
uv run ruff check .
uv run mypy app
uv run pytest
```

```powershell
cd frontend
npm run lint
npm run typecheck
npm run build
```

## Estructura y decisiones

- frontend/: React; organización por funcionalidades al implementarlas.
- backend/: FastAPI; dominio y casos de uso independientes de proveedores.
- ml/: instrucciones de artefactos; scripts/audit_ml.py valida el paquete recibido.
- docs/: [arquitectura](docs/arquitectura.md), [plan](docs/plan-mvp1.md),
  [despliegue](docs/despliegue.md) y [auditoría ML](docs/auditoria-ml.md).
- .github/: CI y plantilla de PR.

InsForge alojará PostgreSQL. No se deduce DATABASE_URL desde una API key.
El frontend solo conoce VITE_API_BASE_URL. Gemini se consumirá desde el backend.
Las migraciones e importación transaccional del Excel están pendientes.
El entrenamiento se realiza en Colab; no es un servidor para la aplicación.
El clasificador usa etiquetas editoriales y no predice éxito vocacional.

## Flujo de contribución

Ramas por tarea desde dev, commits Conventional Commits y PR hacia dev.
No se hacen cambios funcionales directos en main/dev ni se fusionan PR sin
autorización. Los identificadores del CSV Trello son referencias propuestas
hasta poder contrastarlos con el tablero real.

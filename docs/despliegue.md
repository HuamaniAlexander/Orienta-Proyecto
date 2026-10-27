# Desarrollo y despliegue

## Local

Node 22.12+ y Python 3.13; instalar uv 0.11.0. En la raíz copiar
`.env.example` a `.env` y completar secretos solo localmente.

Desde backend: `uv sync --frozen`, luego `uv run uvicorn app.main:app --reload`.
Desde frontend: `npm ci`, luego `npm run dev`.
Copiar frontend/.env.example a frontend/.env para configurar la URL de FastAPI.

## Vercel (preparado, sin publicar)

Root directory: frontend. Instalación npm ci; build npm run build; salida dist.
Configurar VITE_API_BASE_URL al backend de preview o producción según entorno.
frontend/vercel.json resuelve las rutas SPA.

## Render Docker (preparado, sin publicar)

Contexto backend, Dockerfile backend/Dockerfile. PORT lo proporciona Render.
Health check `/health` solo comprueba vivacidad; no llama a Gemini.
Configurar CORS_ORIGINS como array JSON con orígenes concretos, APP_ENV,
INSFORGE_BASE_URL y secretos únicamente en el entorno del servicio.
La integración PostgreSQL, migraciones, ML y Gemini aún no están implementadas.
No desplegar como MVP funcional hasta integrar y verificar esas etapas.

# Desarrollo y despliegue

## Local Windows

Node 22.12+, Python 3.13 y uv 0.11.0. Instalar backend con uv sync --frozen y
frontend con npm ci. Configurar .env de la raíz y frontend/.env según sus ejemplos.
Desde la raíz: .\scripts\start-local.ps1; opcional -NoBrowser.
No sobrescribir archivos .env existentes. Los puertos son 127.0.0.1:5173 y :8000.
El script no detiene procesos ajenos: conserva puertos ocupados y verifica respuestas.
Para detener una ejecución manual, usar Ctrl+C en cada terminal.

## Vercel (preparado, sin publicar)

- Root directory: frontend.
- Install: npm ci. Build: npm run build. Output: dist.
- VITE_API_BASE_URL: URL HTTPS real del backend del mismo ambiente.
- frontend/vercel.json resuelve las rutas SPA.
- Separar valores de preview y producción. En CORS_ORIGINS del backend registrar
  los orígenes concretos de cada frontend; no permitir cualquier dominio de Vercel.

## Render Docker (preparado, sin publicar)

- Runtime Docker; contexto backend; Dockerfile backend/Dockerfile.
- Imagen ejecutada como usuario orienta sin privilegios. Uvicorn escucha
  0.0.0.0 y ${PORT:-8000}, sin autoreload.
- Health check /ready. /health solo confirma vivacidad del proceso.
- Configurar APP_ENV=production, CORS_ORIGINS como array JSON,
  INSFORGE_BASE_URL, INSFORGE_API_KEY, GEMINI_API_KEY,
  GEMINI_MODEL=gemini-3.5-flash-lite y ML_ARTIFACTS_PATH=ml_artifacts.
- Los modelos revisados se incluyen en la imagen. El contenedor no guarda datos
  académicos persistentes ni preferencias del estudiante.
- Aplicar migraciones e importación desde un entorno administrativo antes de
  activar el servicio. No ejecutarlas en cada arranque o desde visitantes.

Docker fue construido por GitHub Actions. No hay Docker instalado localmente,
por lo que no se afirma haber ejecutado aquí la imagen. No hay servicios
publicados ni credenciales de Vercel/Render configuradas por esta entrega.

## Operación

La disponibilidad de Gemini cambia por modelo y cuenta. 2.5 Flash fue rechazado
para usuarios nuevos; 3.8 devolvió saturación/timeout. 3.5 Flash-Lite produjo una
respuesta real validada. GEMINI_MODEL permite cambiarlo sin editar código.
Los checks de salud no llaman al proveedor de IA. Las llamadas de usuario
pueden consumir cuota de Google y la comparación básica permanece operativa.

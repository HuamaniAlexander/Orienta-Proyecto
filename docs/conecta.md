# Operación de ORIENTA Conecta

El directorio de orientadores se configura desde el backend. Sin perfiles activos, la interfaz muestra el estado del servicio y permite preparar una conversación. El catálogo continúa usando InsForge. Las solicitudes de Conecta se guardan en SQLite en el servidor para que los procesos de la misma instalación compartan los horarios ocupados y el estado de atención.

## Configuración

Define `ORIENTATION_PROFILES_PATH` y `ORIENTATION_DB_PATH` con rutas absolutas a un archivo JSON de perfiles y a una base SQLite en un volumen persistente privado. La base se crea al iniciar FastAPI si su directorio existe. Protege el volumen y sus copias de respaldo porque contienen solicitudes y correos de contacto. En instalaciones con réplicas en hosts diferentes, la atención debe usar una única instancia del servicio con acceso al archivo persistente.

Cada perfil incluye `id`, `name`, `focus`, `conditions`, `response_window`, `active`, `accepts_text` y `slots`. Los horarios tienen un `id` estable y `starts_at` en ISO 8601 con zona horaria. Registra los datos de servicio de los orientadores antes de activar los perfiles. Reinicia el backend al actualizar los perfiles.

```json
[
  {
    "id": "orientador-ejemplo",
    "name": "Nombre del orientador",
    "focus": "Orientación vocacional",
    "conditions": "Atención previa solicitud",
    "response_window": "Respuesta dentro de dos días hábiles",
    "active": false,
    "accepts_text": true,
    "slots": []
  }
]
```

## Atención de solicitudes

Ejecuta los comandos desde `backend` con acceso al volumen de Conecta. La bandeja muestra solo las solicitudes pendientes del identificador consultado. El código de seguimiento funciona como un enlace privado para la persona que lo recibió.

```bash
uv run python -m app.infrastructure.orientation.operator orientador-ejemplo
```

Para confirmar una solicitud de Zoom, el operador crea la reunión en Zoom y pasa el enlace HTTPS por entrada estándar. Para preguntas, pasa el texto de respuesta por el mismo medio. Las personas consultan el resultado en su enlace de seguimiento.

```bash
uv run python -m app.infrastructure.orientation.operator orientador-ejemplo \
  --request ID_DE_SOLICITUD --status confirmada < enlace-zoom.txt
uv run python -m app.infrastructure.orientation.operator orientador-ejemplo \
  --request ID_DE_SOLICITUD --status respondida < respuesta.txt
uv run python -m app.infrastructure.orientation.operator orientador-ejemplo \
  --request ID_DE_SOLICITUD --status rechazada < motivo.txt
```

Gemini usa `GEMINI_API_KEY` y `GEMINI_MODEL` en el backend. «Mi ruta» conserva el avance en el navegador. Solo se guarda en una solicitud el resumen que la persona autoriza compartir.

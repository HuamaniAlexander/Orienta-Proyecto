# Explicaciones con Gemini

FastAPI compone un puerto de explicación, su adaptador Gemini y el índice de
contenido. Solo el backend conoce la clave. No hay respuestas prefabricadas
en la aplicación ni generación en CI.

POST /api/explicaciones recibe dos oferta_ids y preferencias: hasta tres
prioridades, intereses (1500 caracteres), distrito_id y modalidad_id opcionales.
Recupera las ofertas y fuentes desde PostgreSQL, calcula coincidencias de
ubicación/modalidad y contenido léxico, y envía un contexto delimitado.
Las preguntas no constituyen un test vocacional validado.

La respuesta JSON se valida con Pydantic: IDs de opciones y fuentes del
contexto, referencias obligatorias para hechos y sugerencias específicas,
límites y separación entre datos documentados, editoriales y preferencias.
Se rechazan montos, porcentajes y enlaces que este contexto no proporciona.
La validación no verifica semánticamente cada afirmación: revisar las fuentes.
Puede haber empate o sugerencia sin opción preferida.

Los documentos y textos del usuario se tratan como datos no confiables, nunca
como instrucciones. No se ejecuta HTML ni Markdown del modelo en el frontend.

## Configuración y operación

GEMINI_API_KEY y GEMINI_MODEL en backend. Predeterminado: gemini-3.5-flash-lite,
con generación real y referencias validadas. La API rechazó 2.5 Flash para
usuarios nuevos aunque lo mostraba en ListModels. 3.8 Flash devolvió 503 y
timeout durante las pruebas. El adaptador usa el formato JSON del REST documentado:
[salida estructurada](https://ai.google.dev/gemini-api/docs/generate-content/structured-output).

Timeout de 40 segundos por intento, un reintento en 429/503. No se reintenta
automáticamente un timeout ambiguo. Solicitudes idénticas se coalescen y
resultados se conservan diez minutos en memoria por proceso (máximo 128);
errores se conservan diez segundos. Máximo ocho generaciones concurrentes.
La prevención de duplicados no es global entre múltiples workers/instancias.
Los controles del formulario se bloquean mientras hay una consulta pendiente.

Las preferencias se envían a Google al solicitar el análisis, no se guardan
en PostgreSQL ni se registran en logs. Los checks /health y /ready no llaman
a Gemini. /ready verifica PostgreSQL y reporta la carga ML y configuración IA.

## Verificaciones

Dobles del proveedor prueban fuente/ID inválido, precio inventado, timeout,
coalescencia y caché. Las pruebas de interfaz usan una respuesta marcada
explícitamente como simulada, exclusiva de tests; no es un fallback del producto.
La prueba real fue autorizada por el usuario. Flash-Lite devolvió JSON válido
para las ofertas 10 y 110, cuatro fuentes del contexto y una sugerencia sin
ganador. Se revisó el contenido y se eliminan referencias institucionales de
los puntos editoriales para evitar atribuirlos a las instituciones.

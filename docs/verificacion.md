# Verificación MVP 1 — 26 de octubre de 2026

## Evidencia ejecutada

- Backend: Ruff, mypy y 25 pruebas correctas; integración de importación opt-in
  omitida en la suite habitual para no requerir credenciales en CI.
- Auditoría de artefactos: dos pruebas correctas; 21 huellas del ZIP y la huella
  del Excel verificadas. Cuatro pruebas reales de los modelos empaquetados.
- Importación real: 414 ofertas, 170 carreras, 23 instituciones, 27 sedes;
  segunda importación conserva conteos; una referencia inválida al final del
  lote revierte incluso la fuente de prueba insertada al principio.
- PostgreSQL: anon sin SELECT, authenticated sin INSERT y anon sin EXECUTE
  del importador, comprobados mediante has_table_privilege/has_function_privilege.
- Frontend: lint, tipos y build correctos. 49 casos Playwright: controles,
  navegación, fuentes, selección persistente, errores, responsive y accesibilidad.
- Anchos: 360, 390, 768, 1024 y 1440 píxeles. Se verificó scrollWidth contra
  innerWidth en las pantallas principales y resultados de IA.
- Diez análisis axe de pantallas en móvil/PC y cinco de resultados IA, sin
  violaciones de las reglas WCAG 2 A/AA y 2.1 AA comprobadas. No equivale a una
  certificación completa ni sustituye pruebas con tecnologías de asistencia.
- Smoke real sin interceptar red: inicio → catálogo/búsqueda/filtros → selección
  de dos ofertas → comparación → preferencias. Sin errores JavaScript y sin
  llamada generativa dentro de ese recorrido.
- Gemini real autorizado: Flash-Lite generó JSON válido con cuatro fuentes y
  sugerencia sin ganador. Respuesta en evidencias/explicacion-real.json; nunca
  se utiliza como respuesta prefabricada del producto.
- Secretos: búsqueda en archivos versionados sin las claves proporcionadas.
  .env y .insforge/project.json ignorados. npm audit de producción: cero avisos.
- CI por PR: lint, tipos, pruebas, frontend build, navegador y Docker.

Las pruebas UI utilizan una muestra pública del catálogo y dobles explícitos
de IA. La verificación real de persistencia y del proveedor se documenta por
separado; no se atribuye a los mocks una validación de servicios externos.

## Heurísticas de Nielsen

| Heurística | Aplicación concreta |
|---|---|
| Estado visible | Indicadores de carga, conteo de resultados, envío IA y selección |
| Lenguaje del usuario | Carrera, oferta, distrito, enseñanza y modalidad |
| Control y libertad | Quitar selección, cambiar oferta, limpiar y volver a filtros |
| Consistencia | Tokens comunes, componentes compartidos y acciones uniformes |
| Prevención | Máximo dos ofertas; IDs positivos; duplicados rechazados en frontend y backend |
| Reconocimiento | Selección visible y conservada durante la navegación |
| Eficiencia | Filtros URL, orden/paginación y modo ligero persistente |
| Minimalismo | Carrera primero, institución secundaria y datos útiles por tarjeta |
| Recuperación | Reintentar sin perder comparación; error IA sin respuesta falsa |
| Ayuda | Fuentes, fechas, condiciones de costos y límites editoriales/ML |

## PDCA registrado

Plan: recorrido completo y criterios del documento de requisitos.
Do: implementación por ramas y commits de datos, API, interfaz, ML e IA.
Check: pruebas reales, dobles, capturas y CI.
Act: corregir etiqueta móvil del modo ligero, fuente de tarifas UCSS, contraste
de superficies tintadas, preflight del doble de pruebas, cancelación de tareas
IA y modelo Google disponible. Repetir los controles afectados.

## Límites y pruebas externas pendientes

No se simularon entrevistas ni se inventaron tres participantes de usabilidad.
Queda pendiente una sesión real con estudiantes y orientación académica para
revisar lenguaje, taxonomía y decisiones. Tampoco se publicaron servicios,
se promovió main ni se creó una versión estable: esas acciones requieren su
instrucción específica. La información publicada mantiene el alcance y fecha
del Excel; no se revalidaron todas las páginas institucionales externamente.

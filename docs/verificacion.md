# Verificación MVP 1 — 26 de octubre de 2026

## Estado actualizado

Después de esta verificación, el release v0.1.0 se promovió a `main` mediante
el [PR #23](https://github.com/HuamaniAlexander/Orienta-Proyecto/pull/23) y
`dev` se sincronizó con el [PR #24](https://github.com/HuamaniAlexander/Orienta-Proyecto/pull/24).
A esa fecha los servicios aún no se habían publicado. La actualización de
despliegue del 27 de octubre se registra más abajo; las capturas de esta
verificación siguen siendo evidencia de pruebas locales/CI.

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

## Guion preparado para una sesión real de usabilidad

La pauta sirve para una sesión moderada con estudiantes y orientación
académica; no reemplaza la participación real ni sus observaciones.

1. Explicar el propósito, la duración aproximada (15–20 minutos), el uso de las
   notas y que la participación es voluntaria. Pedir consentimiento antes de
   comenzar; no grabar ni recopilar nombres.
2. Pedir a la persona que explore una carrera de su interés y encuentre una
   opción que pueda estudiar en su zona.
3. Solicitar que aplique un filtro y describa qué cambió en los resultados.
4. Pedir que compare dos opciones y localice duración, costos y fuentes; observar
   si distingue datos no publicados de valores confirmados.
5. Si corresponde, pedir que revise la explicación de IA y señale qué entiende
   como recomendación y qué comprobaría por su cuenta.
6. Cerrar preguntando qué fue confuso, qué información faltó y qué cambiaría
   primero. No sugerir respuestas durante las tareas.

Registrar únicamente hallazgos anónimos. No completar filas antes de realizar
la sesión; separar lo observado de las propuestas de mejora.

| Código anónimo | Perfil (estudiante/orientación) | Tarea | Resultado (lograda/parcial/no) | Observación concreta | Mejora por evaluar |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

No se ha realizado una sesión ni se han registrado participantes o resultados.
El trabajo pendiente está descrito en el
[issue #51](https://github.com/HuamaniAlexander/Orienta-Proyecto/issues/51).

## Límites y pruebas externas pendientes

No se simularon entrevistas ni se inventaron tres participantes de usabilidad.
Queda pendiente una sesión real con estudiantes y orientación académica para
revisar lenguaje, taxonomía y decisiones. Los servicios de frontend y backend
se comprobaron públicamente el 27 de octubre de 2026, pero no se revisaron los
registros ni la configuración privada de Render. La información académica
conserva el alcance y fecha del Excel; no se revalidaron todas las páginas
institucionales externamente.

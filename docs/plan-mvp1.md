# Entrega y trazabilidad MVP 1

## Estado

MVP implementado por etapas y publicado mediante PR hacia dev. El usuario
autorizó expresamente integrar en dev después de verificar CI. main y los
servicios de producción no se publicaron. El release v0.1.0 se promovió a main
mediante el PR #23 y dev se sincronizó con el PR #24. No se reescribió historial
compartido ni se usó squash: los commits lógicos quedan visibles en cada PR.

El repositorio inicialmente solo contenía README. Se revisaron Excel, notebook,
artefactos ML, identidad y prototipos. La integración GitHub permitió publicar
ramas aunque Git local conserva otra identidad sin permisos; se verificaron
los commits remotos y se sincronizó el checkout con dev.

## Relación propuesta con el CSV Trello

El tablero oficial vigente es [Orienta - PROYECTO](https://trello.com/b/rGV9WAdT/orienta-proyecto).
El usuario proporcionó su exportación JSON para contrastar las tarjetas 11–18.
La tabla siguiente conserva las referencias ORI históricas del CSV
`ORIENTA_MVP1_Trello_80_tareas.csv`; no son números de tarjeta ni sustituyen
los títulos, checklists o estados del tablero oficial.

| Entrega | Referencias CSV propuestas | PR | Estado |
|---|---|---|---|
| Base React/FastAPI, CI, secretos | ORI-004/006/012 | [1](https://github.com/HuamaniAlexander/Orienta-Proyecto/pull/1) | Integrado tras CI |
| Esquema e importación | ORI-009/014/016/017/018/020 | [2](https://github.com/HuamaniAlexander/Orienta-Proyecto/pull/2) | Integrado tras CI |
| Puertos, API y filtros | ORI-021 a ORI-027/034 a ORI-038 | [3](https://github.com/HuamaniAlexander/Orienta-Proyecto/pull/3) | Integrado tras CI |
| Inicio e identidad | ORI-028/029/051/052/053 | [4](https://github.com/HuamaniAlexander/Orienta-Proyecto/pull/4) | Integrado tras CI |
| Catálogo visual | ORI-030 a ORI-038 | [5](https://github.com/HuamaniAlexander/Orienta-Proyecto/pull/5) | Integrado tras CI |
| Detalle y fuentes | ORI-039 a ORI-043 | [6](https://github.com/HuamaniAlexander/Orienta-Proyecto/pull/6) | Integrado tras CI |
| Comparador | ORI-044 a ORI-050 | [7](https://github.com/HuamaniAlexander/Orienta-Proyecto/pull/7) | Integrado tras CI |
| Artefactos y adaptador ML | ORI-056 a ORI-060 | [8](https://github.com/HuamaniAlexander/Orienta-Proyecto/pull/8) | Integrado tras CI |
| Explicación Gemini | ORI-061 a ORI-065 | [9](https://github.com/HuamaniAlexander/Orienta-Proyecto/pull/9) | Integrado tras CI |
| Verificación integrada | ORI-053/055/063/065/067 a ORI-070/075/076 | [10](https://github.com/HuamaniAlexander/Orienta-Proyecto/pull/10) | Integrado tras CI |

Cada PR documenta criterios, dependencias, cambios, validaciones y límites.
La implementación distingue tareas técnicas delimitadas de funcionalidades
de producto; su recorrido se completa con datos, API e interfaz en etapas
consecutivas sobre dev integrado.

## Ajustes al CSV frente al pedido actual

- Se usa dev, no develop. El repositorio real es Orienta-Proyecto.
- No se adoptó SQLAlchemy: las migraciones SQL de InsForge CLI satisfacen el
  pedido sin inventar una cadena de conexión ni incluir Alembic sin usarlo.
- Se reutiliza el modelo real de Colab; no se inventan estudiantes o resultados
  para entrenar un recomendador ni se prometen métricas de afinidad.
- El documento de requisitos prevalece sobre ejemplos históricos del CSV.
  No se amplía el MVP con cuentas, pagos o un test vocacional completo.
- La información del Excel se conserva sin convertir datos ausentes en cero.
- Ilustraciones WebP se sirven con el frontend. InsForge se reserva para PostgreSQL.

## Cierre

La versión v0.1.0 se promovió a `main` mediante el
[PR #23](https://github.com/HuamaniAlexander/Orienta-Proyecto/pull/23), y `dev`
se sincronizó mediante el [PR #24](https://github.com/HuamaniAlexander/Orienta-Proyecto/pull/24).
Los servicios de frontend y backend siguen sin publicarse. Ver
[verificación](verificacion.md) y el [guion de demostración](demo-mvp1.md);
los siguientes cambios deben partir de `dev` y mantener PR y commits por tarea.

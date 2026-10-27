# Entrega y trazabilidad MVP 1

## Estado

MVP implementado por etapas y publicado mediante PR hacia dev. El usuario
autorizó expresamente integrar en dev después de verificar CI. main y los
servicios de producción no se promovieron. No se reescribió historial compartido
ni se usó squash: los commits lógicos quedan visibles en cada PR.

El repositorio inicialmente solo contenía README. Se revisaron Excel, notebook,
artefactos ML, identidad y prototipos. La integración GitHub permitió publicar
ramas aunque Git local conserva otra identidad sin permisos; se verificaron
los commits remotos y se sincronizó el checkout con dev.

## Relación propuesta con el CSV Trello

No se pudo verificar un tablero Trello real. Los identificadores siguientes
proceden de ORIENTA_MVP1_Trello_80_tareas.csv, no acreditan tarjetas existentes
y no tienen enlaces inventados. No se alteraron estados de un tablero externo.

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

La aplicación queda disponible localmente y el despliegue está preparado y
documentado. Ver verificacion.md para resultados, capturas, PDCA y validaciones
externas que no se inventaron. Los siguientes cambios de producto deben partir
de dev actualizado y mantener PR y commits por tarea.

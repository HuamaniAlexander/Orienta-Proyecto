# Modelos de Colab

Los artefactos entregados se revisaron sin deserializar joblib. El adaptador ML
todavía no está implementado. Mantener los binarios fuera del repositorio hasta
acordar una publicación versionada y una procedencia controlada.

Preparación local propuesta: colocar los artefactos en `ml/artifacts/` (ignorado)
y configurar `ML_ARTIFACTS_PATH`. El script `scripts/audit_ml.py` comprueba ZIP,
manifiesto y Excel sin ejecutar código serializado.

Consultar [auditoría](../docs/auditoria-ml.md) antes de integrar.

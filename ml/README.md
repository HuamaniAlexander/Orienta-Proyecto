# Modelos de Colab

Los artefactos entregados se revisaron y su inferencia se verificó con las
versiones exactas de numpy, scipy, scikit-learn y joblib declaradas por Colab.
El adaptador carga una vez por proceso los binarios revisados y versionados en
backend/ml_artifacts/. Comprueba SHA-256 y compatibilidad antes de deserializar.

Configurar `ML_ARTIFACTS_PATH=ml_artifacts` desde backend. El script `scripts/audit_ml.py` comprueba ZIP,
manifiesto y Excel sin ejecutar código serializado.

El notebook original se conserva en ml/notebooks/. No se reentrenó el modelo:
se reutiliza la exportación real del usuario. GET /api/ml/estado informa su
disponibilidad y procedencia; GET /api/ml/clasificar?nombre=... propone un área
editorial. No publica probabilidades de compatibilidad vocacional.

Consultar [auditoría](../docs/auditoria-ml.md) antes de integrar.

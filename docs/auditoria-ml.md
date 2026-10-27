# Revisión de artefactos ML — 2026-10-26

Origen: ORIENTA_Artefactos_ML.zip, entregado por el usuario desde Google Colab.
Notebook revisado: ORIENTA_MVP1_Entrenamiento_ML.ipynb (27 celdas).
Excel de referencia: Orienta_MVP1_Lima_Norte.xlsx.

## Verificaciones ejecutadas

- Todas las huellas del manifiesto SHA-256 coinciden con el contenido del ZIP.
- La huella del Excel coincide con metadatos.json:
  `4842f5bf7637b7fb7c102687ada4934633d2389e34d3828f230afdec50fe0d60`.
- 170 carreras, 414 ofertas, 23 instituciones, 27 sedes, 8 distritos, 10 áreas,
  344 fuentes, 224 duraciones y 14 códigos en los JSON de importación.
- Incluye clasificador_area.joblib, indice_contenido.joblib, métricas,
  errores, particiones por carrera y matriz de confusión.
- Se cargaron los dos objetos después de verificar hashes y dependencias.
  Inferencia, abstención, simetría y equivalencia con el ejemplo de Colab comprobadas.

| Validación cruzada exploratoria | Accuracy | F1 macro |
|---|---:|---:|
| Modelo | 0.7588 | 0.6877 |
| Referencia mayoritaria | 0.2118 | 0.0350 |

Estas cifras están declaradas en metricas.json; no se reentrenó el modelo.
El notebook agrupa nombres similares antes de evaluar, usa nombres sin síntesis
derivadas de la etiqueta para el clasificador y ajusta el modelo final después
de la evaluación. Requiere revisar etiquetas y agrupaciones manualmente.

## Compatibilidad comprobada

El exportador declara Python 3.13.16, numpy 2.1.3, pandas 2.2.3,
scikit-learn 1.6.1, scipy 1.16.3, joblib 1.6.0 y openpyxl 3.1.5.
El entorno usa Python 3.13.12 (misma versión mayor/menor), con las cuatro
dependencias del modelo en sus versiones exactas. Pandas y matplotlib son
herramientas del entrenamiento y no se necesitan para inferir estos objetos.
Los binarios y manifiestos se empaquetan con el backend; no hay un endpoint
que acepte modelos subidos por visitantes. Un fallo ML conserva el comparador.

El contexto de comparación incluido es un ejemplo, no una respuesta Gemini
ni un resultado que se deba mostrar a todos los usuarios. Sus textos se tratan
como datos. La similitud es coincidencia léxica, sin interpretación vocacional.

Los JSON son entradas de importación; la web consultará PostgreSQL.
El ZIP no incluye las tablas Tarifas_UCSS, Registro_MINEDU ni BecaTEC_2025;
se deben leer desde el Excel y conservar sus condiciones y carácter histórico.

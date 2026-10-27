import hashlib
import importlib.metadata
import json
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


class ArtifactError(Exception):
    pass


class SklearnContent:
    """Load only the reviewed, locally packaged export once per worker process."""

    def __init__(self, directory: Path):
        metadata = json.loads((directory / "metadatos.json").read_text(encoding="utf-8"))
        manifest = json.loads((directory / "sha256_archivos.json").read_text(encoding="utf-8"))
        for name in ["clasificador_area.joblib", "indice_contenido.joblib", "metadatos.json"]:
            if hashlib.sha256((directory / name).read_bytes()).hexdigest() != manifest[name]:
                raise ArtifactError("El artefacto no coincide con la exportación revisada.")
        if metadata["python"].split('.')[:2] != [str(sys.version_info.major), str(sys.version_info.minor)]:
            raise ArtifactError("Versión de Python incompatible con Colab.")
        for package in ["numpy", "scipy", "scikit-learn", "joblib"]:
            if importlib.metadata.version(package) != metadata["dependencias"][package]:
                raise ArtifactError(f"Versión incompatible: {package}")
        self.metadata = metadata
        self.classifier = joblib.load(directory / "clasificador_area.joblib")
        index = joblib.load(directory / "indice_contenido.joblib")
        self.vectorizer = index["vectorizador"]
        self.matrix = index["matriz"]
        self.positions = {int(ident): i for i, ident in enumerate(index["carrera_ids"])}
        if len(self.positions) != metadata["n_carreras"] or self.matrix.shape[0] != len(self.positions):
            raise ArtifactError("El índice no coincide con las carreras de la exportación.")

    def classify(self, name: str) -> dict[str, Any]:
        normalized = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
        normalized = re.sub(r"[^a-z0-9]+", " ", normalized).strip()
        vector = self.classifier.named_steps["tfidf"].transform([normalized])
        if not normalized or vector.nnz == 0:
            return {"estado": "sin_coincidencia_textual", "area_id": None}
        area = int(self.classifier.predict([normalized])[0])
        return {"estado": "area_propuesta", "area_id": area,
                "area": self.metadata["etiquetas"][str(area)],
                "alcance": "Clasificación de etiquetas editoriales; no es afinidad vocacional."}

    def compare(self, first_id: int, second_id: int, interests: str) -> dict[str, Any]:
        if first_id == second_id:
            return {"estado": "misma_denominacion_academica", "opciones": []}
        if any(ident not in self.positions for ident in [first_id, second_id]):
            return {"estado": "carrera_fuera_del_artefacto", "opciones": []}
        query = self.vectorizer.transform([interests])
        if not interests.strip() or query.nnz == 0:
            return {"estado": "sin_terminos_compartidos", "opciones": []}
        vocabulary = self.vectorizer.get_feature_names_out()
        results: list[dict[str, Any]] = []
        for ident in [first_id, second_id]:
            vector = self.matrix[self.positions[ident]]
            product = query.multiply(vector).tocoo()
            order = np.argsort(-product.data)[:8]
            results.append({"carrera_id": ident,
                            "similitud_coseno": float(cosine_similarity(query, vector)[0, 0]),
                            "terminos_compartidos": [str(vocabulary[product.col[i]]) for i in order]})
        tie = bool(np.isclose(results[0]["similitud_coseno"], results[1]["similitud_coseno"], rtol=1e-6, atol=1e-9))
        return {"estado": "empate_textual" if tie else "comparacion_textual", "opciones": results,
                "interpretacion": "Coincidencia léxica del catálogo, sin interpretación vocacional."}

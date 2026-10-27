import shutil
from pathlib import Path

import pytest

from app.infrastructure.ml.content import ArtifactError, SklearnContent

DIRECTORY = Path(__file__).parents[1] / 'ml_artifacts'


@pytest.fixture(scope='module')
def model():
    return SklearnContent(DIRECTORY)


def test_real_artifact_classifies_and_abstains(model):
    assert model.classify('Ingeniería de Software')['area_id'] == 1
    assert model.classify('')['area_id'] is None
    assert model.classify('###')['area_id'] is None


def test_content_analysis_is_symmetric_and_not_vocational(model):
    query = 'Me interesa el desarrollo de software y la integración de sistemas de información.'
    first = model.compare(1, 2, query)
    reverse = model.compare(2, 1, query)
    def scores(result):
        return {row['carrera_id']: row['similitud_coseno'] for row in result['opciones']}
    assert scores(first) == scores(reverse)
    assert first['opciones'][1]['similitud_coseno'] == pytest.approx(0.4406191060799786)
    assert model.compare(1,1,query)['estado'] == 'misma_denominacion_academica'
    assert model.compare(1,2,'')['estado'] == 'sin_terminos_compartidos'
    assert model.compare(1,99999,query)['estado'] == 'carrera_fuera_del_artefacto'


def test_corrupt_artifact_is_rejected_before_deserialization(tmp_path):
    for name in ['metadatos.json','sha256_archivos.json','clasificador_area.joblib','indice_contenido.joblib']:
        shutil.copyfile(DIRECTORY/name,tmp_path/name)
    (tmp_path/'clasificador_area.joblib').write_bytes(b'corrupt')
    with pytest.raises(ArtifactError,match='no coincide'):
        SklearnContent(tmp_path)


def test_incompatible_dependency_is_rejected(monkeypatch):
    monkeypatch.setattr('importlib.metadata.version', lambda name:'0.0.0')
    with pytest.raises(ArtifactError,match='Versión incompatible'):
        SklearnContent(DIRECTORY)

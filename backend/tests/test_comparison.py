from dataclasses import fields, replace

import pytest
from fastapi.testclient import TestClient

from app.domain.catalog import AcademicOffer
from app.domain.comparison import InvalidComparison, compare_offers
from app.main import Settings, create_app


def offer():
    values = {field.name: 1 if field.name.endswith("_id") else "fixture" for field in fields(AcademicOffer)}
    values.update(duracion_valor=10.0, duracion_unidad="ciclos")
    return AcademicOffer(**values)


def test_duplicate_offer_rejected_but_same_career_allowed():
    first = offer()
    with pytest.raises(InvalidComparison):
        compare_offers(first, first)
    result = compare_offers(first, replace(first, oferta_id=2, institucion="Otra institución"))
    assert result.misma_carrera
    assert next(row for row in result.criterios if row.key == "institucion").different


def test_does_not_convert_units_or_invent_missing_values():
    first = offer()
    second = replace(first, oferta_id=2, carrera_id=2, duracion_valor=5, duracion_unidad="años")
    assert compare_offers(first, second).diferencia_duracion is None
    missing = replace(second, duracion_valor=None)
    assert next(row for row in compare_offers(first, missing).criterios if row.key == "duracion").b is None


def test_only_computes_duration_difference_for_same_units():
    first = offer()
    result = compare_offers(first, replace(first, oferta_id=2, duracion_valor=8))
    assert result.diferencia_duracion == "Diferencia: 2 ciclos."


def test_comparison_http_contract_and_invalid_requests():
    class Repository:
        async def get(self, offer_id):
            return replace(offer(), oferta_id=offer_id, carrera_id=offer_id)
    with TestClient(create_app(Settings(_env_file=None), Repository())) as client:
        assert client.post('/api/comparaciones',json={'oferta_ids':[1,1]}).status_code == 422
        assert client.post('/api/comparaciones',json={'oferta_ids':[1]}).status_code == 422
        assert client.post('/api/comparaciones',json={'oferta_ids':[-1,2]}).status_code == 422
        result = client.post('/api/comparaciones',json={'oferta_ids':[1,2]})
        assert result.status_code == 200
        assert not result.json()['misma_carrera']

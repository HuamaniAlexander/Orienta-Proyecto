from copy import deepcopy

import pytest

from app.infrastructure.persistence.import_excel import validate_dataset
from app.infrastructure.persistence.schema import TABLES, columns


def valid_dataset():
    data = {}
    for sheet, (_, _, definition) in TABLES.items():
        row = {name: 1 if name.endswith("_id") or name in {"duracion_valor", "creditos_matriculados"}
               else "fixture" for name in columns(definition)}
        data[sheet] = [row]
    return data


def test_rejects_cross_institution_offer():
    data = valid_dataset()
    other = deepcopy(data["Instituciones"][0])
    other["institucion_id"] = 2
    data["Instituciones"].append(other)
    data["Ofertas"][0]["institucion_id"] = 2
    with pytest.raises(ValueError, match="institution does not match"):
        validate_dataset(data)


def test_rejects_duplicate_and_missing_reference():
    data = valid_dataset()
    data["Carreras"].append(deepcopy(data["Carreras"][0]))
    with pytest.raises(ValueError, match="duplicate keys"):
        validate_dataset(data)
    data = valid_dataset()
    data["Ofertas"][0]["carrera_id"] = 999
    with pytest.raises(ValueError, match="invalid reference"):
        validate_dataset(data)


def test_rejects_unknown_duration_instead_of_zero():
    data = valid_dataset()
    data["Duraciones"][0]["duracion_valor"] = None
    with pytest.raises(ValueError, match="missing required"):
        validate_dataset(data)

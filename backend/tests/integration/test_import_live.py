"""Opt-in integration checks; malformed test rows must never be committed."""
import copy
import os
from pathlib import Path

import httpx
import pytest

from app.infrastructure.persistence.import_excel import (
    ImportSettings,
    import_dataset,
    read_dataset,
)

pytestmark = pytest.mark.skipif(not os.getenv("ORIENTA_EXCEL"), reason="Opt-in live PostgreSQL")


def snapshot(settings):
    response = httpx.post(
        f"{settings.insforge_base_url}/api/database/advance/rawsql",
        headers={"Authorization": f"Bearer {settings.insforge_api_key}"},
        json={"query": "SELECT (SELECT count(*) FROM public.orienta_ofertas) AS ofertas, (SELECT count(*) FROM public.orienta_fuentes) AS fuentes, (SELECT count(*) FROM public.orienta_fuentes WHERE fuente_id=999998) AS fixtures"},
        timeout=30,
    )
    response.raise_for_status()
    return {key: int(value) for key, value in response.json()["rows"][0].items()}


def test_idempotence_and_atomic_rollback():
    settings = ImportSettings()
    data = read_dataset(Path(os.environ["ORIENTA_EXCEL"]))
    import_dataset(data, settings)
    first = snapshot(settings)
    import_dataset(data, settings)
    assert snapshot(settings) == first
    assert first["ofertas"] == 414
    broken = copy.deepcopy(data)
    source = copy.deepcopy(broken["Fuentes"][0])
    source["fuente_id"] = 999998
    broken["Fuentes"].append(source)
    broken["BecaTEC_2025"][0]["fuente_id"] = -1
    with pytest.raises(RuntimeError, match="rolled back"):
        import_dataset(broken, settings)
    assert snapshot(settings) == first
    assert first["fixtures"] == 0

import asyncio
import json
from pathlib import Path

import httpx

from app.infrastructure.persistence.repository import InsforgeCatalog


def test_tariffs_include_their_own_document_source():
    fixture = json.loads((Path(__file__).parents[2] / "frontend/tests/fixtures/catalog.json").read_text(encoding="utf-8"))
    offer = next(row for row in fixture["default"]["items"] if row["institucion"] == "Universidad Católica Sedes Sapientiae")
    def handle(request):
        if request.url.path.endswith("orienta_catalogo"):
            return httpx.Response(200, json=[offer])
        if request.url.path.endswith("orienta_tarifas_ucss"):
            return httpx.Response(200, json=[{"fuente_id": 344}])
        assert "344" in request.url.params["fuente_id"]
        return httpx.Response(200, json=[{"fuente_id": 344, "url": "https://example.test/tarifas"}])
    async def run():
        async with httpx.AsyncClient(base_url="https://test.invalid", transport=httpx.MockTransport(handle)) as client:
            result = await InsforgeCatalog(client).detail(offer["oferta_id"])
            assert result.fuentes[0]["fuente_id"] == 344
    asyncio.run(run())

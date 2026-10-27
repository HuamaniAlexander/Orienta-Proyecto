import asyncio

import httpx
import pytest
from fastapi.testclient import TestClient

from app.domain.catalog import CatalogFilters, CatalogPage, OfferNotFound, ServiceUnavailable
from app.infrastructure.persistence.repository import InsforgeCatalog
from app.main import Settings, create_app


def test_search_combines_filters_and_normalizes_text():
    def handle(request):
        assert request.url.params["distrito_id"] == "eq.5"
        assert request.url.params["tipo_id"] == "eq.1"
        assert request.url.params["offset"] == "12"
        assert request.url.params["and"] == "(busqueda.ilike.*ingenieria*,busqueda.ilike.*software*)"
        return httpx.Response(200, json=[], headers={"content-range": "*/0"})

    async def run():
        async with httpx.AsyncClient(base_url="https://test.invalid", transport=httpx.MockTransport(handle)) as client:
            result = await InsforgeCatalog(client).search(CatalogFilters(q="Ingeniería % Software", distrito_id=5, tipo_id=1, page=2))
            assert result.total == 0 and result.page == 2
    asyncio.run(run())


def test_repository_does_not_expose_upstream_errors():
    async def run():
        async with httpx.AsyncClient(base_url="https://test.invalid", transport=httpx.MockTransport(lambda r: httpx.Response(500, text="private details"))) as client:
            with pytest.raises(ServiceUnavailable, match="consultar el catálogo"):
                await InsforgeCatalog(client).get(1)
    asyncio.run(run())


class EmptyCatalog:
    async def search(self, filters):
        return CatalogPage([], 0, filters.page, filters.page_size)

    async def detail(self, offer_id):
        raise OfferNotFound("Opción inexistente")


def test_http_validation_empty_and_not_found():
    with TestClient(create_app(Settings(_env_file=None), EmptyCatalog())) as client:
        assert client.get("/api/ofertas?page_size=49").status_code == 422
        assert client.get("/api/ofertas?distrito_id=-1").status_code == 422
        assert client.get("/api/ofertas?q=zzz").json()["items"] == []
        assert client.get("/api/ofertas/999").status_code == 404

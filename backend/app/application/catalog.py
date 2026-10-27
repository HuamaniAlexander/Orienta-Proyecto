from typing import Any

from app.application.ports import CatalogRepository
from app.domain.catalog import CatalogFilters, CatalogPage, OfferDetail


class Catalog:
    def __init__(self, repository: CatalogRepository):
        self.repository = repository

    async def search(self, filters: CatalogFilters) -> CatalogPage:
        return await self.repository.search(filters)

    async def detail(self, offer_id: int) -> OfferDetail:
        return await self.repository.detail(offer_id)

    async def facets(self) -> dict[str, Any]:
        return await self.repository.facets()

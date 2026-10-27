from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, Query, Request

from app.application.catalog import Catalog
from app.domain.catalog import CatalogFilters, CatalogPage, OfferDetail

router = APIRouter(prefix="/api", tags=["catálogo"])


def catalog(request: Request) -> Catalog:
    return Catalog(request.app.state.repository)


@router.get("/ofertas", response_model=CatalogPage)
async def search(
    service: Annotated[Catalog, Depends(catalog)],
    q: Annotated[str, Query(max_length=150)] = "",
    carrera_id: Annotated[int | None, Query(gt=0)] = None,
    institucion_id: Annotated[int | None, Query(gt=0)] = None,
    tipo_id: Annotated[int | None, Query(gt=0)] = None,
    modalidad_id: Annotated[int | None, Query(gt=0)] = None,
    distrito_id: Annotated[int | None, Query(gt=0)] = None,
    area_id: Annotated[int | None, Query(gt=0)] = None,
    page: Annotated[int, Query(ge=1, le=100000)] = 1,
    page_size: Annotated[int, Query(ge=1, le=48)] = 12,
    order: Literal["nombre", "institucion"] = "nombre",
) -> CatalogPage:
    return await service.search(CatalogFilters(q, carrera_id, institucion_id, tipo_id,
                                              modalidad_id, distrito_id, area_id, page, page_size, order))


@router.get("/ofertas/{oferta_id}", response_model=OfferDetail)
async def detail(oferta_id: int, service: Annotated[Catalog, Depends(catalog)]) -> OfferDetail:
    return await service.detail(oferta_id)


@router.get("/filtros")
async def facets(service: Annotated[Catalog, Depends(catalog)]) -> dict[str, Any]:
    return await service.facets()

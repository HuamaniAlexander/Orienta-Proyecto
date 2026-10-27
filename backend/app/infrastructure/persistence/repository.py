import asyncio
import re
import time
import unicodedata
from dataclasses import fields
from typing import Any

import httpx

from app.domain.catalog import (
    AcademicOffer,
    CatalogFilters,
    CatalogPage,
    OfferDetail,
    OfferNotFound,
    ServiceUnavailable,
)

OFFER_COLUMNS = ",".join(field.name for field in fields(AcademicOffer))


class InsforgeCatalog:
    def __init__(self, client: httpx.AsyncClient):
        self.client = client
        self._facets: tuple[float, dict[str, Any]] | None = None

    async def records(self, table: str, params: dict[str, str]) -> httpx.Response:
        try:
            response = await self.client.get(f"/api/database/records/{table}", params=params)
            response.raise_for_status()
            return response
        except httpx.HTTPError as error:
            raise ServiceUnavailable("No pudimos consultar el catálogo. Intenta nuevamente.") from error

    async def search(self, filters: CatalogFilters) -> CatalogPage:
        params = {"select": OFFER_COLUMNS, "limit": str(filters.page_size),
                  "offset": str((filters.page - 1) * filters.page_size),
                  "order": "carrera_oficial.asc,oferta_id.asc" if filters.order == "nombre"
                  else "institucion.asc,carrera_oficial.asc,oferta_id.asc"}
        for name in ["carrera_id", "institucion_id", "tipo_id", "modalidad_id", "distrito_id", "area_id"]:
            value = getattr(filters, name)
            if value is not None:
                params[name] = f"eq.{value}"
        query = unicodedata.normalize("NFKD", filters.q).encode("ascii", "ignore").decode()
        tokens = re.findall(r"[a-zA-Z0-9]+", query.lower())[:12]
        if tokens:
            params["and"] = "(" + ",".join(f"busqueda.ilike.*{token}*" for token in tokens) + ")"
        response = await self.records("orienta_catalogo", params)
        rows = response.json()
        raw_total = response.headers.get("x-total-count") or response.headers.get("content-range", "0/0").split("/")[-1]
        if not raw_total.isdigit():
            raise ServiceUnavailable("No pudimos determinar el total de resultados.")
        return CatalogPage([AcademicOffer(**row) for row in rows], int(raw_total), filters.page, filters.page_size)

    async def get(self, offer_id: int) -> AcademicOffer:
        response = await self.records("orienta_catalogo", {
            "select": OFFER_COLUMNS, "oferta_id": f"eq.{offer_id}", "limit": "1",
        })
        rows = response.json()
        if not rows:
            raise OfferNotFound("Esta opción académica no está en el catálogo.")
        return AcademicOffer(**rows[0])

    async def detail(self, offer_id: int) -> OfferDetail:
        offer = await self.get(offer_id)
        source_ids = sorted({offer.fuente_oferta_id, offer.fuente_ficha_id})
        source = await self.records("orienta_fuentes", {
            "select": "fuente_id,emisor_tipo,url,fecha_o_periodo_fuente,fecha_consulta",
            "fuente_id": "in.(" + ",".join(map(str, source_ids)) + ")", "limit": "10",
        })
        # Only this institution has a documented tariff table in the supplied workbook.
        tariffs: list[dict[str, Any]] = []
        if "Universidad Católica Sedes Sapientiae" == offer.institucion:
            response = await self.records("orienta_tarifas_ucss", {
                "select": "categoria,creditos_matriculados,tarifa_por_credito_pen,cuotas_por_semestre,matricula_pen,periodo,moneda,aplicacion,fuente_id",
                "creditos_matriculados": "eq.20", "order": "categoria.asc", "limit": "10",
            })
            tariffs = response.json()
        return OfferDetail(offer, source.json(), tariffs)

    async def facets(self) -> dict[str, Any]:
        if self._facets and time.monotonic() - self._facets[0] < 300:
            return self._facets[1]
        definitions = {
            "carreras": ("orienta_carreras", "carrera_id,nombre_catalogado", "nombre_catalogado.asc"),
            "instituciones": ("orienta_instituciones", "institucion_id,nombre", "nombre.asc"),
            "distritos": ("orienta_distritos", "distrito_id,distrito", "distrito.asc"),
            "areas": ("orienta_areas", "area_id,nombre_area", "nombre_area.asc"),
            "modalidades": ("orienta_modalidades", "codigo_id,etiqueta", "codigo_id.asc"),
            "tipos": ("orienta_tipos", "codigo_id,etiqueta", "codigo_id.asc"),
        }
        responses = await asyncio.gather(*[
            self.records(table, {"select": select, "order": order, "limit": "300"})
            for table, select, order in definitions.values()
        ])
        result = {key: response.json() for key, response in zip(definitions, responses, strict=True)}
        page = await self.search(CatalogFilters(page_size=1))
        result["resumen"] = {"ofertas": page.total, "carreras": len(result["carreras"]),
                             "instituciones": len(result["instituciones"]), "distritos": len(result["distritos"])}
        self._facets = (time.monotonic(), result)
        return result

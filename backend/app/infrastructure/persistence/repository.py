import asyncio
import re
import time
import unicodedata
from dataclasses import fields, replace
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

OFFER_COLUMNS = ",".join(field.name for field in fields(AcademicOffer) if field.name != "plan_estudio")


def search_words(value: str) -> list[str]:
    normalized = unicodedata.normalize("NFKD", value.casefold())
    words = re.findall(r"[a-z0-9]+", "".join(char for char in normalized if not unicodedata.combining(char)))
    return [word for word in words if word not in {"de", "del", "la", "las", "el", "los", "y", "en"}]


def name_matches(value: str, tokens: list[str]) -> bool:
    words = search_words(value)
    return any(
        all(word.startswith(token) for word, token in zip(words[start:], tokens))
        for start in range(len(words) - len(tokens) + 1)
    )


class InsforgeCatalog:
    def __init__(self, client: httpx.AsyncClient):
        self.client = client
        self._facets: tuple[float, dict[str, Any]] | None = None
        self._plans: tuple[float, dict[int, dict[str, Any]]] | None = None
        self._offers: dict[int, tuple[float, AcademicOffer]] = {}
        self._details: dict[int, tuple[float, OfferDetail]] = {}
        self._searches: dict[tuple[Any, ...], tuple[float, CatalogPage]] = {}
        self._plans_lock = asyncio.Lock()

    async def records(self, table: str, params: dict[str, str]) -> httpx.Response:
        try:
            response = await self.client.get(f"/api/database/records/{table}", params=params)
            response.raise_for_status()
            return response
        except httpx.HTTPError as error:
            raise ServiceUnavailable("No pudimos consultar el catálogo. Intenta nuevamente.") from error

    async def _load_plans(self) -> dict[int, dict[str, Any]]:
        now = time.monotonic()
        if self._plans and now - self._plans[0] < 900:
            return self._plans[1]
        async with self._plans_lock:
            now = time.monotonic()
            if self._plans and now - self._plans[0] < 900:
                return self._plans[1]
            try:
                response = await self.client.get(
                    "/api/database/records/orienta_planes_estudio",
                    params={"select": "carrera_id,plan_anual,temas,ejemplo_reto", "limit": "300"},
                )
                if response.status_code == 200:
                    rows = response.json()
                    if isinstance(rows, list) and rows and isinstance(rows[0], dict) and "plan_anual" in rows[0]:
                        mapping = {
                            int(row["carrera_id"]): {
                                "plan_anual": row["plan_anual"],
                                "temas": row["temas"],
                                "ejemplo_reto": row["ejemplo_reto"],
                            }
                            for row in rows
                            if "carrera_id" in row
                        }
                        self._plans = (now, mapping)
                        return mapping
            except Exception:
                pass
            return {}

    async def warmup(self) -> None:
        try:
            await asyncio.gather(
                self.facets(),
                self._load_plans(),
                self.search(CatalogFilters(page=1, page_size=48)),
            )
        except Exception:
            pass

    async def search(self, filters: CatalogFilters) -> CatalogPage:
        cache_key = (
            filters.q, filters.carrera_id, filters.institucion_id, filters.tipo_id,
            filters.modalidad_id, filters.distrito_id, filters.area_id,
            filters.page, filters.page_size, filters.order,
        )
        now = time.monotonic()
        cached = self._searches.get(cache_key)
        if cached and now - cached[0] < 300:
            return cached[1]
        params = {"select": OFFER_COLUMNS, "limit": str(filters.page_size),
                  "offset": str((filters.page - 1) * filters.page_size),
                  "order": "carrera_oficial.asc,oferta_id.asc" if filters.order == "nombre"
                  else "institucion.asc,carrera_oficial.asc,oferta_id.asc"}
        for name in ["carrera_id", "institucion_id", "tipo_id", "modalidad_id", "distrito_id", "area_id"]:
            value = getattr(filters, name)
            if value is not None:
                params[name] = f"eq.{value}"
        tokens = search_words(filters.q)
        if tokens:
            page = await self._search_names(filters, params, tokens)
            self._searches[cache_key] = (time.monotonic(), page)
            return page
        response = await self.records("orienta_catalogo", params)
        rows = response.json()
        raw_total = response.headers.get("x-total-count") or response.headers.get("content-range", "0/0").split("/")[-1]
        if not raw_total.isdigit():
            raise ServiceUnavailable("No pudimos determinar el total de resultados.")
        page = CatalogPage([AcademicOffer(**row) for row in rows], int(raw_total), filters.page, filters.page_size)
        for offer in page.items:
            self._offers[offer.oferta_id] = (time.monotonic(), offer)
        self._searches[cache_key] = (time.monotonic(), page)
        return page

    async def _search_names(
        self, filters: CatalogFilters, params: dict[str, str], tokens: list[str],
    ) -> CatalogPage:
        candidates = {**params, "limit": "200"}
        matches: list[AcademicOffer] = []
        offset = 0
        while True:
            candidates["offset"] = str(offset)
            response = await self.records("orienta_catalogo", candidates)
            rows = response.json()
            matches.extend(
                AcademicOffer(**row) for row in rows
                if name_matches(row["carrera_oficial"], tokens) or name_matches(row["institucion"], tokens)
            )
            if len(rows) < int(candidates["limit"]):
                break
            offset += len(rows)
        start = (filters.page - 1) * filters.page_size
        return CatalogPage(matches[start:start + filters.page_size], len(matches), filters.page, filters.page_size)

    async def get(self, offer_id: int) -> AcademicOffer:
        now = time.monotonic()
        cached = self._offers.get(offer_id)
        if cached and now - cached[0] < 600 and cached[1].plan_estudio is not None:
            return cached[1]
        if cached and now - cached[0] < 600:
            offer = cached[1]
            plans = await self._load_plans()
            plan = plans.get(offer.carrera_id)
            if plan is not None:
                offer = replace(offer, plan_estudio=plan)
                self._offers[offer_id] = (now, offer)
            return offer
        response, plans = await asyncio.gather(
            self.records("orienta_catalogo", {
                "select": OFFER_COLUMNS, "oferta_id": f"eq.{offer_id}", "limit": "1",
            }),
            self._load_plans(),
        )
        rows = response.json()
        if not rows:
            raise OfferNotFound("Esta opción académica no está en el catálogo.")
        offer = AcademicOffer(**rows[0])
        plan = plans.get(offer.carrera_id)
        if plan is not None:
            offer = replace(offer, plan_estudio=plan)
        self._offers[offer_id] = (time.monotonic(), offer)
        return offer

    async def detail(self, offer_id: int) -> OfferDetail:
        now = time.monotonic()
        cached = self._details.get(offer_id)
        if cached and now - cached[0] < 600:
            return cached[1]
        offer = await self.get(offer_id)
        source_ids = {offer.fuente_oferta_id, offer.fuente_ficha_id}
        # Only this institution has a documented tariff table in the supplied workbook.
        tariffs: list[dict[str, Any]] = []
        if "Universidad Católica Sedes Sapientiae" == offer.institucion:
            response = await self.records("orienta_tarifas_ucss", {
                "select": "categoria,creditos_matriculados,tarifa_por_credito_pen,cuotas_por_semestre,matricula_pen,periodo,moneda,aplicacion,fuente_id",
                "creditos_matriculados": "eq.20", "order": "categoria.asc", "limit": "10",
            })
            tariffs = response.json()
            source_ids.update(int(row["fuente_id"]) for row in tariffs)
        source = await self.records("orienta_fuentes", {
            "select": "fuente_id,emisor_tipo,url,fecha_o_periodo_fuente,fecha_consulta",
            "fuente_id": "in.(" + ",".join(map(str, sorted(source_ids))) + ")", "limit": "10",
        })
        result = OfferDetail(offer, source.json(), tariffs)
        self._details[offer_id] = (time.monotonic(), result)
        return result

    async def facets(self) -> dict[str, Any]:
        if self._facets and time.monotonic() - self._facets[0] < 1800:
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
        # Only public relation IDs are needed for cascading filters, never full offers.
        relations = []
        offset = 0
        while True:
            response = await self.records("orienta_catalogo", {
                "select": "tipo_id,institucion_id,carrera_id,area_id,modalidad_id,distrito_id",
                "order": "oferta_id.asc", "limit": "500", "offset": str(offset),
            })
            batch = response.json()
            relations.extend(batch)
            if len(batch) < 500:
                break
            offset += 500
        result["relaciones"] = [dict(values) for values in dict.fromkeys(
            tuple(sorted(relation.items())) for relation in relations
        )]
        page = await self.search(CatalogFilters(page_size=1))
        result["resumen"] = {"ofertas": page.total, "carreras": len(result["carreras"]),
                             "instituciones": len(result["instituciones"]), "distritos": len(result["distritos"])}
        self._facets = (time.monotonic(), result)
        return result

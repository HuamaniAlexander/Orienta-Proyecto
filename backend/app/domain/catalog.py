from dataclasses import dataclass, field
from typing import Any


class OfferNotFound(Exception):
    pass


class ServiceUnavailable(Exception):
    pass


@dataclass(frozen=True)
class CatalogFilters:
    q: str = ""
    carrera_id: int | None = None
    institucion_id: int | None = None
    tipo_id: int | None = None
    modalidad_id: int | None = None
    distrito_id: int | None = None
    area_id: int | None = None
    page: int = 1
    page_size: int = 12
    order: str = "nombre"


@dataclass(frozen=True)
class AcademicOffer:
    oferta_id: int
    carrera_id: int
    institucion_id: int
    sede_id: int
    carrera_oficial: str
    institucion: str
    tipo: str
    distrito: str
    modalidad: str
    area: str
    sede: str
    nivel: str
    gestion: str
    enfoque_editorial: str
    ambitos_editoriales: str
    criterio_clasificacion: str
    direccion: str | None
    duracion_valor: float | None
    duracion_unidad: str | None
    consulta_costos: str | None
    ficha_url: str | None
    fuente_oferta_url: str | None
    periodo_fuente: str | None
    fecha_consulta: str
    fuente_oferta_id: int
    fuente_ficha_id: int
    tipo_id: int
    area_id: int
    modalidad_id: int
    distrito_id: int
    evidencia_sede: str | None = None


@dataclass
class CatalogPage:
    items: list[AcademicOffer]
    total: int
    page: int
    page_size: int


@dataclass
class OfferDetail:
    oferta: AcademicOffer
    fuentes: list[dict[str, Any]] = field(default_factory=list)
    tarifas: list[dict[str, Any]] = field(default_factory=list)

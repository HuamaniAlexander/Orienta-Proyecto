import asyncio
import re
from dataclasses import asdict
from typing import Any, Literal, Protocol

from pydantic import BaseModel, ConfigDict, Field

from app.application.compare import Compare
from app.application.ml import ContentAnalyzer
from app.application.ports import CatalogRepository
from app.domain.catalog import ServiceUnavailable


class GroundedPoint(BaseModel):
    model_config = ConfigDict(extra='forbid')
    texto: str = Field(min_length=1, max_length=1200)
    naturaleza: Literal['documentado', 'editorial', 'preferencia', 'limite']
    fuente_ids: list[int] = Field(max_length=6)


class Suggestion(BaseModel):
    model_config = ConfigDict(extra='forbid')
    oferta_id: int | None
    motivo: str = Field(min_length=1, max_length=1500)
    fuente_ids: list[int] = Field(max_length=6)


class Explanation(BaseModel):
    model_config = ConfigDict(extra='forbid')
    oferta_ids: list[int] = Field(min_length=2, max_length=2)
    diferencias_principales: list[GroundedPoint] = Field(min_length=1, max_length=5)
    coincidencias: list[GroundedPoint] = Field(max_length=4)
    relacion_preferencias: list[GroundedPoint] = Field(min_length=1, max_length=4)
    ventajas_condicionadas: list[GroundedPoint] = Field(max_length=4)
    sugerencia: Suggestion
    limites: list[str] = Field(min_length=1, max_length=5)

    def validate_evidence(self, ids: list[int], source_ids: set[int]) -> None:
        if self.oferta_ids != ids or self.sugerencia.oferta_id not in [*ids, None]:
            raise ValueError('La explicación menciona opciones ajenas a la comparación.')
        points = [*self.diferencias_principales, *self.coincidencias,
                  *self.relacion_preferencias, *self.ventajas_condicionadas]
        references = set(self.sugerencia.fuente_ids)
        for point in points:
            references.update(point.fuente_ids)
            if point.naturaleza == 'documentado' and not point.fuente_ids:
                raise ValueError('Un hecho documentado necesita una fuente del contexto.')
        if not references.issubset(source_ids):
            raise ValueError('La explicación usa fuentes fuera del contexto.')
        for point in points:
            if point.naturaleza == 'editorial':
                # Institutional documents do not substantiate ORIENTA editorial summaries.
                point.fuente_ids = []
        if self.sugerencia.oferta_id is not None and not self.sugerencia.fuente_ids:
            raise ValueError('Una sugerencia específica necesita evidencia documentada.')
        texts = [point.texto for point in points] + [self.sugerencia.motivo, *self.limites]
        unsupported = r'(?:S/|PEN|USD|US\$|\$)\s*\d|\d[\d.,]*\s*(?:%|por ciento|soles|dólares|dolares)|https?://|www\.'
        if any(re.search(unsupported, text, re.IGNORECASE) for text in texts):
            raise ValueError('La explicación incluye cifras o enlaces no autorizados por este contexto.')


class ExplanationProvider(Protocol):
    async def explain(self, context: dict[str, Any]) -> Explanation: ...


class Explain:
    def __init__(self, repository: CatalogRepository, provider: ExplanationProvider,
                 content: ContentAnalyzer | None = None):
        self.repository = repository
        self.provider = provider
        self.content = content

    async def execute(self, ids: list[int], preferences: dict[str, Any]) -> dict[str, Any]:
        comparison = await Compare(self.repository).execute(*ids)
        details = await asyncio.gather(*[self.repository.detail(ident) for ident in ids])
        sources = {int(source['fuente_id']): source for detail in details for source in detail.fuentes}
        matches = {}
        for field in ['distrito_id', 'modalidad_id']:
            desired = preferences.get(field)
            if desired is not None:
                matches[field] = [offer.oferta_id for offer in comparison.opciones if getattr(offer, field) == desired]
        analysis = self.content.compare(comparison.opciones[0].carrera_id, comparison.opciones[1].carrera_id,
                                        preferences.get('intereses', '')) if self.content else {'estado': 'no_disponible', 'opciones': []}
        context = {'comparacion': asdict(comparison), 'preferencias_declaradas': preferences,
                   'restricciones_comprobadas': matches, 'fuentes': list(sources.values()),
                   'coincidencia_lexica': analysis,
                   'datos_ausentes': comparison.pendientes,
                   'regla_costos': 'No hay costos de enseñanza homogéneos para ordenar estas ofertas.'}
        try:
            explanation = await self.provider.explain(context)
            explanation.validate_evidence(ids, set(sources))
        except (ValueError, KeyError) as error:
            raise ServiceUnavailable('La respuesta de IA no superó la validación. Tu comparación sigue disponible.') from error
        return {'explicacion': explanation.model_dump(), 'fuentes': list(sources.values()),
                'contenido': analysis, 'restricciones_comprobadas': matches}

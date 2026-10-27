from typing import Annotated, Any, Literal

from fastapi import APIRouter, Request
from pydantic import BaseModel, ConfigDict, Field

router = APIRouter(prefix='/api', tags=['explicación con IA'])


class Preferences(BaseModel):
    model_config = ConfigDict(extra='forbid')
    prioridades: list[Literal['enfoque', 'ubicacion', 'modalidad', 'duracion', 'costos']] = Field(default_factory=list, max_length=3)
    intereses: str = Field(default='', max_length=1500)
    distrito_id: int | None = Field(default=None, gt=0)
    modalidad_id: int | None = Field(default=None, ge=1, le=3)


class ExplainRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    oferta_ids: list[Annotated[int, Field(gt=0)]] = Field(min_length=2, max_length=2)
    preferencias: Preferences = Field(default_factory=Preferences)


@router.post('/explicaciones')
async def explain(body: ExplainRequest, request: Request) -> dict[str, Any]:
    result: dict[str, Any] = await request.app.state.explainer.execute(body.oferta_ids, body.preferencias.model_dump())
    result['modelo'] = request.app.state.gemini_model
    return result

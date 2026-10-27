from typing import Annotated

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from app.application.compare import Compare
from app.domain.comparison import Comparison

router = APIRouter(prefix="/api", tags=["comparador"])


class ComparisonRequest(BaseModel):
    oferta_ids: list[Annotated[int, Field(gt=0)]] = Field(min_length=2, max_length=2)


@router.post("/comparaciones", response_model=Comparison)
async def compare(body: ComparisonRequest, request: Request) -> Comparison:
    return await Compare(request.app.state.repository).execute(*body.oferta_ids)

from typing import Annotated, Any

from fastapi import APIRouter, Query, Request

from app.domain.catalog import ServiceUnavailable

router = APIRouter(prefix="/api/ml", tags=["análisis de contenido"])


@router.get('/estado')
async def status(request: Request) -> dict[str, Any]:
    analyzer = request.app.state.content
    if analyzer is None:
        return {"estado": "no_disponible", "alcance": "La comparación básica sigue disponible."}
    return {"estado": "disponible", "dataset_sha256": analyzer.metadata['excel_sha256'],
            "n_carreras": analyzer.metadata['n_carreras'], "alcance": analyzer.metadata['alcance']}


@router.get('/clasificar')
async def classify(request: Request, nombre: Annotated[str, Query(max_length=200)] = '') -> dict[str, Any]:
    if request.app.state.content is None:
        raise ServiceUnavailable('El clasificador no está disponible; explora las áreas del catálogo.')
    result: dict[str, Any] = request.app.state.content.classify(nombre)
    return result

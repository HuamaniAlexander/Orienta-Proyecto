import sqlite3
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, Response

from app.application.orientation import Advisor, Receipt, RequestInput
from app.domain.catalog import ServiceUnavailable
from app.infrastructure.ai.preparation import Preparation, PreparationContext, prepare_questions
from app.infrastructure.orientation.store import (
    DuplicateRequest,
    OrientationStore,
    SlotUnavailable,
    UnknownAdvisor,
)

router = APIRouter(prefix="/api/orientacion", tags=["orientación"])


def store(request: Request) -> OrientationStore:
    service: OrientationStore | None = request.app.state.orientation
    if service is None:
        raise HTTPException(503, "La atención por orientadores aún no está habilitada.")
    return service


@router.get("/orientadores", response_model=list[Advisor])
def advisors(request: Request) -> list[Advisor]:
    service = request.app.state.orientation
    if service is None:
        return []
    result: list[Advisor] = service.list_advisors()
    return result


@router.post("/solicitudes", response_model=Receipt, status_code=201)
def submit(payload: RequestInput, request: Request, response: Response) -> Receipt:
    try:
        response.headers["Cache-Control"] = "no-store"
        return store(request).submit(payload)
    except SlotUnavailable as error:
        raise HTTPException(409, "El horario ya no está disponible. Elige otro horario.") from error
    except UnknownAdvisor as error:
        raise HTTPException(404, "El orientador o canal ya no está disponible.") from error
    except DuplicateRequest as error:
        raise HTTPException(409, "Este identificador ya corresponde a otra solicitud.") from error
    except sqlite3.OperationalError as error:
        raise HTTPException(503, "Intenta nuevamente con los mismos datos.") from error


@router.get("/solicitudes/{request_id}", response_model=Receipt)
def receipt(request_id: UUID, request: Request, response: Response) -> Receipt:
    response.headers["Cache-Control"] = "no-store"
    result = store(request).get_receipt(request_id)
    if result is None:
        raise HTTPException(404, "No encontramos la solicitud.")
    return result


@router.post("/preparar", response_model=Preparation)
async def prepare(context: PreparationContext, request: Request, response: Response) -> Preparation:
    response.headers["Cache-Control"] = "no-store"
    client = request.app.state.gemini_client
    model = request.app.state.gemini_model
    if client is None or not model:
        raise ServiceUnavailable("La IA aún no está configurada. Puedes editar tu resumen.")
    return await prepare_questions(client, model, context)

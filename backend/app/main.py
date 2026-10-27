from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.domain.catalog import OfferNotFound, ServiceUnavailable
from app.infrastructure.persistence.repository import InsforgeCatalog
from app.infrastructure.settings import Settings
from app.interfaces.http.catalog import router


def create_app(settings: Settings | None = None, repository: Any = None) -> FastAPI:
    config = settings or Settings()

    @asynccontextmanager
    async def lifespan(api: FastAPI) -> AsyncIterator[None]:
        async with httpx.AsyncClient(
            base_url=config.insforge_base_url or "http://unconfigured.invalid",
            headers={"Authorization": f"Bearer {config.insforge_api_key.get_secret_value()}",
                     "Prefer": "count=exact"},
            timeout=httpx.Timeout(20, connect=5),
        ) as client:
            api.state.repository = repository or InsforgeCatalog(client)
            yield

    api = FastAPI(title="ORIENTA", version="0.1.0", lifespan=lifespan)
    api.add_middleware(
        CORSMiddleware,
        allow_origins=config.cors_origins,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    api.include_router(router)

    @api.exception_handler(OfferNotFound)
    async def not_found(request: Request, error: OfferNotFound) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": str(error)})

    @api.exception_handler(ServiceUnavailable)
    async def unavailable(request: Request, error: ServiceUnavailable) -> JSONResponse:
        return JSONResponse(status_code=503, content={"detail": str(error)})

    @api.get("/health", tags=["operación"])
    def health() -> dict[str, str]:
        return {"status": "ok", "service": "orienta-api"}

    return api


app = create_app()

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.application.explanation import Explain, ExplanationProvider
from app.domain.catalog import CatalogFilters, OfferNotFound, ServiceUnavailable
from app.domain.comparison import InvalidComparison
from app.infrastructure.ai.gemini import GeminiExplanation
from app.infrastructure.ml.content import SklearnContent
from app.infrastructure.persistence.repository import InsforgeCatalog
from app.infrastructure.settings import Settings
from app.interfaces.http.catalog import router
from app.interfaces.http.comparison import router as comparison_router
from app.interfaces.http.explanation import router as explanation_router
from app.interfaces.http.ml import router as ml_router


def create_app(settings: Settings | None = None, repository: Any = None,
               explanation_provider: ExplanationProvider | None = None) -> FastAPI:
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
            try:
                api.state.content = SklearnContent(config.ml_artifacts_path)
            except Exception as error:
                logging.getLogger('orienta').warning('ML no disponible: %s', type(error).__name__)
                api.state.content = None
            async with httpx.AsyncClient(
                base_url='https://generativelanguage.googleapis.com',
                headers={'x-goog-api-key': config.gemini_api_key.get_secret_value()},
                timeout=httpx.Timeout(40, connect=5),
            ) as gemini_client:
                provider = explanation_provider or GeminiExplanation(
                    gemini_client, config.gemini_model,
                    configured=bool(config.gemini_api_key.get_secret_value()),
                )
                api.state.explainer = Explain(api.state.repository, provider, api.state.content)
                api.state.gemini_model = config.gemini_model
                yield

    api = FastAPI(title="ORIENTA", version="0.1.0", lifespan=lifespan)
    api.add_middleware(
        CORSMiddleware,
        allow_origins=config.cors_origins,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    api.include_router(router)
    api.include_router(comparison_router)
    api.include_router(ml_router)
    api.include_router(explanation_router)

    @api.exception_handler(InvalidComparison)
    async def invalid_comparison(request: Request, error: InvalidComparison) -> JSONResponse:
        return JSONResponse(status_code=422, content={"detail": str(error)})

    @api.exception_handler(OfferNotFound)
    async def not_found(request: Request, error: OfferNotFound) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": str(error)})

    @api.exception_handler(ServiceUnavailable)
    async def unavailable(request: Request, error: ServiceUnavailable) -> JSONResponse:
        return JSONResponse(status_code=503, content={"detail": str(error)})

    @api.get("/health", tags=["operación"])
    def health() -> dict[str, str]:
        return {"status": "ok", "service": "orienta-api"}

    @api.get('/ready', tags=['operación'])
    async def ready(request: Request) -> dict[str, str]:
        await request.app.state.repository.search(CatalogFilters(page_size=1))
        return {'database': 'available', 'ml': 'available' if request.app.state.content else 'unavailable',
                'gemini': 'configured' if config.gemini_api_key.get_secret_value() and config.gemini_model else 'unconfigured'}

    return api


app = create_app()

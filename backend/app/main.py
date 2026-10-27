from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")
    app_env: str = "development"
    cors_origins: list[str] = ["http://localhost:5173"]


def create_app(settings: Settings | None = None) -> FastAPI:
    config = settings or Settings()
    api = FastAPI(title="ORIENTA", version="0.1.0")
    api.add_middleware(
        CORSMiddleware,
        allow_origins=config.cors_origins,
        allow_methods=["GET"],
        allow_headers=["Content-Type"],
    )

    @api.get("/health", tags=["operación"])
    def health() -> dict[str, str]:
        return {"status": "ok", "service": "orienta-api"}

    return api


app = create_app()

from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../.env", env_ignore_empty=True, extra="ignore")
    app_env: str = "development"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    insforge_base_url: str = ""
    insforge_api_key: SecretStr = SecretStr("")
    ml_artifacts_path: Path = Path(__file__).resolve().parents[2] / 'ml_artifacts'
    gemini_api_key: SecretStr = SecretStr('')
    gemini_model: str = 'gemini-3.5-flash-lite'
    orientation_db_path: Path | None = None
    orientation_profiles_path: Path | None = None

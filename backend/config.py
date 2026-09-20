"""SentinelAI Configuration — loads from .env"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    # LLM
    llm_provider: str = "mock"
    openai_api_key: str = ""
    gemini_api_key: str = ""
    groq_api_key: str = ""
    llm_model: str = ""
    ollama_base_url: str = "http://localhost:11434"

    # Database
    database_url: str = f"sqlite+aiosqlite:///{BASE_DIR / 'sentinelai.db'}"

    # Server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    # Upload
    max_upload_size: int = 52_428_800  # 50 MB

    # CORS
    frontend_url: str = "http://localhost:5173"

    # Paths
    upload_dir: Path = BASE_DIR / "uploads"
    reports_dir: Path = BASE_DIR.parent / "reports"
    data_dir: Path = BASE_DIR / "data"

    class Config:
        env_file = str(BASE_DIR.parent / ".env")
        env_file_encoding = "utf-8"

    def ensure_dirs(self):
        """Create required directories."""
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.reports_dir.mkdir(parents=True, exist_ok=True)


settings = Settings()
settings.ensure_dirs()

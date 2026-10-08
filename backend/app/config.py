"""
config.py
---------
Loads all environment variables from .env file using pydantic-settings.
Provides a single `settings` object used across the entire application.
"""

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # Application info
    app_name: str = Field(default="AI Business Trend Agent")
    app_version: str = Field(default="1.0.0")
    debug: bool = Field(default=False)

    # Database
    database_url: str = Field(..., env="DATABASE_URL")

    # AI provider selection
    ai_provider: str = Field(default="openai")  # "openai" or "gemini"
    openai_api_key: str = Field(default="")
    gemini_api_key: str = Field(default="")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Single instance imported everywhere else
settings = Settings()
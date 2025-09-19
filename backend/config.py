import os
from pydantic_settings import BaseSettings, SettingsConfigDict 

DOTENV = os.path.join(os.path.dirname(__file__), ".env")

class Settings(BaseSettings):
    db_name: str
    upload_path: str
    azure_di_endpoint: str
    azure_di_key: str
    env: str = 'development'
    port: int = 8000
    frontend_url: str = "http://127.0.0.1:80"

    model_config = SettingsConfigDict(
        env_file=DOTENV,
        env_file_encoding="utf-8",
        env_ignore_empty=True,
        populate_by_name=True
    )

config = Settings()
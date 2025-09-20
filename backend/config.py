import os
from typing import List

class Config:
    def __init__(self):
        self.env = os.getenv("ENVIRONMENT", "development")
        self.port = int(os.getenv("PORT", "8000"))
        self.frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        self.debug = self.env == "development"
        
    @property
    def cors_origins(self) -> List[str]:
        if self.env == "development":
            return ["*"]
        else:
            return [url.strip() for url in self.frontend_url.split(",")]

config = Config()

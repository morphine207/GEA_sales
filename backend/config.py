import os
from typing import List
from dotenv import load_dotenv, find_dotenv, dotenv_values

# Load environment variables from a .env file if present (search upwards)
load_dotenv(find_dotenv(), override=True)

# Fallback: parse frontend/.env and map common aliases if OPENAI_API_KEY not set
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
frontend_env = os.path.join(repo_root, 'frontend', '.env')
if not os.getenv("OPENAI_API_KEY") and os.path.exists(frontend_env):
    # Load without overriding first; then map
    load_dotenv(frontend_env, override=False)
    env_map = dotenv_values(frontend_env) or {}
    # Try common key aliases in order of preference
    for k in [
        "OPENAI_API_KEY",
        "VITE_OPENAI_API_KEY",
        "OPENAI_KEY",
        "AZURE_OPENAI_API_KEY",
    ]:
        v = env_map.get(k)
        if v and not os.getenv("OPENAI_API_KEY"):
            os.environ["OPENAI_API_KEY"] = v
            break
    # Final robust manual parse (handles spaces, export, ':' as separator)
    if not os.getenv("OPENAI_API_KEY"):
        try:
            with open(frontend_env, 'r', encoding='utf-8', errors='ignore') as f:
                for raw in f:
                    s = raw.strip()
                    if not s or s.startswith('#'):
                        continue
                    if s.lower().startswith('export '):
                        s = s[7:].lstrip()
                    sep = '=' if '=' in s else (':' if ':' in s else None)
                    if not sep:
                        continue
                    key, val = s.split(sep, 1)
                    key = key.strip()
                    val = val.strip()
                    # Trim surrounding quotes
                    if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                        val = val[1:-1]
                    if 'OPENAI' in key.upper() and val and not os.getenv('OPENAI_API_KEY'):
                        os.environ['OPENAI_API_KEY'] = val
                        break
        except Exception:
            pass

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

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from termcolor import colored
from config import config
from src.routes import project_router, document_ocr_router, file_router, table_router


def get_fast_api_instance():
    env = config.env
    if env == 'development':
        return FastAPI(docs_url="/docs", redoc_url="/redoc")
    elif env == 'production':
        return FastAPI(docs_url=None, redoc_url=None)
    else:
        return FastAPI(docs_url="/docs", redoc_url="/redoc")
    
app = get_fast_api_instance()

# only used for development mode
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*" if config.env == 'development' else [config.frontend_url.split(",")]],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def empty_route():
    return

app.include_router(document_ocr_router, prefix="")
app.include_router(project_router, prefix="")
app.include_router(file_router, prefix="")
app.include_router(table_router, prefix="")

if __name__ == "__main__":
    print(colored(f"starting in { 'development' if config.env == '' else config.env } environment", "green"))
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=config.port)
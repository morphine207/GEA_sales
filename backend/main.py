from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from termcolor import colored
from config import config
from src.routes.calculation_routes import router as calculation_router


def get_fast_api_instance():
    """Create FastAPI instance based on environment."""
    if config.env == 'development':
        return FastAPI(
            title="GEA Sales Calculation Engine API",
            description="API for GEA machine TCO calculations",
            version="1.0.0",
            docs_url="/docs", 
            redoc_url="/redoc"
        )
    elif config.env == 'production':
        return FastAPI(
            title="GEA Sales Calculation Engine API",
            description="API for GEA machine TCO calculations",
            version="1.0.0",
            docs_url=None, 
            redoc_url=None
        )
    else:
        return FastAPI(
            title="GEA Sales Calculation Engine API",
            description="API for GEA machine TCO calculations",
            version="1.0.0",
            docs_url="/docs", 
            redoc_url="/redoc"
        )
    
app = get_fast_api_instance()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "GEA Sales Calculation Engine API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs" if config.debug else "disabled"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "GEA Sales Calculation Engine"}

# Include calculation routes
app.include_router(calculation_router)

if __name__ == "__main__":
    print(colored(f"Starting GEA Sales Calculation Engine in {config.env} environment", "green"))
    print(colored(f"Server will run on http://0.0.0.0:{config.port}", "blue"))
    print(colored(f"API documentation available at http://localhost:{config.port}/docs", "cyan"))
    
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=config.port)
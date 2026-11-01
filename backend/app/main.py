"""
FastAPI Main Application Entrypoint
-----------------------------------
Initializes the FastAPI application, mounts CORS middleware, sets up database
schemas and model lifecycle hooks, and mounts routes and visualization assets.
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from backend.app.config import settings
from backend.app.database.session import init_db
from backend.app.services.model_service import model_service
from backend.app.api.routes import router as api_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle hooks."""
    logger.info("Initializing database...")
    await init_db()

    logger.info("Loading deep learning model service...")
    try:
        model_service.initialize()
    except Exception as e:
        logger.error(f"Failed to load model weights: {e}", exc_info=True)

    yield

    logger.info("Shutting down application...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Deep Learning Audio Forensics Platform for Detecting AI-Generated & Synthetic Voice",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list + ["*"],  # Permits local dev frontends
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount evaluation artifacts for frontend chart loading
eval_dir = os.path.abspath(settings.EVALUATION_RESULTS_DIR)
os.makedirs(eval_dir, exist_ok=True)
app.mount("/static/evaluation", StaticFiles(directory=eval_dir), name="evaluation_static")

# Mount benchmark samples for instant frontend testing
samples_dir = os.path.abspath("data/benchmark_samples")
if os.path.isdir(samples_dir):
    app.mount("/static/samples", StaticFiles(directory=samples_dir), name="samples_static")

# Mount API routes
app.include_router(api_router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred during audio processing. Please verify file integrity and try again.",
        },
    )


@app.get("/", tags=["Root"])
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs_url": "/docs",
        "api_endpoints": {
            "detect": "POST /api/detect",
            "record": "POST /api/record",
            "history": "GET /api/history",
            "health": "GET /api/health",
            "model_info": "GET /api/model-info",
            "metrics": "GET /api/metrics",
        },
    }

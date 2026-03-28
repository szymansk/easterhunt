import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.db import engine
from app.exceptions import (
    GameNotFoundError,
    InvalidConfigurationError,
    StationLimitExceededError,
)
from app.models import Base
from app.routers import games, progress, stations

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    yield


app = FastAPI(title="Easter Hunt API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(games.router)
app.include_router(stations.router)
app.include_router(progress.router)


@app.exception_handler(GameNotFoundError)
async def game_not_found_handler(request: Request, exc: GameNotFoundError) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={"error": "Game not found", "detail": str(exc)},
    )


@app.exception_handler(StationLimitExceededError)
async def station_limit_handler(request: Request, exc: StationLimitExceededError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"error": "Station limit exceeded", "detail": str(exc)},
    )


@app.exception_handler(InvalidConfigurationError)
async def invalid_config_handler(request: Request, exc: InvalidConfigurationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"error": "Invalid configuration", "field": exc.field, "detail": exc.message},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception for %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )


DIST_DIR = Path(__file__).parent.parent / "dist"


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"status": "ok"}


# Serve frontend build in production (when dist/ exists)
if DIST_DIR.exists():
    app.mount("/", StaticFiles(directory=str(DIST_DIR), html=True), name="static")

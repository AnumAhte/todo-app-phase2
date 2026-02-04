import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import create_db_and_tables


# Configure logging infrastructure
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S%z"
)

# Configure auth logger specifically
auth_logger = logging.getLogger("auth")
auth_logger.setLevel(logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.

    Handles startup and shutdown events:
    - Startup: Create database tables
    - Shutdown: Cleanup (if needed)
    """
    # Startup: create tables
    await create_db_and_tables()
    yield
    # Shutdown: cleanup (none required currently)


# Create FastAPI application
app = FastAPI(
    title="Todo API - Phase II",
    description="Multi-user Todo application backend with JWT authentication and session security",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Import routers
from app.routers import tasks


# Root endpoint
@app.get("/", tags=["health"])
async def root():
    """Health check endpoint."""
    return {"status": "ok"}


# Mount task router
app.include_router(tasks.router)

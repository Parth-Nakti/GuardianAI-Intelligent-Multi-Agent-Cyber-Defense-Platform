"""SentinelAI — Multi-Agent Intelligent Cybersecurity Operations Center."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import init_db
from backend.api import dashboard, uploads, incidents, agents, reports

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("🛡️  SentinelAI starting up...")
    await init_db()
    logger.info(f"📊 Database initialized")
    logger.info(f"🤖 LLM Provider: {settings.llm_provider}")
    logger.info(f"🌐 Frontend URL: {settings.frontend_url}")
    yield
    logger.info("SentinelAI shutting down...")


app = FastAPI(
    title="SentinelAI",
    description="Multi-Agent Intelligent Cybersecurity Operations Center",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(dashboard.router)
app.include_router(uploads.router)
app.include_router(incidents.router)
app.include_router(agents.router)
app.include_router(reports.router)


@app.get("/")
async def root():
    return {
        "name": "SentinelAI",
        "version": "1.0.0",
        "description": "Multi-Agent Intelligent Cybersecurity Operations Center",
        "status": "operational",
        "llm_provider": settings.llm_provider,
    }


@app.get("/api/health")
async def health():
    return {"status": "healthy", "llm_provider": settings.llm_provider}

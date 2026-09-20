"""Dashboard API — stats and metrics."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.services.incident_service import get_incident_stats
from backend.agents.agent_manager import get_agent_manager

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Get aggregated dashboard statistics."""
    incident_stats = await get_incident_stats(db)

    # Agent statuses
    manager = get_agent_manager()
    agent_statuses = manager.get_all_statuses()

    # Total events = sum of all agent analyses
    total_events = sum(a["total_analyses"] for a in agent_statuses)

    return {
        "total_events": total_events,
        "threats_detected": incident_stats["total_incidents"],
        "severity": incident_stats["severity"],
        "status": incident_stats["status"],
        "types": incident_stats["types"],
        "recent_incidents": incident_stats["recent_incidents"],
        "agents": agent_statuses,
        "active_investigations": incident_stats["status"].get("investigating", 0),
    }

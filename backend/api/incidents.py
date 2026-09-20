"""Incidents API — list and detail endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.services.incident_service import get_incidents, get_incident_by_id, update_incident_status
from backend.models.incident import IncidentSummary, IncidentResponse

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


@router.get("")
async def list_incidents(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    incident_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """List all incidents with optional filtering."""
    incidents = await get_incidents(db, severity, status, incident_type, limit, offset)
    return [IncidentSummary.model_validate(inc) for inc in incidents]


@router.get("/{incident_id}")
async def get_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    """Get full incident details."""
    incident = await get_incident_by_id(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return IncidentResponse.model_validate(incident)


@router.patch("/{incident_id}/status")
async def patch_incident_status(
    incident_id: str,
    status: str,
    db: AsyncSession = Depends(get_db),
):
    """Update incident status."""
    valid_statuses = {"Open", "Investigating", "Resolved", "Closed"}
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    incident = await update_incident_status(db, incident_id, status)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return IncidentResponse.model_validate(incident)

"""Incident Service — CRUD operations for incidents."""

import logging
from datetime import datetime
from typing import Optional
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.incident import Incident, IncidentCreate

logger = logging.getLogger(__name__)

_incident_counter = 0


async def get_next_incident_id(db: AsyncSession) -> str:
    """Generate the next incident ID."""
    global _incident_counter
    result = await db.execute(select(func.count(Incident.id)))
    count = result.scalar() or 0
    _incident_counter = max(_incident_counter, count) + 1
    return f"INC-{_incident_counter:04d}"


async def create_incident(db: AsyncSession, data: IncidentCreate) -> Incident:
    """Create a new incident."""
    incident_id = await get_next_incident_id(db)

    incident = Incident(
        incident_id=incident_id,
        title=data.title,
        description=data.description,
        incident_type=data.incident_type,
        severity=data.severity,
        status="Investigating",
        confidence=data.confidence,
        source=data.source,
        source_file=data.source_file,
        evidence=data.evidence,
        indicators=data.indicators,
        affected_assets=data.affected_assets,
        agent_findings=data.agent_findings,
        correlation_data=data.correlation_data,
        response_actions=data.response_actions,
        correlation_score=data.correlation_score,
        analysis_session_id=data.analysis_session_id,
    )

    db.add(incident)
    await db.flush()
    await db.refresh(incident)
    logger.info(f"Created incident {incident_id}: {data.title}")
    return incident


async def get_incidents(
    db: AsyncSession,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    incident_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Incident]:
    """List incidents with optional filtering."""
    query = select(Incident)

    if severity:
        query = query.where(Incident.severity == severity)
    if status:
        query = query.where(Incident.status == status)
    if incident_type:
        query = query.where(Incident.incident_type == incident_type)

    query = query.order_by(desc(Incident.detected_at)).limit(limit).offset(offset)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_incident_by_id(db: AsyncSession, incident_id: str) -> Optional[Incident]:
    """Get a single incident by its incident_id (e.g. INC-0001) or primary key id."""
    query = select(Incident).where(
        (Incident.incident_id == incident_id) | (Incident.incident_id == f"INC-{int(incident_id):04d}" if incident_id.isdigit() else False)
    )
    result = await db.execute(query)
    incident = result.scalar_one_or_none()
    if not incident and incident_id.isdigit():
        result = await db.execute(select(Incident).where(Incident.id == int(incident_id)))
        incident = result.scalar_one_or_none()
    return incident


async def update_incident_status(db: AsyncSession, incident_id: str, status: str) -> Optional[Incident]:
    """Update incident status."""
    incident = await get_incident_by_id(db, incident_id)
    if incident:
        incident.status = status
        if status == "Resolved":
            incident.resolved_at = datetime.utcnow()
        await db.flush()
        await db.refresh(incident)
    return incident


async def get_incident_stats(db: AsyncSession) -> dict:
    """Get aggregated incident statistics for the dashboard."""
    total = await db.execute(select(func.count(Incident.id)))
    total_count = total.scalar() or 0

    # By severity
    severity_counts = {}
    for sev in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
        r = await db.execute(
            select(func.count(Incident.id)).where(Incident.severity == sev)
        )
        severity_counts[sev.lower()] = r.scalar() or 0

    # By status
    status_counts = {}
    for st in ["Open", "Investigating", "Resolved", "Closed"]:
        r = await db.execute(
            select(func.count(Incident.id)).where(Incident.status == st)
        )
        status_counts[st.lower()] = r.scalar() or 0

    # By type
    type_counts = {}
    for itype in ["Phishing", "Port Scan", "Brute Force", "Malware", "Suspicious DNS", "Suspicious Traffic", "Other"]:
        r = await db.execute(
            select(func.count(Incident.id)).where(Incident.incident_type == itype)
        )
        c = r.scalar() or 0
        if c > 0:
            type_counts[itype] = c

    # Recent incidents
    recent = await get_incidents(db, limit=10)
    recent_list = [
        {
            "incident_id": inc.incident_id,
            "title": inc.title,
            "incident_type": inc.incident_type,
            "severity": inc.severity,
            "status": inc.status,
            "detected_at": inc.detected_at.isoformat() if inc.detected_at else "",
        }
        for inc in recent
    ]

    return {
        "total_incidents": total_count,
        "severity": severity_counts,
        "status": status_counts,
        "types": type_counts,
        "recent_incidents": recent_list,
    }

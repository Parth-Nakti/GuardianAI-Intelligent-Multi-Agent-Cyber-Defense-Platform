"""Reports API — list and retrieve generated reports."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.models.report import Report, ReportResponse, ReportSummary

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("")
async def list_reports(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """List all generated reports."""
    result = await db.execute(
        select(Report).order_by(desc(Report.created_at)).limit(limit)
    )
    reports = list(result.scalars().all())
    return [ReportSummary.model_validate(r) for r in reports]


@router.get("/{report_id}")
async def get_report(report_id: str, db: AsyncSession = Depends(get_db)):
    """Get full report by ID."""
    query = select(Report).where(
        (Report.report_id == report_id) | (Report.report_id == f"RPT-{int(report_id):04d}" if report_id.isdigit() else False)
    )
    result = await db.execute(query)
    report = result.scalar_one_or_none()
    if not report and report_id.isdigit():
        result = await db.execute(select(Report).where(Report.id == int(report_id)))
        report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return ReportResponse.model_validate(report)

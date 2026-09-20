"""Report model and schemas."""

import datetime
from typing import Optional, Any
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.sql import func
from pydantic import BaseModel
from backend.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(String(20), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    incident_id = Column(String(20), nullable=True)

    # Report content sections
    summary = Column(Text, default="")
    threat_summary = Column(JSON, default=dict)
    evidence = Column(JSON, default=list)
    agent_findings = Column(JSON, default=list)
    correlation = Column(JSON, default=dict)
    response_actions = Column(JSON, default=list)
    risk_summary = Column(JSON, default=dict)
    full_content = Column(Text, default="")  # Rendered full text

    # Metadata
    generated_by = Column(String(50), default="Report Generation Agent")
    created_at = Column(DateTime, server_default=func.now())
    status = Column(String(20), default="generated")


# --- Pydantic Schemas ---

class ReportResponse(BaseModel):
    id: int
    report_id: str
    title: str
    incident_id: Optional[str] = None
    summary: str
    threat_summary: Any = {}
    evidence: Any = []
    agent_findings: Any = []
    correlation: Any = {}
    response_actions: Any = []
    risk_summary: Any = {}
    full_content: str = ""
    generated_by: str
    created_at: datetime.datetime
    status: str

    class Config:
        from_attributes = True


class ReportSummary(BaseModel):
    id: int
    report_id: str
    title: str
    incident_id: Optional[str] = None
    summary: str
    created_at: datetime.datetime
    status: str

    class Config:
        from_attributes = True

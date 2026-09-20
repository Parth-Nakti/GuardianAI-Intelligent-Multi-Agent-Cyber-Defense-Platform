"""Incident model and schemas."""

import enum
import datetime
from typing import Optional, Any
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, Enum as SAEnum
from sqlalchemy.sql import func
from pydantic import BaseModel
from backend.database import Base


class SeverityLevel(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


class IncidentStatus(str, enum.Enum):
    OPEN = "Open"
    INVESTIGATING = "Investigating"
    RESOLVED = "Resolved"
    CLOSED = "Closed"


class IncidentType(str, enum.Enum):
    PHISHING = "Phishing"
    PORT_SCAN = "Port Scan"
    BRUTE_FORCE = "Brute Force"
    MALWARE = "Malware"
    SUSPICIOUS_DNS = "Suspicious DNS"
    DATA_EXFILTRATION = "Data Exfiltration"
    PRIVILEGE_ESCALATION = "Privilege Escalation"
    UNAUTHORIZED_ACCESS = "Unauthorized Access"
    SUSPICIOUS_TRAFFIC = "Suspicious Traffic"
    OTHER = "Other"


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(20), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    incident_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False, default="MEDIUM")
    status = Column(String(20), nullable=False, default="Open")
    confidence = Column(Float, default=0.0)
    source = Column(String(50), default="")  # pcap, email, log
    source_file = Column(String(255), default="")

    # Evidence
    evidence = Column(JSON, default=list)
    indicators = Column(JSON, default=list)
    affected_assets = Column(JSON, default=list)

    # Agent data
    agent_findings = Column(JSON, default=list)
    correlation_data = Column(JSON, default=dict)
    response_actions = Column(JSON, default=list)

    # Timestamps
    detected_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    resolved_at = Column(DateTime, nullable=True)

    # Related
    analysis_session_id = Column(Integer, nullable=True)
    correlation_score = Column(Float, default=0.0)


# --- Pydantic Schemas ---

class IncidentBase(BaseModel):
    title: str
    description: str = ""
    incident_type: str
    severity: str = "MEDIUM"
    source: str = ""
    source_file: str = ""


class IncidentCreate(IncidentBase):
    confidence: float = 0.0
    evidence: list = []
    indicators: list = []
    affected_assets: list = []
    agent_findings: list = []
    correlation_data: dict = {}
    response_actions: list = []
    correlation_score: float = 0.0
    analysis_session_id: Optional[int] = None


class IncidentResponse(IncidentBase):
    id: int
    incident_id: str
    status: str = "Investigating"
    confidence: float = 0.0
    evidence: Any = []
    indicators: Any = []
    affected_assets: Any = []
    agent_findings: Any = []
    correlation_data: Any = {}
    response_actions: Any = []
    correlation_score: float = 0.0
    detected_at: datetime.datetime
    updated_at: datetime.datetime
    resolved_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


class IncidentSummary(BaseModel):
    id: int
    incident_id: str
    title: str
    incident_type: str
    severity: str
    status: str
    confidence: float
    source: str
    detected_at: datetime.datetime

    class Config:
        from_attributes = True

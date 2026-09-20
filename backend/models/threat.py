"""Threat indicator model and schemas."""

import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from sqlalchemy.sql import func
from pydantic import BaseModel
from backend.database import Base


class ThreatIndicator(Base):
    __tablename__ = "threat_indicators"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ioc_type = Column(String(20), nullable=False)  # ip, domain, url, hash, email
    value = Column(String(500), nullable=False)
    risk_level = Column(String(20), default="UNKNOWN")
    category = Column(String(100), default="")  # C2, Phishing, Malware, etc.
    source = Column(String(100), default="")  # which agent found it
    description = Column(Text, default="")
    context = Column(JSON, default=dict)
    first_seen = Column(DateTime, server_default=func.now())
    last_seen = Column(DateTime, server_default=func.now())
    incident_id = Column(Integer, nullable=True)


# --- Pydantic Schemas ---

class ThreatIndicatorCreate(BaseModel):
    ioc_type: str
    value: str
    risk_level: str = "UNKNOWN"
    category: str = ""
    source: str = ""
    description: str = ""
    context: dict = {}
    incident_id: Optional[int] = None


class ThreatIndicatorResponse(ThreatIndicatorCreate):
    id: int
    first_seen: datetime.datetime
    last_seen: datetime.datetime

    class Config:
        from_attributes = True

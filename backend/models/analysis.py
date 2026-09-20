"""Analysis session model and schemas."""

import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from sqlalchemy.sql import func
from pydantic import BaseModel
from backend.database import Base


class AnalysisSession(Base):
    __tablename__ = "analysis_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_type = Column(String(20), nullable=False)  # pcap, log, email, file
    filename = Column(String(255), default="")
    file_hash = Column(String(64), default="")
    status = Column(String(20), default="pending")  # pending, parsing, analyzing, correlating, completed, failed
    progress = Column(Integer, default=0)  # 0-100

    # Results
    parsed_data = Column(JSON, default=dict)
    agent_results = Column(JSON, default=list)
    threats_found = Column(Integer, default=0)
    incidents_created = Column(JSON, default=list)

    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)

    # Error tracking
    error_message = Column(Text, nullable=True)


# --- Pydantic Schemas ---

class AnalysisSessionCreate(BaseModel):
    session_type: str
    filename: str = ""


class AnalysisSessionResponse(BaseModel):
    id: int
    session_type: str
    filename: str
    status: str
    progress: int
    threats_found: int
    incidents_created: list
    agent_results: list
    created_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True

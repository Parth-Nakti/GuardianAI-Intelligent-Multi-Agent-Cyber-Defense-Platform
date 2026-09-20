"""Agent status schemas (not persisted — tracked in memory by AgentManager)."""

from pydantic import BaseModel
from typing import Optional
import datetime


class AgentStatus(BaseModel):
    id: str
    name: str
    description: str
    status: str = "online"  # online, processing, waiting, offline
    last_task: str = "None"
    last_task_status: str = "idle"  # idle, completed, failed, processing
    total_analyses: int = 0
    successful: int = 0
    failed: int = 0
    last_active: Optional[datetime.datetime] = None


class AgentResult(BaseModel):
    """Standard result structure returned by every agent."""
    agent: str
    status: str = "completed"  # completed, error
    threat_detected: bool = False
    threat_type: str = ""
    severity: str = "LOW"
    confidence: float = 0.0
    findings: list = []
    indicators: list = []  # IOCs extracted
    recommendations: list = []
    explanation: str = ""
    raw_analysis: dict = {}
    error: Optional[str] = None

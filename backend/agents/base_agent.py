"""Base Agent — abstract interface for all SentinelAI agents."""

import json
import logging
from abc import ABC, abstractmethod
from typing import Any
from backend.ai.llm_client import get_llm_client
from backend.models.agent import AgentResult

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Abstract base agent that all specialized agents inherit from."""

    name: str = ""
    description: str = ""
    agent_id: str = ""

    def __init__(self):
        self.llm = get_llm_client()
        self.total_analyses = 0
        self.successful = 0
        self.failed = 0
        self.last_task = "None"
        self.last_task_status = "idle"
        self.status = "online"

    @abstractmethod
    async def analyze(self, data: dict[str, Any]) -> AgentResult:
        """Analyze input data and return structured results."""
        raise NotImplementedError

    async def _get_llm_analysis(self, system_prompt: str, user_prompt: str) -> dict:
        """Get analysis from LLM and parse JSON response."""
        try:
            response = await self.llm.generate(system_prompt, user_prompt)
            # Try to parse as JSON
            try:
                return json.loads(response)
            except json.JSONDecodeError:
                # Try to extract JSON from response
                start = response.find("{")
                end = response.rfind("}") + 1
                if start >= 0 and end > start:
                    return json.loads(response[start:end])
                return {"analysis": response, "findings": []}
        except Exception as e:
            logger.error(f"LLM analysis error in {self.name}: {e}")
            return {"error": str(e), "analysis": "LLM analysis unavailable"}

    def _update_stats(self, success: bool, task_name: str):
        """Update agent statistics."""
        self.total_analyses += 1
        if success:
            self.successful += 1
            self.last_task_status = "completed"
        else:
            self.failed += 1
            self.last_task_status = "failed"
        self.last_task = task_name
        self.status = "online"

    def get_status(self) -> dict:
        """Get current agent status."""
        return {
            "id": self.agent_id,
            "name": self.name,
            "description": self.description,
            "status": self.status,
            "last_task": self.last_task,
            "last_task_status": self.last_task_status,
            "total_analyses": self.total_analyses,
            "successful": self.successful,
            "failed": self.failed,
        }

"""Agents API — status and monitoring endpoints."""

from fastapi import APIRouter, HTTPException
from backend.agents.agent_manager import get_agent_manager

router = APIRouter(prefix="/api/agents", tags=["Agents"])


@router.get("")
async def list_agents():
    """Get status of all AI agents."""
    manager = get_agent_manager()
    return manager.get_all_statuses()


@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    """Get individual agent details."""
    manager = get_agent_manager()
    status = manager.get_agent_status(agent_id)
    if not status:
        raise HTTPException(status_code=404, detail="Agent not found")
    return status

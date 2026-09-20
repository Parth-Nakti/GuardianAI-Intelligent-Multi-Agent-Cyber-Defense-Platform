"""Agent Manager — orchestrates the multi-agent analysis pipeline."""

import logging
from typing import Any
from backend.agents.network_agent import NetworkAgent
from backend.agents.phishing_agent import PhishingAgent
from backend.agents.malware_agent import MalwareAgent
from backend.agents.threat_intelligence_agent import ThreatIntelligenceAgent
from backend.agents.correlation_agent import CorrelationAgent
from backend.agents.response_agent import ResponseAgent
from backend.agents.report_agent import ReportAgent

logger = logging.getLogger(__name__)


class AgentManager:
    """Manages all agents and orchestrates the analysis pipeline."""

    def __init__(self):
        self.agents = {
            "network_monitor": NetworkAgent(),
            "phishing_detection": PhishingAgent(),
            "malware_analysis": MalwareAgent(),
            "threat_intelligence": ThreatIntelligenceAgent(),
            "incident_correlation": CorrelationAgent(),
            "incident_response": ResponseAgent(),
            "report_generation": ReportAgent(),
        }

    def get_all_statuses(self) -> list[dict]:
        """Get status of all agents."""
        return [agent.get_status() for agent in self.agents.values()]

    def get_agent_status(self, agent_id: str) -> dict | None:
        agent = self.agents.get(agent_id)
        if agent:
            return agent.get_status()
        return None

    async def run_network_analysis(self, parsed_data: dict) -> dict[str, Any]:
        """Run the full pipeline for network/PCAP analysis."""
        pipeline_results = {"stages": [], "agent_results": []}

        # Stage 1: Network Agent
        logger.info("Pipeline: Running Network Monitor Agent...")
        network_result = await self.agents["network_monitor"].analyze(parsed_data)
        nr_dict = network_result.model_dump()
        pipeline_results["agent_results"].append(nr_dict)
        pipeline_results["stages"].append({"agent": "Network Monitor Agent", "status": "completed"})

        # Stage 2: Threat Intelligence
        logger.info("Pipeline: Running Threat Intelligence Agent...")
        ti_result = await self.agents["threat_intelligence"].analyze({"indicators": nr_dict.get("indicators", [])})
        ti_dict = ti_result.model_dump()
        pipeline_results["agent_results"].append(ti_dict)
        pipeline_results["stages"].append({"agent": "Threat Intelligence Agent", "status": "completed"})

        # Stage 3: Correlation
        logger.info("Pipeline: Running Incident Correlation Agent...")
        corr_result = await self.agents["incident_correlation"].analyze({
            "agent_results": pipeline_results["agent_results"]
        })
        corr_dict = corr_result.model_dump()
        pipeline_results["correlation"] = corr_dict
        pipeline_results["stages"].append({"agent": "Incident Correlation Agent", "status": "completed"})

        # Stage 4: Response (if threat detected)
        if any(r.get("threat_detected") for r in pipeline_results["agent_results"]):
            logger.info("Pipeline: Running Incident Response Agent...")
            resp_result = await self.agents["incident_response"].analyze({
                "severity": corr_dict.get("severity", nr_dict.get("severity", "MEDIUM")),
                "threat_type": corr_dict.get("threat_type", nr_dict.get("threat_type", "")),
                "findings": corr_dict.get("findings", []),
                "indicators": nr_dict.get("indicators", []),
            })
            resp_dict = resp_result.model_dump()
            pipeline_results["response"] = resp_dict
            pipeline_results["stages"].append({"agent": "Incident Response Agent", "status": "completed"})

        return pipeline_results

    async def run_email_analysis(self, parsed_data: dict) -> dict[str, Any]:
        """Run the full pipeline for email/phishing analysis."""
        pipeline_results = {"stages": [], "agent_results": []}

        # Stage 1: Phishing Agent
        logger.info("Pipeline: Running Phishing Detection Agent...")
        phish_result = await self.agents["phishing_detection"].analyze(parsed_data)
        ph_dict = phish_result.model_dump()
        pipeline_results["agent_results"].append(ph_dict)
        pipeline_results["stages"].append({"agent": "Phishing Detection Agent", "status": "completed"})

        # Stage 2: Threat Intelligence
        logger.info("Pipeline: Running Threat Intelligence Agent...")
        ti_result = await self.agents["threat_intelligence"].analyze({"indicators": ph_dict.get("indicators", [])})
        ti_dict = ti_result.model_dump()
        pipeline_results["agent_results"].append(ti_dict)
        pipeline_results["stages"].append({"agent": "Threat Intelligence Agent", "status": "completed"})

        # Stage 3: Correlation
        logger.info("Pipeline: Running Incident Correlation Agent...")
        corr_result = await self.agents["incident_correlation"].analyze({
            "agent_results": pipeline_results["agent_results"]
        })
        corr_dict = corr_result.model_dump()
        pipeline_results["correlation"] = corr_dict
        pipeline_results["stages"].append({"agent": "Incident Correlation Agent", "status": "completed"})

        # Stage 4: Response
        if any(r.get("threat_detected") for r in pipeline_results["agent_results"]):
            logger.info("Pipeline: Running Incident Response Agent...")
            resp_result = await self.agents["incident_response"].analyze({
                "severity": corr_dict.get("severity", ph_dict.get("severity", "MEDIUM")),
                "threat_type": corr_dict.get("threat_type", ph_dict.get("threat_type", "")),
                "findings": corr_dict.get("findings", []),
                "indicators": ph_dict.get("indicators", []),
            })
            resp_dict = resp_result.model_dump()
            pipeline_results["response"] = resp_dict
            pipeline_results["stages"].append({"agent": "Incident Response Agent", "status": "completed"})

        return pipeline_results

    async def run_log_analysis(self, parsed_data: dict) -> dict[str, Any]:
        """Run the full pipeline for log analysis (reuses network agent logic)."""
        pipeline_results = {"stages": [], "agent_results": []}

        # Stage 1: Network Agent (also handles logs)
        logger.info("Pipeline: Running Network Monitor Agent on logs...")
        # Build a compatible analysis from log data
        log_analysis_data = {
            "total_packets": parsed_data.get("total_lines", 0),
            "protocols": {},
            "source_ips": parsed_data.get("all_ips", {}),
            "destination_ips": {},
            "unique_ips": list(parsed_data.get("all_ips", {}).keys()),
            "unique_ports": [],
            "dns_queries": [],
            "connections": [],
            "suspicious_indicators": parsed_data.get("suspicious_indicators", []),
        }
        net_result = await self.agents["network_monitor"].analyze(log_analysis_data)
        nr_dict = net_result.model_dump()
        pipeline_results["agent_results"].append(nr_dict)
        pipeline_results["stages"].append({"agent": "Network Monitor Agent", "status": "completed"})

        # Stage 2: Threat Intelligence
        iocs = []
        for ip in parsed_data.get("failed_login_ips", {}).keys():
            iocs.append({"type": "ip", "value": ip, "context": "Failed login source"})
        for ioc in nr_dict.get("indicators", []):
            iocs.append(ioc)

        logger.info("Pipeline: Running Threat Intelligence Agent...")
        ti_result = await self.agents["threat_intelligence"].analyze({"indicators": iocs})
        ti_dict = ti_result.model_dump()
        pipeline_results["agent_results"].append(ti_dict)
        pipeline_results["stages"].append({"agent": "Threat Intelligence Agent", "status": "completed"})

        # Stage 3: Correlation
        logger.info("Pipeline: Running Incident Correlation Agent...")
        corr_result = await self.agents["incident_correlation"].analyze({
            "agent_results": pipeline_results["agent_results"]
        })
        corr_dict = corr_result.model_dump()
        pipeline_results["correlation"] = corr_dict
        pipeline_results["stages"].append({"agent": "Incident Correlation Agent", "status": "completed"})

        # Stage 4: Response
        if any(r.get("threat_detected") for r in pipeline_results["agent_results"]):
            logger.info("Pipeline: Running Incident Response Agent...")
            resp_result = await self.agents["incident_response"].analyze({
                "severity": corr_dict.get("severity", nr_dict.get("severity", "MEDIUM")),
                "threat_type": corr_dict.get("threat_type", nr_dict.get("threat_type", "")),
                "findings": corr_dict.get("findings", []),
                "indicators": iocs,
            })
            resp_dict = resp_result.model_dump()
            pipeline_results["response"] = resp_dict
            pipeline_results["stages"].append({"agent": "Incident Response Agent", "status": "completed"})

        return pipeline_results

    async def generate_report(self, incident_data: dict, pipeline_results: dict) -> dict:
        """Generate a report for an incident."""
        logger.info("Pipeline: Running Report Generation Agent...")
        report_result = await self.agents["report_generation"].analyze({
            "incident": incident_data,
            "agent_results": pipeline_results.get("agent_results", []),
            "correlation": pipeline_results.get("correlation", {}),
            "response": pipeline_results.get("response", {}),
        })
        return report_result.model_dump()


# Singleton
_agent_manager = None


def get_agent_manager() -> AgentManager:
    global _agent_manager
    if _agent_manager is None:
        _agent_manager = AgentManager()
    return _agent_manager

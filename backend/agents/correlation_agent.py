"""Incident Correlation Agent — correlates findings from multiple agents."""

import json
import logging
from typing import Any
from backend.agents.base_agent import BaseAgent
from backend.models.agent import AgentResult
from backend.ai.prompts import CORRELATION_AGENT_SYSTEM, CORRELATION_AGENT_USER

logger = logging.getLogger(__name__)


class CorrelationAgent(BaseAgent):
    name = "Incident Correlation Agent"
    description = "Correlates findings from multiple security agents to identify connected threats and create unified incidents."
    agent_id = "incident_correlation"

    async def analyze(self, data: dict[str, Any]) -> AgentResult:
        self.status = "processing"
        self.last_task = "Incident Correlation"

        try:
            agent_results = data.get("agent_results", [])

            # Deterministic correlation
            all_iocs = {}
            shared_indicators = []
            all_findings = []
            all_threat_types = []

            for result in agent_results:
                agent_name = result.get("agent", "Unknown")
                for ioc in result.get("indicators", []):
                    value = ioc.get("value", "")
                    ioc_type = ioc.get("type", "")
                    key = f"{ioc_type}:{value}"

                    if key in all_iocs:
                        all_iocs[key]["agents"].append(agent_name)
                        all_iocs[key]["count"] += 1
                    else:
                        all_iocs[key] = {
                            "type": ioc_type,
                            "value": value,
                            "agents": [agent_name],
                            "count": 1,
                            **ioc,
                        }

                if result.get("threat_detected"):
                    all_threat_types.append(result.get("threat_type", "Unknown"))

                for finding in result.get("findings", [])[:5]:
                    all_findings.append(f"[{agent_name}] {finding}")

            # Find shared IOCs (appeared in multiple agent results)
            for key, ioc_data in all_iocs.items():
                if ioc_data["count"] > 1:
                    shared_indicators.append(ioc_data)

            # Calculate correlation score
            correlation_score = self._calculate_correlation_score(
                agent_results, shared_indicators
            )

            findings = []
            threat_detected = any(r.get("threat_detected") for r in agent_results)

            if shared_indicators:
                findings.append(f"Found {len(shared_indicators)} shared indicators across agents:")
                for si in shared_indicators:
                    agents_str = ", ".join(si["agents"])
                    findings.append(f"  • {si['type'].upper()} {si['value']} (found by: {agents_str})")

            if all_threat_types:
                findings.append(f"Threat types identified: {', '.join(set(all_threat_types))}")

            findings.append(f"Correlation score: {correlation_score:.0%}")
            findings.append(f"Agents involved: {len(agent_results)}")

            # Determine severity
            severity_order = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1, "INFO": 0}
            max_severity = "LOW"
            for r in agent_results:
                s = r.get("severity", "LOW")
                if severity_order.get(s, 0) > severity_order.get(max_severity, 0):
                    max_severity = s

            # Boost severity if high correlation
            if correlation_score > 0.7 and max_severity == "MEDIUM":
                max_severity = "HIGH"

            # LLM analysis
            correlation_data = {
                "agent_count": len(agent_results),
                "agent_findings": [
                    {
                        "agent": r.get("agent"),
                        "threat_detected": r.get("threat_detected"),
                        "threat_type": r.get("threat_type"),
                        "severity": r.get("severity"),
                        "key_findings": r.get("findings", [])[:5],
                        "indicators_count": len(r.get("indicators", [])),
                    }
                    for r in agent_results
                ],
                "shared_indicators": [
                    {"type": si["type"], "value": si["value"], "agents": si["agents"]}
                    for si in shared_indicators
                ],
                "correlation_score": correlation_score,
            }

            llm_result = await self._get_llm_analysis(
                CORRELATION_AGENT_SYSTEM,
                CORRELATION_AGENT_USER.format(data=json.dumps(correlation_data, indent=2))
            )

            explanation = llm_result.get("analysis", "Correlation analysis completed.")
            unified_threat = llm_result.get("unified_threat", "Correlated security incident")
            llm_findings = llm_result.get("key_findings", [])

            # Merge LLM correlation score if available
            llm_corr = llm_result.get("correlation_score")
            if llm_corr and isinstance(llm_corr, (int, float)):
                correlation_score = (correlation_score + llm_corr) / 2

            confidence = max(
                llm_result.get("confidence", 0.5),
                correlation_score
            )

            result = AgentResult(
                agent=self.name,
                status="completed",
                threat_detected=threat_detected,
                threat_type=unified_threat,
                severity=max_severity,
                confidence=confidence,
                findings=findings + llm_findings,
                indicators=[
                    {"type": si["type"], "value": si["value"], "agents": si["agents"], "context": "Correlated IOC"}
                    for si in shared_indicators
                ],
                recommendations=[],
                explanation=explanation,
                raw_analysis={
                    "correlation_score": correlation_score,
                    "shared_indicators": shared_indicators,
                    "all_findings": all_findings,
                    "unified_threat": unified_threat,
                    "llm_analysis": llm_result,
                }
            )
            self._update_stats(True, "Incident Correlation")
            return result

        except Exception as e:
            logger.error(f"CorrelationAgent error: {e}")
            self._update_stats(False, "Incident Correlation")
            return AgentResult(
                agent=self.name, status="error", error=str(e),
                explanation=f"Correlation failed: {str(e)}"
            )

    def _calculate_correlation_score(self, agent_results: list, shared_indicators: list) -> float:
        """Calculate how strongly evidence correlates across agents."""
        if not agent_results:
            return 0.0

        score = 0.0
        max_score = 0.0

        # Shared indicators (strongest signal)
        max_score += 0.4
        if shared_indicators:
            score += min(0.4, len(shared_indicators) * 0.1)

        # Multiple agents detected threats
        max_score += 0.3
        threat_agents = sum(1 for r in agent_results if r.get("threat_detected"))
        if threat_agents > 1:
            score += min(0.3, threat_agents * 0.1)
        elif threat_agents == 1:
            score += 0.1

        # High confidence from individual agents
        max_score += 0.2
        avg_confidence = sum(r.get("confidence", 0) for r in agent_results) / len(agent_results)
        score += 0.2 * avg_confidence

        # Severity alignment
        max_score += 0.1
        severities = [r.get("severity", "LOW") for r in agent_results if r.get("threat_detected")]
        if len(set(severities)) == 1 and len(severities) > 1:
            score += 0.1  # Agents agree on severity

        return min(1.0, score / max_score) if max_score > 0 else 0.0

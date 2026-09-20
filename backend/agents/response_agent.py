"""Incident Response Agent — generates safe response recommendations."""

import json
import logging
from typing import Any
from backend.agents.base_agent import BaseAgent
from backend.models.agent import AgentResult
from backend.ai.prompts import RESPONSE_AGENT_SYSTEM, RESPONSE_AGENT_USER

logger = logging.getLogger(__name__)

# Predefined response playbooks by incident type
RESPONSE_PLAYBOOKS = {
    "Port Scan": {
        "immediate": [
            "Block source IP at perimeter firewall",
            "Verify no unauthorized access occurred on scanned ports",
            "Enable enhanced logging on targeted hosts",
        ],
        "short_term": [
            "Review firewall rules for unnecessary open ports",
            "Scan targeted hosts for compromise indicators",
            "Update IDS/IPS signatures",
        ],
        "long_term": [
            "Implement network segmentation",
            "Deploy honeypots for early detection",
            "Review port exposure policy",
        ],
    },
    "Phishing": {
        "immediate": [
            "Quarantine the phishing email from all mailboxes",
            "Block the sender domain and identified malicious URLs",
            "Alert all users who received the email",
        ],
        "short_term": [
            "Check if any users clicked malicious links",
            "Reset credentials for affected accounts",
            "Scan endpoints for malware from phishing payload",
        ],
        "long_term": [
            "Conduct phishing awareness training",
            "Implement email authentication (SPF/DKIM/DMARC)",
            "Deploy advanced email filtering",
        ],
    },
    "Brute Force": {
        "immediate": [
            "Block attacking IP addresses",
            "Lock affected user accounts temporarily",
            "Enable account lockout policies if not active",
        ],
        "short_term": [
            "Reset passwords for targeted accounts",
            "Review authentication logs for successful compromise",
            "Implement rate limiting on authentication endpoints",
        ],
        "long_term": [
            "Deploy multi-factor authentication",
            "Implement IP-based access controls",
            "Set up automated brute-force detection and response",
        ],
    },
    "Malware": {
        "immediate": [
            "Isolate affected endpoints from the network",
            "Preserve forensic evidence (memory dump, disk image)",
            "Block identified malicious hashes and domains",
        ],
        "short_term": [
            "Scan all endpoints with updated signatures",
            "Review lateral movement indicators",
            "Check for persistence mechanisms",
        ],
        "long_term": [
            "Update endpoint protection solutions",
            "Review application whitelisting policies",
            "Conduct malware analysis training",
        ],
    },
}


class ResponseAgent(BaseAgent):
    name = "Incident Response Agent"
    description = "Analyzes incidents and provides safe, prioritized response recommendations for security analysts."
    agent_id = "incident_response"

    async def analyze(self, data: dict[str, Any]) -> AgentResult:
        self.status = "processing"
        incident_id = data.get("incident_id", "Unknown")
        self.last_task = f"Incident {incident_id}"

        try:
            severity = data.get("severity", "MEDIUM")
            threat_type = data.get("threat_type", "Unknown")
            findings_summary = data.get("findings", [])
            indicators = data.get("indicators", [])

            # Get playbook-based recommendations
            playbook = None
            for key, pb in RESPONSE_PLAYBOOKS.items():
                if key.lower() in threat_type.lower():
                    playbook = pb
                    break

            if not playbook:
                playbook = {
                    "immediate": [
                        "Isolate affected systems",
                        "Preserve evidence for investigation",
                        "Block identified malicious indicators",
                    ],
                    "short_term": [
                        "Conduct thorough investigation",
                        "Review related logs and data",
                        "Update detection signatures",
                    ],
                    "long_term": [
                        "Review and update security policies",
                        "Conduct lessons-learned review",
                        "Implement additional monitoring",
                    ],
                }

            # LLM analysis
            incident_data = {
                "severity": severity,
                "threat_type": threat_type,
                "findings": findings_summary[:15],
                "indicators": indicators[:10],
                "playbook_actions": playbook,
            }

            llm_result = await self._get_llm_analysis(
                RESPONSE_AGENT_SYSTEM,
                RESPONSE_AGENT_USER.format(data=json.dumps(incident_data, indent=2))
            )

            explanation = llm_result.get("analysis", "Incident response plan generated.")

            # Merge playbook and LLM recommendations
            immediate = llm_result.get("immediate_actions", playbook["immediate"])
            short_term = llm_result.get("short_term_actions", playbook["short_term"])
            long_term = llm_result.get("long_term_actions", playbook["long_term"])

            all_recommendations = []
            all_recommendations.append("=== IMMEDIATE ACTIONS ===")
            all_recommendations.extend(immediate)
            all_recommendations.append("=== SHORT-TERM ACTIONS (24-48 hours) ===")
            all_recommendations.extend(short_term)
            all_recommendations.append("=== LONG-TERM ACTIONS ===")
            all_recommendations.extend(long_term)

            priority = "URGENT" if severity in ("CRITICAL", "HIGH") else "HIGH" if severity == "MEDIUM" else "MEDIUM"

            findings = [
                f"Incident severity: {severity}",
                f"Threat type: {threat_type}",
                f"Response priority: {priority}",
                f"Immediate actions: {len(immediate)}",
                f"Short-term actions: {len(short_term)}",
                f"Long-term actions: {len(long_term)}",
                "NOTE: All actions are RECOMMENDATIONS for human analysts",
            ]

            result = AgentResult(
                agent=self.name,
                status="completed",
                threat_detected=True,
                threat_type=threat_type,
                severity=severity,
                confidence=0.85,
                findings=findings,
                indicators=[],
                recommendations=all_recommendations,
                explanation=explanation,
                raw_analysis={
                    "immediate_actions": immediate,
                    "short_term_actions": short_term,
                    "long_term_actions": long_term,
                    "priority": priority,
                    "llm_analysis": llm_result,
                }
            )
            self._update_stats(True, f"Incident {incident_id}")
            return result

        except Exception as e:
            logger.error(f"ResponseAgent error: {e}")
            self._update_stats(False, f"Incident {incident_id}")
            return AgentResult(
                agent=self.name, status="error", error=str(e),
                explanation=f"Response generation failed: {str(e)}"
            )

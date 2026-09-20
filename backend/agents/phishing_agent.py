"""Phishing Detection Agent — analyzes emails for phishing indicators."""

import json
import logging
from typing import Any
from backend.agents.base_agent import BaseAgent
from backend.models.agent import AgentResult
from backend.ai.prompts import PHISHING_AGENT_SYSTEM, PHISHING_AGENT_USER

logger = logging.getLogger(__name__)


class PhishingAgent(BaseAgent):
    name = "Phishing Detection Agent"
    description = "Analyzes email content to detect phishing attempts, social engineering, and credential harvesting."
    agent_id = "phishing_detection"

    async def analyze(self, data: dict[str, Any]) -> AgentResult:
        self.status = "processing"
        self.last_task = "Email Analysis"

        try:
            indicators = data.get("suspicious_indicators", [])
            threat_detected = len(indicators) > 0

            severity_order = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1, "INFO": 0}
            severities = [i.get("severity", "LOW") for i in indicators]
            max_severity = max(severities, key=lambda s: severity_order.get(s, 0)) if severities else "LOW"

            # Determine threat type
            indicator_types = [i.get("type", "") for i in indicators]
            if "Credential Harvesting" in indicator_types:
                threat_type = "Credential Phishing"
            elif "Suspicious URL" in indicator_types or "IP-based URL" in indicator_types:
                threat_type = "URL Phishing"
            elif "Domain Mismatch" in indicator_types:
                threat_type = "Domain Spoofing"
            elif "Suspicious Attachment" in indicator_types:
                threat_type = "Malicious Attachment"
            elif indicators:
                threat_type = "Phishing"
            else:
                threat_type = ""

            # Build findings
            findings = []
            for ind in indicators:
                findings.append(f"[{ind['severity']}] {ind['type']}: {ind['description']}")

            # Add email metadata
            findings.append(f"Sender: {data.get('sender', 'Unknown')}")
            findings.append(f"Subject: {data.get('subject', 'Unknown')}")
            if data.get("urls"):
                findings.append(f"URLs found: {len(data['urls'])}")
            if data.get("attachments"):
                findings.append(f"Attachments: {len(data['attachments'])}")

            # Extract IOCs
            iocs = []
            seen = set()
            for url in data.get("urls", []):
                if url not in seen:
                    iocs.append({"type": "url", "value": url, "context": "Email URL"})
                    seen.add(url)
            for domain in data.get("domains", []):
                if domain not in seen:
                    iocs.append({"type": "domain", "value": domain, "context": "Email Domain"})
                    seen.add(domain)
            for email_addr in data.get("email_addresses", []):
                if email_addr not in seen:
                    iocs.append({"type": "email", "value": email_addr, "context": "Email Address"})
                    seen.add(email_addr)

            # LLM analysis
            email_summary = {
                "sender": data.get("sender", ""),
                "sender_domain": data.get("sender_domain", ""),
                "recipient": data.get("recipient", ""),
                "subject": data.get("subject", ""),
                "body_preview": data.get("body_text", "")[:1000],
                "urls": data.get("urls", [])[:10],
                "domains": data.get("domains", []),
                "attachments": data.get("attachments", []),
                "suspicious_indicators": indicators[:10],
                "spf": data.get("spf", ""),
                "authentication_results": data.get("authentication_results", "")[:200],
            }

            llm_result = await self._get_llm_analysis(
                PHISHING_AGENT_SYSTEM,
                PHISHING_AGENT_USER.format(data=json.dumps(email_summary, indent=2))
            )

            explanation = llm_result.get("analysis", "Email analyzed for phishing indicators.")
            llm_findings = llm_result.get("key_findings", [])
            recommendations = llm_result.get("recommendations", [])

            if not recommendations:
                recommendations = [
                    "Quarantine the suspicious email",
                    "Block the sender domain",
                    "Alert users about the phishing campaign",
                    "Check for similar emails in other mailboxes",
                    "Reset credentials for any affected users",
                ]

            confidence = llm_result.get("confidence", 0.5)
            if threat_detected:
                # Boost confidence based on number of indicators
                confidence = max(confidence, min(0.95, 0.6 + len(indicators) * 0.08))

            result = AgentResult(
                agent=self.name,
                status="completed",
                threat_detected=threat_detected,
                threat_type=threat_type,
                severity=max_severity,
                confidence=confidence,
                findings=findings + llm_findings,
                indicators=iocs,
                recommendations=recommendations,
                explanation=explanation,
                raw_analysis={
                    "deterministic_indicators": indicators,
                    "llm_analysis": llm_result,
                    "email_metadata": {
                        "sender": data.get("sender", ""),
                        "subject": data.get("subject", ""),
                        "urls_count": len(data.get("urls", [])),
                        "domains": data.get("domains", []),
                    }
                }
            )
            self._update_stats(True, "Email Analysis")
            return result

        except Exception as e:
            logger.error(f"PhishingAgent analysis error: {e}")
            self._update_stats(False, "Email Analysis")
            return AgentResult(
                agent=self.name, status="error", error=str(e),
                explanation=f"Analysis failed: {str(e)}"
            )

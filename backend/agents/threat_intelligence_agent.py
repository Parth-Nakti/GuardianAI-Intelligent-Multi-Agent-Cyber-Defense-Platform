"""Threat Intelligence Agent — looks up IOCs against local threat intel database."""

import json
import logging
from pathlib import Path
from typing import Any
from backend.agents.base_agent import BaseAgent
from backend.models.agent import AgentResult
from backend.ai.prompts import THREAT_INTEL_SYSTEM, THREAT_INTEL_USER
from backend.config import settings

logger = logging.getLogger(__name__)


class ThreatIntelligenceAgent(BaseAgent):
    name = "Threat Intelligence Agent"
    description = "Analyzes Indicators of Compromise against threat intelligence databases to provide context and risk assessment."
    agent_id = "threat_intelligence"

    def __init__(self):
        super().__init__()
        self._threat_db = self._load_threat_db()

    def _load_threat_db(self) -> dict:
        """Load the local demonstration threat intelligence database."""
        db_path = settings.data_dir / "threat_intel_db.json"
        try:
            if db_path.exists():
                return json.loads(db_path.read_text())
        except Exception as e:
            logger.error(f"Failed to load threat intel DB: {e}")
        return {"ips": {}, "domains": {}, "hashes": {}, "urls": {}, "emails": {}}

    def _lookup_ioc(self, ioc_type: str, value: str) -> dict | None:
        """Look up an IOC in the local threat database."""
        db_section = self._threat_db.get(f"{ioc_type}s", {})
        return db_section.get(value, None)

    async def analyze(self, data: dict[str, Any]) -> AgentResult:
        """Analyze IOCs from other agents against threat intelligence."""
        self.status = "processing"
        self.last_task = "IOC Investigation"

        try:
            iocs = data.get("indicators", [])
            findings = []
            enriched_iocs = []
            threat_detected = False
            max_severity = "LOW"
            severity_order = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1, "INFO": 0}

            for ioc in iocs:
                ioc_type = ioc.get("type", "")
                value = ioc.get("value", "")
                context = ioc.get("context", "")

                # Look up in local DB
                intel = self._lookup_ioc(ioc_type, value)

                if intel:
                    threat_detected = True
                    risk = intel.get("risk_level", "HIGH")
                    category = intel.get("category", "Unknown")
                    desc = intel.get("description", "Known threat indicator")

                    if severity_order.get(risk, 0) > severity_order.get(max_severity, 0):
                        max_severity = risk

                    findings.append(
                        f"[{risk}] IOC Match: {ioc_type.upper()} {value} — {category}: {desc}"
                    )
                    enriched_iocs.append({
                        **ioc,
                        "threat_intel": intel,
                        "matched": True,
                    })
                else:
                    findings.append(f"[INFO] No threat intel match for {ioc_type.upper()}: {value}")
                    enriched_iocs.append({
                        **ioc,
                        "threat_intel": None,
                        "matched": False,
                    })

            # LLM analysis
            intel_summary = {
                "total_iocs": len(iocs),
                "matched_iocs": sum(1 for i in enriched_iocs if i.get("matched")),
                "iocs": enriched_iocs[:20],
            }

            llm_result = await self._get_llm_analysis(
                THREAT_INTEL_SYSTEM,
                THREAT_INTEL_USER.format(data=json.dumps(intel_summary, indent=2))
            )

            explanation = llm_result.get("analysis", "Threat intelligence analysis completed.")
            llm_findings = llm_result.get("key_findings", [])
            recommendations = llm_result.get("recommendations", [])

            if not recommendations and threat_detected:
                recommendations = [
                    "Block all matched malicious indicators",
                    "Investigate systems that communicated with matched IOCs",
                    "Update detection signatures with new IOCs",
                    "Monitor for additional related indicators",
                ]

            confidence = llm_result.get("confidence", 0.5)
            matched_count = sum(1 for i in enriched_iocs if i.get("matched"))
            if matched_count > 0:
                confidence = max(confidence, 0.7 + min(0.25, matched_count * 0.05))

            result = AgentResult(
                agent=self.name,
                status="completed",
                threat_detected=threat_detected,
                threat_type="Known Threat Infrastructure" if threat_detected else "",
                severity=max_severity,
                confidence=confidence,
                findings=findings + llm_findings,
                indicators=enriched_iocs,
                recommendations=recommendations,
                explanation=explanation,
                raw_analysis={
                    "enriched_iocs": enriched_iocs,
                    "llm_analysis": llm_result,
                    "total_iocs": len(iocs),
                    "matched_count": matched_count,
                }
            )
            self._update_stats(True, "IOC Investigation")
            return result

        except Exception as e:
            logger.error(f"ThreatIntelligenceAgent error: {e}")
            self._update_stats(False, "IOC Investigation")
            return AgentResult(
                agent=self.name, status="error", error=str(e),
                explanation=f"Analysis failed: {str(e)}"
            )

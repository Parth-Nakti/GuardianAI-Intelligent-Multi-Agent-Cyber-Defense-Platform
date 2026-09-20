"""Report Generation Agent — compiles findings into professional security reports."""

import json
import logging
from datetime import datetime
from typing import Any
from backend.agents.base_agent import BaseAgent
from backend.models.agent import AgentResult
from backend.ai.prompts import REPORT_AGENT_SYSTEM, REPORT_AGENT_USER

logger = logging.getLogger(__name__)


class ReportAgent(BaseAgent):
    name = "Report Generation Agent"
    description = "Compiles agent findings, correlation data, and response recommendations into comprehensive security incident reports."
    agent_id = "report_generation"

    async def analyze(self, data: dict[str, Any]) -> AgentResult:
        self.status = "processing"
        self.last_task = "Report Generation"

        try:
            incident_data = data.get("incident", {})
            agent_results = data.get("agent_results", [])
            correlation_data = data.get("correlation", {})
            response_data = data.get("response", {})

            incident_id = incident_data.get("incident_id", "INC-UNKNOWN")
            severity = incident_data.get("severity", "MEDIUM")
            threat_type = incident_data.get("incident_type", "Unknown")

            # Build report sections
            report = {
                "report_id": f"RPT-{incident_id.replace('INC-', '')}",
                "title": f"Security Incident Report — {incident_id}",
                "incident_id": incident_id,
                "generated_at": datetime.now().isoformat(),
                "sections": {},
            }

            # Incident Information
            report["sections"]["incident_info"] = {
                "incident_id": incident_id,
                "date_time": incident_data.get("detected_at", datetime.now().isoformat()),
                "severity": severity,
                "status": incident_data.get("status", "Investigating"),
                "type": threat_type,
                "source": incident_data.get("source", "Unknown"),
                "source_file": incident_data.get("source_file", ""),
            }

            # Threat Summary
            report["sections"]["threat_summary"] = {
                "description": incident_data.get("description", ""),
                "threat_type": threat_type,
                "affected_assets": incident_data.get("affected_assets", []),
            }

            # Evidence
            evidence = []
            all_indicators = []
            for ar in agent_results:
                for ioc in ar.get("indicators", []):
                    all_indicators.append(ioc)
                for finding in ar.get("findings", []):
                    evidence.append({"agent": ar.get("agent", ""), "finding": finding})
            report["sections"]["evidence"] = {
                "indicators": all_indicators[:30],
                "findings": evidence[:30],
            }

            # Agent Findings
            agent_findings_section = []
            for ar in agent_results:
                agent_findings_section.append({
                    "agent": ar.get("agent", ""),
                    "threat_detected": ar.get("threat_detected", False),
                    "threat_type": ar.get("threat_type", ""),
                    "severity": ar.get("severity", ""),
                    "confidence": ar.get("confidence", 0),
                    "key_findings": ar.get("findings", [])[:10],
                    "explanation": ar.get("explanation", ""),
                })
            report["sections"]["agent_findings"] = agent_findings_section

            # Correlation
            report["sections"]["correlation"] = {
                "score": correlation_data.get("raw_analysis", {}).get("correlation_score", 0),
                "shared_indicators": correlation_data.get("raw_analysis", {}).get("shared_indicators", []),
                "explanation": correlation_data.get("explanation", ""),
            }

            # Response recommendations
            report["sections"]["response"] = {
                "immediate_actions": response_data.get("raw_analysis", {}).get("immediate_actions", []),
                "short_term_actions": response_data.get("raw_analysis", {}).get("short_term_actions", []),
                "long_term_actions": response_data.get("raw_analysis", {}).get("long_term_actions", []),
                "priority": response_data.get("raw_analysis", {}).get("priority", ""),
            }

            # Risk Summary
            confidences = [ar.get("confidence", 0) for ar in agent_results if ar.get("confidence")]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0

            report["sections"]["risk_summary"] = {
                "severity": severity,
                "confidence": round(avg_confidence, 2),
                "impact": "High" if severity in ("CRITICAL", "HIGH") else "Medium" if severity == "MEDIUM" else "Low",
                "likelihood": "High" if avg_confidence > 0.7 else "Medium" if avg_confidence > 0.4 else "Low",
            }

            # LLM: Generate narrative
            report_input = {
                "incident_id": incident_id,
                "severity": severity,
                "threat_type": threat_type,
                "agent_findings_summary": [
                    {"agent": af["agent"], "threat": af["threat_type"], "severity": af["severity"]}
                    for af in agent_findings_section
                ],
                "correlation_score": report["sections"]["correlation"]["score"],
                "evidence_count": len(evidence),
                "indicator_count": len(all_indicators),
            }

            llm_result = await self._get_llm_analysis(
                REPORT_AGENT_SYSTEM,
                REPORT_AGENT_USER.format(data=json.dumps(report_input, indent=2))
            )

            report["sections"]["narrative"] = {
                "executive_summary": llm_result.get("executive_summary", "Security incident detected and analyzed."),
                "detailed_narrative": llm_result.get("narrative", ""),
                "risk_assessment": llm_result.get("risk_assessment", ""),
                "conclusion": llm_result.get("conclusion", ""),
            }

            # Build full text content
            full_content = self._render_text_report(report)

            result = AgentResult(
                agent=self.name,
                status="completed",
                threat_detected=True,
                threat_type=threat_type,
                severity=severity,
                confidence=avg_confidence,
                findings=[f"Report generated: {report['report_id']}", f"Sections: {len(report['sections'])}"],
                indicators=[],
                recommendations=[],
                explanation="Security incident report generated successfully.",
                raw_analysis=report,
            )
            self._update_stats(True, "Report Generation")
            return result

        except Exception as e:
            logger.error(f"ReportAgent error: {e}")
            self._update_stats(False, "Report Generation")
            return AgentResult(
                agent=self.name, status="error", error=str(e),
                explanation=f"Report generation failed: {str(e)}"
            )

    def _render_text_report(self, report: dict) -> str:
        """Render report as formatted text."""
        sections = report.get("sections", {})
        lines = []
        lines.append("=" * 70)
        lines.append(f"  {report['title']}")
        lines.append(f"  Report ID: {report['report_id']}")
        lines.append(f"  Generated: {report['generated_at']}")
        lines.append("=" * 70)

        # Incident Info
        info = sections.get("incident_info", {})
        lines.append("\n--- INCIDENT INFORMATION ---")
        lines.append(f"  Incident ID:  {info.get('incident_id', '')}")
        lines.append(f"  Date/Time:    {info.get('date_time', '')}")
        lines.append(f"  Severity:     {info.get('severity', '')}")
        lines.append(f"  Status:       {info.get('status', '')}")
        lines.append(f"  Type:         {info.get('type', '')}")
        lines.append(f"  Source:       {info.get('source', '')}")

        # Narrative
        narrative = sections.get("narrative", {})
        if narrative.get("executive_summary"):
            lines.append("\n--- EXECUTIVE SUMMARY ---")
            lines.append(f"  {narrative['executive_summary']}")
        if narrative.get("detailed_narrative"):
            lines.append("\n--- DETAILED NARRATIVE ---")
            lines.append(f"  {narrative['detailed_narrative']}")

        # Agent Findings
        agent_findings = sections.get("agent_findings", [])
        if agent_findings:
            lines.append("\n--- AGENT FINDINGS ---")
            for af in agent_findings:
                lines.append(f"\n  [{af.get('agent', '')}]")
                lines.append(f"    Threat: {af.get('threat_type', 'N/A')}")
                lines.append(f"    Severity: {af.get('severity', 'N/A')}")
                lines.append(f"    Confidence: {af.get('confidence', 0):.0%}")
                for f in af.get("key_findings", [])[:5]:
                    lines.append(f"    • {f}")

        # Correlation
        corr = sections.get("correlation", {})
        if corr:
            lines.append("\n--- CORRELATION ---")
            lines.append(f"  Score: {corr.get('score', 0):.0%}")
            if corr.get("explanation"):
                lines.append(f"  {corr['explanation']}")

        # Response
        response = sections.get("response", {})
        if response:
            lines.append("\n--- RECOMMENDED RESPONSE ---")
            if response.get("immediate_actions"):
                lines.append("  Immediate:")
                for a in response["immediate_actions"]:
                    lines.append(f"    1. {a}")
            if response.get("short_term_actions"):
                lines.append("  Short-term:")
                for a in response["short_term_actions"]:
                    lines.append(f"    2. {a}")

        # Risk Summary
        risk = sections.get("risk_summary", {})
        if risk:
            lines.append("\n--- RISK SUMMARY ---")
            lines.append(f"  Severity:   {risk.get('severity', '')}")
            lines.append(f"  Confidence: {risk.get('confidence', 0):.0%}")
            lines.append(f"  Impact:     {risk.get('impact', '')}")
            lines.append(f"  Likelihood: {risk.get('likelihood', '')}")

        lines.append("\n" + "=" * 70)
        lines.append("  Report generated by SentinelAI Report Generation Agent")
        lines.append("=" * 70)

        return "\n".join(lines)

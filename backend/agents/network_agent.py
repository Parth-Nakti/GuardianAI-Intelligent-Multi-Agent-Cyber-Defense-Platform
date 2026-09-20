"""Network Monitor Agent — analyzes PCAP data for network threats."""

import json
import logging
from typing import Any
from backend.agents.base_agent import BaseAgent
from backend.models.agent import AgentResult
from backend.ai.prompts import NETWORK_AGENT_SYSTEM, NETWORK_AGENT_USER

logger = logging.getLogger(__name__)


class NetworkAgent(BaseAgent):
    name = "Network Monitor Agent"
    description = "Analyzes network traffic from PCAP captures to detect suspicious activity, port scans, and network-based threats."
    agent_id = "network_monitor"

    async def analyze(self, data: dict[str, Any]) -> AgentResult:
        """Analyze parsed PCAP data for network threats."""
        self.status = "processing"
        self.last_task = "PCAP Analysis"

        try:
            # Step 1: Deterministic analysis (from parser results)
            indicators = data.get("suspicious_indicators", [])
            threat_detected = len(indicators) > 0

            # Determine severity from deterministic findings
            severities = [i.get("severity", "LOW") for i in indicators]
            severity_order = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1, "INFO": 0}
            max_severity = "LOW"
            if severities:
                max_severity = max(severities, key=lambda s: severity_order.get(s, 0))

            # Determine primary threat type
            threat_types = [i.get("type", "Unknown") for i in indicators]
            primary_threat = threat_types[0] if threat_types else ""

            # Build findings from deterministic analysis
            findings = []
            for ind in indicators:
                findings.append(f"[{ind['severity']}] {ind['type']}: {ind['description']}")

            # Add traffic summary findings
            findings.append(f"Total packets analyzed: {data.get('total_packets', 0)}")
            findings.append(f"Unique IPs: {len(data.get('unique_ips', []))}")
            findings.append(f"Unique destination ports: {len(data.get('unique_ports', []))}")
            findings.append(f"Protocols: {', '.join(data.get('protocols', {}).keys())}")
            if data.get("dns_queries"):
                findings.append(f"DNS queries detected: {len(data['dns_queries'])}")

            # Extract IOCs
            iocs = []
            seen_iocs = set()
            for ind in indicators:
                if "source_ip" in ind:
                    v = ind["source_ip"]
                    if v not in seen_iocs:
                        iocs.append({"type": "ip", "value": v, "context": ind["type"]})
                        seen_iocs.add(v)
                if "destination_ip" in ind:
                    v = ind["destination_ip"]
                    if v not in seen_iocs:
                        iocs.append({"type": "ip", "value": v, "context": ind["type"]})
                        seen_iocs.add(v)
                if "domain" in ind:
                    v = ind["domain"]
                    if v not in seen_iocs:
                        iocs.append({"type": "domain", "value": v, "context": ind["type"]})
                        seen_iocs.add(v)

            # Step 2: LLM analysis for interpretation
            summary_data = {
                "total_packets": data.get("total_packets", 0),
                "protocols": data.get("protocols", {}),
                "unique_ips": len(data.get("unique_ips", [])),
                "top_source_ips": dict(list(data.get("source_ips", {}).items())[:5]),
                "top_dest_ips": dict(list(data.get("destination_ips", {}).items())[:5]),
                "top_dest_ports": dict(list(data.get("destination_ports", {}).items())[:10]),
                "dns_queries_count": len(data.get("dns_queries", [])),
                "suspicious_indicators": indicators[:10],
                "connection_count": len(data.get("connections", [])),
            }

            llm_result = await self._get_llm_analysis(
                NETWORK_AGENT_SYSTEM,
                NETWORK_AGENT_USER.format(data=json.dumps(summary_data, indent=2))
            )

            # Merge LLM interpretation with deterministic findings
            explanation = llm_result.get("analysis", "Network traffic analyzed.")
            llm_findings = llm_result.get("key_findings", [])
            recommendations = llm_result.get("recommendations", [])

            if not recommendations:
                recommendations = self._default_recommendations(primary_threat)

            # Combine confidence
            confidence = llm_result.get("confidence", 0.5)
            if threat_detected:
                confidence = max(confidence, 0.7)

            result = AgentResult(
                agent=self.name,
                status="completed",
                threat_detected=threat_detected,
                threat_type=primary_threat,
                severity=max_severity,
                confidence=confidence,
                findings=findings + llm_findings,
                indicators=iocs,
                recommendations=recommendations,
                explanation=explanation,
                raw_analysis={
                    "deterministic_indicators": indicators,
                    "llm_analysis": llm_result,
                    "traffic_summary": {
                        "total_packets": data.get("total_packets", 0),
                        "protocols": data.get("protocols", {}),
                        "unique_ips": len(data.get("unique_ips", [])),
                        "top_source_ips": data.get("source_ips", {}),
                        "top_dest_ports": data.get("destination_ports", {}),
                    }
                }
            )
            self._update_stats(True, "PCAP Analysis")
            return result

        except Exception as e:
            logger.error(f"NetworkAgent analysis error: {e}")
            self._update_stats(False, "PCAP Analysis")
            return AgentResult(
                agent=self.name,
                status="error",
                error=str(e),
                explanation=f"Analysis failed: {str(e)}"
            )

    def _default_recommendations(self, threat_type: str) -> list[str]:
        recs = {
            "Port Scan": [
                "Block source IP at the firewall",
                "Review firewall rules for exposed ports",
                "Enable IDS/IPS signatures for port scanning",
                "Monitor the source IP for further activity",
            ],
            "Suspicious DNS": [
                "Block the suspicious domain at the DNS level",
                "Investigate the querying host for malware",
                "Check for data exfiltration via DNS tunneling",
                "Update DNS security policies",
            ],
            "Excessive Connections": [
                "Rate-limit connections from the source IP",
                "Investigate for DDoS or brute force activity",
                "Review connection logs for patterns",
            ],
            "Suspicious Port": [
                "Block traffic to the suspicious port",
                "Investigate the destination host for compromise",
                "Review firewall rules",
            ],
        }
        return recs.get(threat_type, [
            "Monitor the network for further suspicious activity",
            "Review firewall and IDS configurations",
            "Investigate affected hosts",
        ])

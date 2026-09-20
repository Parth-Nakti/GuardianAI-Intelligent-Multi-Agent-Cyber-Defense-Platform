"""Analysis Service — orchestrates the full analysis pipeline."""

import logging
import hashlib
from pathlib import Path
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from backend.agents.agent_manager import get_agent_manager
from backend.parsers.pcap_parser import parse_pcap
from backend.parsers.log_parser import parse_logs
from backend.parsers.email_parser import parse_email
from backend.models.incident import IncidentCreate
from backend.models.analysis import AnalysisSession
from backend.models.threat import ThreatIndicator
from backend.services.incident_service import create_incident

logger = logging.getLogger(__name__)


async def analyze_pcap(db: AsyncSession, file_path: str, filename: str) -> dict:
    """Full PCAP analysis pipeline."""
    manager = get_agent_manager()

    # Create analysis session
    session = AnalysisSession(session_type="pcap", filename=filename, status="parsing", progress=10)
    db.add(session)
    await db.flush()

    try:
        # Step 1: Parse PCAP
        logger.info(f"Parsing PCAP: {filename}")
        parsed_data = parse_pcap(file_path)

        if "error" in parsed_data and not parsed_data.get("total_packets"):
            session.status = "failed"
            session.error_message = parsed_data.get("error", "Parse error")
            await db.flush()
            return {"error": parsed_data["error"], "session_id": session.id}

        session.status = "analyzing"
        session.progress = 30
        session.parsed_data = {
            "total_packets": parsed_data.get("total_packets", 0),
            "protocols": parsed_data.get("protocols", {}),
            "unique_ips": len(parsed_data.get("unique_ips", [])),
        }
        await db.flush()

        # Step 2: Run agent pipeline
        logger.info("Running network analysis pipeline...")
        pipeline_results = await manager.run_network_analysis(parsed_data)

        session.progress = 70
        session.status = "correlating"
        await db.flush()

        # Step 3: Create incident if threats detected
        incident = None
        threats_found = sum(1 for r in pipeline_results["agent_results"] if r.get("threat_detected"))
        session.threats_found = threats_found

        if threats_found > 0:
            primary = pipeline_results["agent_results"][0]
            correlation = pipeline_results.get("correlation", {})
            response = pipeline_results.get("response", {})

            incident_data = IncidentCreate(
                title=f"Network Threat: {primary.get('threat_type', 'Suspicious Activity')}",
                description=primary.get("explanation", ""),
                incident_type=primary.get("threat_type", "Suspicious Traffic"),
                severity=correlation.get("severity", primary.get("severity", "MEDIUM")),
                confidence=primary.get("confidence", 0.5),
                source="pcap",
                source_file=filename,
                evidence=[f for r in pipeline_results["agent_results"] for f in r.get("findings", [])[:10]],
                indicators=[i for r in pipeline_results["agent_results"] for i in r.get("indicators", [])],
                affected_assets=list(parsed_data.get("unique_ips", []))[:10],
                agent_findings=[
                    {"agent": r["agent"], "threat_type": r.get("threat_type", ""), "severity": r.get("severity", ""),
                     "confidence": r.get("confidence", 0), "findings": r.get("findings", [])[:10],
                     "explanation": r.get("explanation", "")}
                    for r in pipeline_results["agent_results"]
                ],
                correlation_data=correlation.get("raw_analysis", {}),
                response_actions=response.get("recommendations", []) if response else [],
                correlation_score=correlation.get("raw_analysis", {}).get("correlation_score", 0),
                analysis_session_id=session.id,
            )
            incident = await create_incident(db, incident_data)
            session.incidents_created = [incident.incident_id]

            # Store IOCs
            for r in pipeline_results["agent_results"]:
                for ioc in r.get("indicators", []):
                    ti = ThreatIndicator(
                        ioc_type=ioc.get("type", ""),
                        value=ioc.get("value", ""),
                        risk_level=primary.get("severity", "MEDIUM"),
                        category=primary.get("threat_type", ""),
                        source=r.get("agent", ""),
                        description=ioc.get("context", ""),
                        incident_id=incident.id if incident else None,
                    )
                    db.add(ti)

            # Generate report
            logger.info("Generating report...")
            session.progress = 85
            await db.flush()

            report_result = await manager.generate_report(
                {
                    "incident_id": incident.incident_id,
                    "severity": incident.severity,
                    "incident_type": incident.incident_type,
                    "status": incident.status,
                    "source": incident.source,
                    "source_file": incident.source_file,
                    "detected_at": incident.detected_at.isoformat() if incident.detected_at else "",
                    "description": incident.description,
                    "affected_assets": incident.affected_assets,
                },
                pipeline_results,
            )

            # Store report
            from backend.models.report import Report
            report_data = report_result.get("raw_analysis", {})
            sections = report_data.get("sections", {})

            report = Report(
                report_id=report_data.get("report_id", f"RPT-{incident.incident_id}"),
                title=report_data.get("title", f"Report for {incident.incident_id}"),
                incident_id=incident.incident_id,
                summary=sections.get("narrative", {}).get("executive_summary", ""),
                threat_summary=sections.get("threat_summary", {}),
                evidence=sections.get("evidence", {}),
                agent_findings=sections.get("agent_findings", []),
                correlation=sections.get("correlation", {}),
                response_actions=sections.get("response", {}),
                risk_summary=sections.get("risk_summary", {}),
                full_content=report_data.get("sections", {}).get("narrative", {}).get("detailed_narrative", ""),
            )
            db.add(report)

        session.status = "completed"
        session.progress = 100
        session.completed_at = datetime.utcnow()
        session.agent_results = [
            {"agent": r["agent"], "threat_detected": r.get("threat_detected"),
             "severity": r.get("severity"), "threat_type": r.get("threat_type")}
            for r in pipeline_results["agent_results"]
        ]
        await db.flush()

        return {
            "session_id": session.id,
            "status": "completed",
            "threats_found": threats_found,
            "incident_id": incident.incident_id if incident else None,
            "pipeline_results": pipeline_results,
        }

    except Exception as e:
        logger.error(f"PCAP analysis failed: {e}")
        session.status = "failed"
        session.error_message = str(e)
        await db.flush()
        return {"error": str(e), "session_id": session.id}


async def analyze_email_file(db: AsyncSession, file_path: str, filename: str) -> dict:
    """Full email analysis pipeline."""
    manager = get_agent_manager()

    session = AnalysisSession(session_type="email", filename=filename, status="parsing", progress=10)
    db.add(session)
    await db.flush()

    try:
        # Parse email
        parsed_data = parse_email(file_path)
        if "error" in parsed_data:
            session.status = "failed"
            session.error_message = parsed_data["error"]
            await db.flush()
            return {"error": parsed_data["error"], "session_id": session.id}

        session.status = "analyzing"
        session.progress = 30
        await db.flush()

        # Run pipeline
        pipeline_results = await manager.run_email_analysis(parsed_data)

        session.progress = 70
        session.status = "correlating"
        await db.flush()

        # Create incident
        incident = None
        threats_found = sum(1 for r in pipeline_results["agent_results"] if r.get("threat_detected"))
        session.threats_found = threats_found

        if threats_found > 0:
            primary = pipeline_results["agent_results"][0]
            correlation = pipeline_results.get("correlation", {})
            response = pipeline_results.get("response", {})

            incident_data = IncidentCreate(
                title=f"Email Threat: {primary.get('threat_type', 'Suspicious Email')}",
                description=primary.get("explanation", ""),
                incident_type=primary.get("threat_type", "Phishing"),
                severity=correlation.get("severity", primary.get("severity", "MEDIUM")),
                confidence=primary.get("confidence", 0.5),
                source="email",
                source_file=filename,
                evidence=[f for r in pipeline_results["agent_results"] for f in r.get("findings", [])[:10]],
                indicators=[i for r in pipeline_results["agent_results"] for i in r.get("indicators", [])],
                affected_assets=[parsed_data.get("recipient", "Unknown recipient")],
                agent_findings=[
                    {"agent": r["agent"], "threat_type": r.get("threat_type", ""), "severity": r.get("severity", ""),
                     "confidence": r.get("confidence", 0), "findings": r.get("findings", [])[:10],
                     "explanation": r.get("explanation", "")}
                    for r in pipeline_results["agent_results"]
                ],
                correlation_data=correlation.get("raw_analysis", {}),
                response_actions=response.get("recommendations", []) if response else [],
                correlation_score=correlation.get("raw_analysis", {}).get("correlation_score", 0),
                analysis_session_id=session.id,
            )
            incident = await create_incident(db, incident_data)
            session.incidents_created = [incident.incident_id]

            # Store IOCs
            for r in pipeline_results["agent_results"]:
                for ioc in r.get("indicators", []):
                    ti = ThreatIndicator(
                        ioc_type=ioc.get("type", ""),
                        value=ioc.get("value", ""),
                        risk_level=primary.get("severity", "MEDIUM"),
                        category="Phishing",
                        source=r.get("agent", ""),
                        description=ioc.get("context", ""),
                        incident_id=incident.id if incident else None,
                    )
                    db.add(ti)

            # Generate report
            session.progress = 85
            await db.flush()

            report_result = await manager.generate_report(
                {
                    "incident_id": incident.incident_id,
                    "severity": incident.severity,
                    "incident_type": incident.incident_type,
                    "status": incident.status,
                    "source": incident.source,
                    "source_file": incident.source_file,
                    "detected_at": incident.detected_at.isoformat() if incident.detected_at else "",
                    "description": incident.description,
                    "affected_assets": incident.affected_assets,
                },
                pipeline_results,
            )

            from backend.models.report import Report
            report_data = report_result.get("raw_analysis", {})
            sections = report_data.get("sections", {})

            report = Report(
                report_id=report_data.get("report_id", f"RPT-{incident.incident_id}"),
                title=report_data.get("title", f"Report for {incident.incident_id}"),
                incident_id=incident.incident_id,
                summary=sections.get("narrative", {}).get("executive_summary", ""),
                threat_summary=sections.get("threat_summary", {}),
                evidence=sections.get("evidence", {}),
                agent_findings=sections.get("agent_findings", []),
                correlation=sections.get("correlation", {}),
                response_actions=sections.get("response", {}),
                risk_summary=sections.get("risk_summary", {}),
                full_content=report_data.get("sections", {}).get("narrative", {}).get("detailed_narrative", ""),
            )
            db.add(report)

        session.status = "completed"
        session.progress = 100
        session.completed_at = datetime.utcnow()
        session.agent_results = [
            {"agent": r["agent"], "threat_detected": r.get("threat_detected"),
             "severity": r.get("severity"), "threat_type": r.get("threat_type")}
            for r in pipeline_results["agent_results"]
        ]
        await db.flush()

        return {
            "session_id": session.id,
            "status": "completed",
            "threats_found": threats_found,
            "incident_id": incident.incident_id if incident else None,
            "pipeline_results": pipeline_results,
        }

    except Exception as e:
        logger.error(f"Email analysis failed: {e}")
        session.status = "failed"
        session.error_message = str(e)
        await db.flush()
        return {"error": str(e), "session_id": session.id}


async def analyze_log_file(db: AsyncSession, file_path: str, filename: str) -> dict:
    """Full log analysis pipeline."""
    manager = get_agent_manager()

    session = AnalysisSession(session_type="log", filename=filename, status="parsing", progress=10)
    db.add(session)
    await db.flush()

    try:
        parsed_data = parse_logs(file_path)
        if "error" in parsed_data:
            session.status = "failed"
            session.error_message = parsed_data["error"]
            await db.flush()
            return {"error": parsed_data["error"], "session_id": session.id}

        session.status = "analyzing"
        session.progress = 30
        await db.flush()

        pipeline_results = await manager.run_log_analysis(parsed_data)

        session.progress = 70
        session.status = "correlating"
        await db.flush()

        incident = None
        threats_found = sum(1 for r in pipeline_results["agent_results"] if r.get("threat_detected"))
        session.threats_found = threats_found

        # Also count log-level indicators
        log_indicators = parsed_data.get("suspicious_indicators", [])
        if not threats_found and log_indicators:
            threats_found = len(log_indicators)
            session.threats_found = threats_found

        if threats_found > 0 or log_indicators:
            primary = pipeline_results["agent_results"][0] if pipeline_results["agent_results"] else {}
            correlation = pipeline_results.get("correlation", {})
            response = pipeline_results.get("response", {})

            # Determine incident type from log indicators
            log_threat_types = [ind.get("type", "") for ind in log_indicators]
            if "Brute Force" in log_threat_types:
                inc_type = "Brute Force"
            elif "Account Targeting" in log_threat_types:
                inc_type = "Brute Force"
            elif "Privilege Activity" in log_threat_types:
                inc_type = "Privilege Escalation"
            else:
                inc_type = primary.get("threat_type", "Suspicious Activity")

            max_sev = "LOW"
            severity_order = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
            for ind in log_indicators:
                s = ind.get("severity", "LOW")
                if severity_order.get(s, 0) > severity_order.get(max_sev, 0):
                    max_sev = s

            all_evidence = [ind["description"] for ind in log_indicators]
            all_evidence.extend([f for r in pipeline_results["agent_results"] for f in r.get("findings", [])[:5]])

            incident_data = IncidentCreate(
                title=f"Log Alert: {inc_type}",
                description=primary.get("explanation", "; ".join(all_evidence[:3])),
                incident_type=inc_type,
                severity=max_sev,
                confidence=primary.get("confidence", 0.7),
                source="log",
                source_file=filename,
                evidence=all_evidence[:20],
                indicators=[i for r in pipeline_results["agent_results"] for i in r.get("indicators", [])],
                affected_assets=list(parsed_data.get("all_ips", {}).keys())[:10],
                agent_findings=[
                    {"agent": r["agent"], "threat_type": r.get("threat_type", ""), "severity": r.get("severity", ""),
                     "confidence": r.get("confidence", 0), "findings": r.get("findings", [])[:10],
                     "explanation": r.get("explanation", "")}
                    for r in pipeline_results["agent_results"]
                ],
                correlation_data=correlation.get("raw_analysis", {}),
                response_actions=response.get("recommendations", []) if response else [],
                correlation_score=correlation.get("raw_analysis", {}).get("correlation_score", 0),
                analysis_session_id=session.id,
            )
            incident = await create_incident(db, incident_data)
            session.incidents_created = [incident.incident_id]

            # Generate report
            session.progress = 85
            await db.flush()

            report_result = await manager.generate_report(
                {
                    "incident_id": incident.incident_id,
                    "severity": incident.severity,
                    "incident_type": incident.incident_type,
                    "status": incident.status,
                    "source": incident.source,
                    "source_file": incident.source_file,
                    "detected_at": incident.detected_at.isoformat() if incident.detected_at else "",
                    "description": incident.description,
                    "affected_assets": incident.affected_assets,
                },
                pipeline_results,
            )

            from backend.models.report import Report
            report_data = report_result.get("raw_analysis", {})
            sections = report_data.get("sections", {})

            report = Report(
                report_id=report_data.get("report_id", f"RPT-{incident.incident_id}"),
                title=report_data.get("title", f"Report for {incident.incident_id}"),
                incident_id=incident.incident_id,
                summary=sections.get("narrative", {}).get("executive_summary", ""),
                threat_summary=sections.get("threat_summary", {}),
                evidence=sections.get("evidence", {}),
                agent_findings=sections.get("agent_findings", []),
                correlation=sections.get("correlation", {}),
                response_actions=sections.get("response", {}),
                risk_summary=sections.get("risk_summary", {}),
                full_content=report_data.get("sections", {}).get("narrative", {}).get("detailed_narrative", ""),
            )
            db.add(report)

        session.status = "completed"
        session.progress = 100
        session.completed_at = datetime.utcnow()
        session.agent_results = [
            {"agent": r["agent"], "threat_detected": r.get("threat_detected"),
             "severity": r.get("severity"), "threat_type": r.get("threat_type")}
            for r in pipeline_results["agent_results"]
        ]
        await db.flush()

        return {
            "session_id": session.id,
            "status": "completed",
            "threats_found": threats_found,
            "incident_id": incident.incident_id if incident else None,
            "pipeline_results": pipeline_results,
        }

    except Exception as e:
        logger.error(f"Log analysis failed: {e}")
        session.status = "failed"
        session.error_message = str(e)
        await db.flush()
        return {"error": str(e), "session_id": session.id}

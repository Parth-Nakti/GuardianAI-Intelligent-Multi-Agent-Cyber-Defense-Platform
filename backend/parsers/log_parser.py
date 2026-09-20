"""Log Parser — parses common log formats (text, CSV, JSON)."""

import csv
import io
import json
import logging
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Common log patterns
SYSLOG_PATTERN = re.compile(
    r"(?P<timestamp>\w{3}\s+\d+\s+[\d:]+)\s+"
    r"(?P<hostname>\S+)\s+"
    r"(?P<service>\S+?)(?:\[\d+\])?:\s+"
    r"(?P<message>.*)"
)

AUTH_LOG_PATTERN = re.compile(
    r"(?P<timestamp>[\d\-]+\s+[\d:]+|[\w]+\s+\d+\s+[\d:]+)\s+.*?"
    r"(?:Failed|Accepted|Invalid|error|failure|success)"
    r".*?(?:from\s+(?P<source_ip>[\d.]+))?"
    r".*?(?:user\s+(?P<username>\S+))?",
    re.IGNORECASE
)

IP_PATTERN = re.compile(r"\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b")

FAILED_LOGIN_PATTERNS = [
    re.compile(r"failed\s+(?:password|login|auth)", re.IGNORECASE),
    re.compile(r"authentication\s+fail", re.IGNORECASE),
    re.compile(r"invalid\s+(?:user|password|credentials)", re.IGNORECASE),
    re.compile(r"access\s+denied", re.IGNORECASE),
    re.compile(r"login\s+failed", re.IGNORECASE),
    re.compile(r"unauthorized", re.IGNORECASE),
]

SUCCESS_LOGIN_PATTERNS = [
    re.compile(r"accepted\s+password", re.IGNORECASE),
    re.compile(r"session\s+opened", re.IGNORECASE),
    re.compile(r"successful\s+login", re.IGNORECASE),
    re.compile(r"authenticated\s+successfully", re.IGNORECASE),
]

PRIVILEGE_PATTERNS = [
    re.compile(r"sudo|su\s|root|admin|privilege|escalat", re.IGNORECASE),
]


def parse_logs(file_path: str) -> dict[str, Any]:
    """Parse log file and extract security-relevant data."""
    path = Path(file_path)
    suffix = path.suffix.lower()

    try:
        content = path.read_text(encoding="utf-8", errors="ignore")
    except Exception as e:
        logger.error(f"Failed to read log file: {e}")
        return {"error": str(e), "entries": []}

    if suffix == ".json":
        return _parse_json_log(content, path.name)
    elif suffix == ".csv":
        return _parse_csv_log(content, path.name)
    else:
        return _parse_text_log(content, path.name)


def _parse_text_log(content: str, filename: str) -> dict[str, Any]:
    """Parse plain text log files."""
    lines = content.strip().split("\n")
    result = _init_result(filename, len(lines))

    for line_num, line in enumerate(lines, 1):
        line = line.strip()
        if not line:
            continue

        entry = {
            "line": line_num,
            "raw": line,
            "event_type": "unknown",
            "ips": [],
            "username": None,
        }

        # Extract IPs
        ips = IP_PATTERN.findall(line)
        entry["ips"] = ips
        for ip in ips:
            result["all_ips"][ip] += 1

        # Classify event
        is_failed = any(p.search(line) for p in FAILED_LOGIN_PATTERNS)
        is_success = any(p.search(line) for p in SUCCESS_LOGIN_PATTERNS)
        is_privilege = any(p.search(line) for p in PRIVILEGE_PATTERNS)

        if is_failed:
            entry["event_type"] = "failed_login"
            result["failed_logins"] += 1
            for ip in ips:
                result["failed_login_ips"][ip] += 1
            # Try to extract username
            m = re.search(r"user\s+(\S+)", line, re.IGNORECASE)
            if m:
                entry["username"] = m.group(1)
                result["failed_login_users"][m.group(1)] += 1
        elif is_success:
            entry["event_type"] = "successful_login"
            result["successful_logins"] += 1
        elif is_privilege:
            entry["event_type"] = "privilege_activity"
            result["privilege_events"] += 1

        # Syslog parsing
        m = SYSLOG_PATTERN.match(line)
        if m:
            entry["timestamp"] = m.group("timestamp")
            entry["hostname"] = m.group("hostname")
            entry["service"] = m.group("service")

        result["entries"].append(entry)

    _detect_log_anomalies(result)
    _finalize_result(result)
    return result


def _parse_json_log(content: str, filename: str) -> dict[str, Any]:
    """Parse JSON log files (single object, array, or JSONL)."""
    entries_raw = []

    # Try array first
    try:
        data = json.loads(content)
        if isinstance(data, list):
            entries_raw = data
        elif isinstance(data, dict):
            entries_raw = [data]
    except json.JSONDecodeError:
        # Try JSONL
        for line in content.strip().split("\n"):
            line = line.strip()
            if line:
                try:
                    entries_raw.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

    result = _init_result(filename, len(entries_raw))

    for i, entry_data in enumerate(entries_raw):
        entry = {
            "line": i + 1,
            "raw": json.dumps(entry_data),
            "event_type": "unknown",
            "ips": [],
            "username": None,
        }

        # Extract common fields
        text = json.dumps(entry_data).lower()
        entry["timestamp"] = entry_data.get("timestamp", entry_data.get("time", entry_data.get("@timestamp", "")))
        entry["username"] = entry_data.get("username", entry_data.get("user", entry_data.get("userName", None)))
        entry["event_type"] = entry_data.get("event_type", entry_data.get("action", entry_data.get("type", "unknown")))

        # Extract IPs
        src_ip = entry_data.get("source_ip", entry_data.get("src_ip", entry_data.get("sourceIP", "")))
        dst_ip = entry_data.get("destination_ip", entry_data.get("dst_ip", entry_data.get("destinationIP", "")))
        if src_ip:
            entry["ips"].append(src_ip)
            result["all_ips"][src_ip] += 1
        if dst_ip:
            entry["ips"].append(dst_ip)
            result["all_ips"][dst_ip] += 1

        # Check for failed logins
        status = str(entry_data.get("status", entry_data.get("result", ""))).lower()
        action = str(entry_data.get("action", entry_data.get("event_type", ""))).lower()

        if "fail" in status or "fail" in action or "denied" in status:
            entry["event_type"] = "failed_login"
            result["failed_logins"] += 1
            if src_ip:
                result["failed_login_ips"][src_ip] += 1
            if entry["username"]:
                result["failed_login_users"][entry["username"]] += 1
        elif "success" in status or "accept" in status:
            entry["event_type"] = "successful_login"
            result["successful_logins"] += 1

        if any(p.search(text) for p in PRIVILEGE_PATTERNS):
            result["privilege_events"] += 1

        result["entries"].append(entry)

    _detect_log_anomalies(result)
    _finalize_result(result)
    return result


def _parse_csv_log(content: str, filename: str) -> dict[str, Any]:
    """Parse CSV log files."""
    reader = csv.DictReader(io.StringIO(content))
    rows = list(reader)
    result = _init_result(filename, len(rows))

    for i, row in enumerate(rows):
        text = " ".join(str(v) for v in row.values()).lower()
        entry = {
            "line": i + 2,  # account for header
            "raw": str(row),
            "event_type": "unknown",
            "ips": [],
            "username": None,
        }

        # Extract IPs from all fields
        for val in row.values():
            ips = IP_PATTERN.findall(str(val))
            entry["ips"].extend(ips)
            for ip in ips:
                result["all_ips"][ip] += 1

        # Check event type
        is_failed = any(p.search(text) for p in FAILED_LOGIN_PATTERNS)
        if is_failed:
            entry["event_type"] = "failed_login"
            result["failed_logins"] += 1
            for ip in entry["ips"]:
                result["failed_login_ips"][ip] += 1

        result["entries"].append(entry)

    _detect_log_anomalies(result)
    _finalize_result(result)
    return result


def _init_result(filename: str, total_lines: int) -> dict:
    return {
        "filename": filename,
        "total_lines": total_lines,
        "entries": [],
        "failed_logins": 0,
        "successful_logins": 0,
        "privilege_events": 0,
        "all_ips": Counter(),
        "failed_login_ips": Counter(),
        "failed_login_users": Counter(),
        "suspicious_indicators": [],
    }


def _detect_log_anomalies(result: dict):
    """Detect suspicious patterns in log data."""
    indicators = result["suspicious_indicators"]

    # Brute force: many failed logins from same IP
    for ip, count in result["failed_login_ips"].items():
        if count >= 5:
            severity = "CRITICAL" if count >= 20 else "HIGH" if count >= 10 else "MEDIUM"
            indicators.append({
                "type": "Brute Force",
                "severity": severity,
                "description": f"{count} failed login attempts from {ip}",
                "source_ip": ip,
                "count": count,
            })

    # Multiple failed users from same IP
    # (already covered by brute force but could be username enumeration)
    for user, count in result["failed_login_users"].items():
        if count >= 5:
            indicators.append({
                "type": "Account Targeting",
                "severity": "HIGH",
                "description": f"{count} failed login attempts for user '{user}'",
                "username": user,
                "count": count,
            })

    # Privilege escalation indicators
    if result["privilege_events"] > 0:
        indicators.append({
            "type": "Privilege Activity",
            "severity": "MEDIUM",
            "description": f"{result['privilege_events']} privilege-related events detected",
            "count": result["privilege_events"],
        })

    # Overall failed login ratio
    total = result["failed_logins"] + result["successful_logins"]
    if total > 0 and result["failed_logins"] / total > 0.7 and result["failed_logins"] > 10:
        indicators.append({
            "type": "Suspicious Auth Pattern",
            "severity": "HIGH",
            "description": f"High failure ratio: {result['failed_logins']}/{total} login attempts failed",
            "failed": result["failed_logins"],
            "total": total,
        })


def _finalize_result(result: dict):
    """Convert counters for JSON serialization."""
    result["all_ips"] = dict(result["all_ips"].most_common(20))
    result["failed_login_ips"] = dict(result["failed_login_ips"].most_common(20))
    result["failed_login_users"] = dict(result["failed_login_users"].most_common(20))
    result["entries"] = result["entries"][:500]

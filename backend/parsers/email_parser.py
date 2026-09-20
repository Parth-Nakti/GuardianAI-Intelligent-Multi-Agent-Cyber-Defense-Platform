"""Email Parser — parses .eml, .txt, .html email files for phishing analysis."""

import email
import logging
import re
from email import policy
from pathlib import Path
from typing import Any
from html.parser import HTMLParser

logger = logging.getLogger(__name__)

# Patterns
URL_PATTERN = re.compile(
    r'https?://[^\s<>"\')\]]+',
    re.IGNORECASE
)
EMAIL_PATTERN = re.compile(r'[\w.+-]+@[\w-]+\.[\w.-]+')
DOMAIN_PATTERN = re.compile(r'(?:https?://)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+)')

# Phishing indicators
URGENCY_WORDS = [
    "urgent", "immediately", "suspended", "verify", "confirm",
    "expire", "locked", "unauthorized", "unusual activity",
    "security alert", "action required", "within 24 hours",
    "account will be", "click here", "act now", "limited time",
    "your account", "update your", "verify your identity"
]

CREDENTIAL_HARVESTING = [
    "password", "login", "sign in", "credentials", "ssn",
    "social security", "credit card", "bank account",
    "enter your", "provide your", "confirm your",
    "update your payment", "billing information"
]

SUSPICIOUS_SENDER_PATTERNS = [
    re.compile(r"noreply.*@(?!.*(?:google|microsoft|apple|amazon))", re.IGNORECASE),
    re.compile(r"support.*@(?!.*(?:google|microsoft|apple|amazon))", re.IGNORECASE),
    re.compile(r"security.*@(?!.*(?:google|microsoft|apple|amazon))", re.IGNORECASE),
]


class HTMLTextExtractor(HTMLParser):
    """Extract text from HTML content."""
    def __init__(self):
        super().__init__()
        self.text = []
        self.links = []

    def handle_data(self, data):
        self.text.append(data.strip())

    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            for attr, value in attrs:
                if attr == 'href' and value:
                    self.links.append(value)


def parse_email(file_path: str) -> dict[str, Any]:
    """Parse an email file and extract security-relevant data."""
    path = Path(file_path)
    suffix = path.suffix.lower()

    try:
        content = path.read_text(encoding="utf-8", errors="ignore")
    except Exception as e:
        logger.error(f"Failed to read email file: {e}")
        return {"error": str(e)}

    if suffix == ".eml":
        return _parse_eml(content, path.name)
    elif suffix == ".html":
        return _parse_html_email(content, path.name)
    else:
        return _parse_text_email(content, path.name)


def _parse_eml(content: str, filename: str) -> dict[str, Any]:
    """Parse .eml format email."""
    msg = email.message_from_string(content, policy=policy.default)

    result = _init_result(filename)

    # Headers
    result["sender"] = str(msg.get("From", ""))
    result["recipient"] = str(msg.get("To", ""))
    result["subject"] = str(msg.get("Subject", ""))
    result["date"] = str(msg.get("Date", ""))
    result["reply_to"] = str(msg.get("Reply-To", ""))
    result["return_path"] = str(msg.get("Return-Path", ""))
    result["message_id"] = str(msg.get("Message-ID", ""))

    # Authentication headers
    result["spf"] = str(msg.get("Received-SPF", ""))
    result["dkim"] = str(msg.get("DKIM-Signature", ""))
    result["dmarc"] = str(msg.get("DMARC", ""))
    auth_results = str(msg.get("Authentication-Results", ""))
    result["authentication_results"] = auth_results

    # Extract all headers
    result["headers"] = {k: str(v) for k, v in msg.items()}

    # Body
    body_parts = []
    html_parts = []

    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            if ctype == "text/plain":
                try:
                    body_parts.append(part.get_content())
                except Exception:
                    pass
            elif ctype == "text/html":
                try:
                    html_parts.append(part.get_content())
                except Exception:
                    pass

            # Check for attachments
            if part.get_content_disposition() == "attachment":
                result["attachments"].append({
                    "filename": part.get_filename() or "unknown",
                    "content_type": ctype,
                    "size": len(part.get_payload(decode=True) or b"")
                })
    else:
        ctype = msg.get_content_type()
        try:
            if ctype == "text/html":
                html_parts.append(msg.get_content())
            else:
                body_parts.append(msg.get_content())
        except Exception:
            body_parts.append(content)

    result["body_text"] = "\n".join(body_parts)

    # Extract text and links from HTML
    for html in html_parts:
        extractor = HTMLTextExtractor()
        try:
            extractor.feed(html)
            result["body_text"] += "\n" + " ".join(extractor.text)
            result["html_links"].extend(extractor.links)
        except Exception:
            pass

    _extract_indicators(result)
    _analyze_phishing(result)
    return result


def _parse_html_email(content: str, filename: str) -> dict[str, Any]:
    """Parse HTML email file."""
    result = _init_result(filename)

    extractor = HTMLTextExtractor()
    try:
        extractor.feed(content)
        result["body_text"] = " ".join(extractor.text)
        result["html_links"] = extractor.links
    except Exception:
        result["body_text"] = content

    _extract_indicators(result)
    _analyze_phishing(result)
    return result


def _parse_text_email(content: str, filename: str) -> dict[str, Any]:
    """Parse plain text email."""
    result = _init_result(filename)

    # Try to extract basic email structure
    lines = content.split("\n")
    header_done = False
    body_lines = []

    for line in lines:
        line_stripped = line.strip()
        if not header_done:
            if line_stripped == "":
                header_done = True
                continue
            if ":" in line_stripped:
                key, _, value = line_stripped.partition(":")
                key = key.strip().lower()
                value = value.strip()
                if key == "from":
                    result["sender"] = value
                elif key == "to":
                    result["recipient"] = value
                elif key == "subject":
                    result["subject"] = value
                elif key == "date":
                    result["date"] = value
            else:
                header_done = True
                body_lines.append(line)
        else:
            body_lines.append(line)

    result["body_text"] = "\n".join(body_lines)

    _extract_indicators(result)
    _analyze_phishing(result)
    return result


def _init_result(filename: str) -> dict[str, Any]:
    return {
        "filename": filename,
        "sender": "",
        "recipient": "",
        "subject": "",
        "date": "",
        "reply_to": "",
        "return_path": "",
        "message_id": "",
        "spf": "",
        "dkim": "",
        "dmarc": "",
        "authentication_results": "",
        "headers": {},
        "body_text": "",
        "html_links": [],
        "attachments": [],
        "urls": [],
        "domains": [],
        "email_addresses": [],
        "sender_domain": "",
        "suspicious_indicators": [],
    }


def _extract_indicators(result: dict):
    """Extract URLs, domains, and email addresses."""
    full_text = f"{result['sender']} {result['subject']} {result['body_text']}"

    # URLs
    urls = URL_PATTERN.findall(full_text)
    for link in result.get("html_links", []):
        if link.startswith("http"):
            urls.append(link)
    result["urls"] = list(set(urls))

    # Domains from URLs
    domains = set()
    for url in result["urls"]:
        m = DOMAIN_PATTERN.search(url)
        if m:
            domains.add(m.group(1))
    result["domains"] = list(domains)

    # Email addresses
    emails = EMAIL_PATTERN.findall(full_text)
    result["email_addresses"] = list(set(emails))

    # Sender domain
    sender_match = EMAIL_PATTERN.search(result["sender"])
    if sender_match:
        result["sender_domain"] = sender_match.group().split("@")[1]


def _analyze_phishing(result: dict):
    """Analyze email for phishing indicators."""
    indicators = result["suspicious_indicators"]
    body_lower = result["body_text"].lower()
    subject_lower = result["subject"].lower()
    full_text = f"{subject_lower} {body_lower}"

    # 1. Urgency language
    urgency_found = [w for w in URGENCY_WORDS if w in full_text]
    if len(urgency_found) >= 2:
        indicators.append({
            "type": "Urgency Language",
            "severity": "MEDIUM",
            "description": f"Email contains urgency/pressure language: {', '.join(urgency_found[:5])}",
            "matched": urgency_found
        })

    # 2. Credential harvesting language
    cred_found = [w for w in CREDENTIAL_HARVESTING if w in full_text]
    if len(cred_found) >= 2:
        indicators.append({
            "type": "Credential Harvesting",
            "severity": "HIGH",
            "description": f"Email contains credential harvesting language: {', '.join(cred_found[:5])}",
            "matched": cred_found
        })

    # 3. Suspicious URLs
    for url in result["urls"]:
        url_lower = url.lower()
        # URL contains login/signin/verify
        if any(kw in url_lower for kw in ["login", "signin", "verify", "confirm", "secure", "update", "account"]):
            indicators.append({
                "type": "Suspicious URL",
                "severity": "HIGH",
                "description": f"URL contains credential-related keywords: {url[:100]}",
                "url": url
            })
        # IP in URL
        if re.search(r"https?://\d+\.\d+\.\d+\.\d+", url):
            indicators.append({
                "type": "IP-based URL",
                "severity": "HIGH",
                "description": f"URL uses IP address instead of domain: {url[:100]}",
                "url": url
            })

    # 4. Domain mismatch
    if result["sender_domain"]:
        sender_domain = result["sender_domain"].lower()
        for domain in result["domains"]:
            domain_lower = domain.lower()
            if domain_lower != sender_domain and not domain_lower.endswith(f".{sender_domain}"):
                indicators.append({
                    "type": "Domain Mismatch",
                    "severity": "MEDIUM",
                    "description": f"URL domain ({domain}) differs from sender domain ({sender_domain})",
                    "sender_domain": sender_domain,
                    "url_domain": domain
                })

    # 5. Suspicious sender patterns
    for pattern in SUSPICIOUS_SENDER_PATTERNS:
        if pattern.search(result["sender"]):
            indicators.append({
                "type": "Suspicious Sender",
                "severity": "MEDIUM",
                "description": f"Sender matches suspicious pattern: {result['sender']}",
            })
            break

    # 6. Attachments
    suspicious_extensions = [".exe", ".bat", ".cmd", ".scr", ".pif", ".js", ".vbs", ".wsf", ".ps1", ".msi"]
    for att in result["attachments"]:
        fname = att.get("filename", "").lower()
        for ext in suspicious_extensions:
            if fname.endswith(ext):
                indicators.append({
                    "type": "Suspicious Attachment",
                    "severity": "CRITICAL",
                    "description": f"Email contains potentially dangerous attachment: {att['filename']}",
                    "filename": att["filename"]
                })
                break

    # 7. SPF/DKIM failures
    auth = result.get("authentication_results", "").lower()
    if "fail" in auth or "softfail" in auth:
        indicators.append({
            "type": "Authentication Failure",
            "severity": "HIGH",
            "description": "Email failed SPF/DKIM/DMARC authentication",
            "details": result["authentication_results"][:200]
        })

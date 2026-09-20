"""PCAP Parser — uses Scapy to extract network traffic data."""

import logging
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


def parse_pcap(file_path: str) -> dict[str, Any]:
    """
    Parse a PCAP/PCAPNG file and extract network traffic information.
    Uses Scapy for packet analysis.
    Returns structured data for the Network Monitor Agent.
    """
    try:
        from scapy.all import rdpcap, IP, TCP, UDP, DNS, DNSQR, Raw, ARP, ICMP
    except ImportError:
        logger.error("Scapy not installed")
        return {"error": "Scapy not installed", "packets": []}

    try:
        packets = rdpcap(file_path)
    except Exception as e:
        logger.error(f"Failed to read PCAP: {e}")
        return {"error": str(e), "packets": []}

    result = {
        "filename": Path(file_path).name,
        "total_packets": len(packets),
        "protocols": Counter(),
        "connections": [],
        "source_ips": Counter(),
        "destination_ips": Counter(),
        "source_ports": Counter(),
        "destination_ports": Counter(),
        "dns_queries": [],
        "http_data": [],
        "suspicious_indicators": [],
        "ip_pairs": Counter(),
        "packet_details": [],
        "unique_ips": set(),
        "unique_ports": set(),
        "syn_packets": defaultdict(int),  # Track SYN packets per dest for port scan detection
        "connection_attempts": defaultdict(int),
    }

    for i, pkt in enumerate(packets):
        detail = {"index": i}

        # IP layer
        if pkt.haslayer(IP):
            ip = pkt[IP]
            src_ip = ip.src
            dst_ip = ip.dst
            detail["src_ip"] = src_ip
            detail["dst_ip"] = dst_ip
            detail["protocol"] = ip.proto
            result["source_ips"][src_ip] += 1
            result["destination_ips"][dst_ip] += 1
            result["ip_pairs"][f"{src_ip} -> {dst_ip}"] += 1
            result["unique_ips"].add(src_ip)
            result["unique_ips"].add(dst_ip)

            # TCP layer
            if pkt.haslayer(TCP):
                tcp = pkt[TCP]
                sport = tcp.sport
                dport = tcp.dport
                detail["src_port"] = sport
                detail["dst_port"] = dport
                detail["flags"] = str(tcp.flags)
                result["protocols"]["TCP"] += 1
                result["source_ports"][sport] += 1
                result["destination_ports"][dport] += 1
                result["unique_ports"].add(dport)

                # SYN detection (port scanning)
                if tcp.flags == "S" or "S" in str(tcp.flags):
                    key = f"{src_ip}->{dst_ip}"
                    result["syn_packets"][key] += 1
                    result["connection_attempts"][f"{src_ip}->{dst_ip}:{dport}"] += 1

                # HTTP detection
                if dport in (80, 8080, 443) or sport in (80, 8080, 443):
                    if pkt.haslayer(Raw):
                        try:
                            payload = pkt[Raw].load.decode("utf-8", errors="ignore")
                            if payload.startswith(("GET ", "POST ", "HTTP/")):
                                result["http_data"].append({
                                    "src": src_ip,
                                    "dst": dst_ip,
                                    "snippet": payload[:200]
                                })
                        except Exception:
                            pass

                # Add connection
                conn = {"src": src_ip, "dst": dst_ip, "sport": sport, "dport": dport, "protocol": "TCP"}
                result["connections"].append(conn)

            # UDP layer
            elif pkt.haslayer(UDP):
                udp = pkt[UDP]
                sport = udp.sport
                dport = udp.dport
                detail["src_port"] = sport
                detail["dst_port"] = dport
                result["protocols"]["UDP"] += 1
                result["source_ports"][sport] += 1
                result["destination_ports"][dport] += 1
                result["unique_ports"].add(dport)

                conn = {"src": src_ip, "dst": dst_ip, "sport": sport, "dport": dport, "protocol": "UDP"}
                result["connections"].append(conn)

            # ICMP
            elif pkt.haslayer(ICMP):
                result["protocols"]["ICMP"] += 1
                detail["icmp_type"] = pkt[ICMP].type

        # ARP
        if pkt.haslayer(ARP):
            result["protocols"]["ARP"] += 1

        # DNS
        if pkt.haslayer(DNS) and pkt.haslayer(DNSQR):
            try:
                query = pkt[DNSQR].qname.decode("utf-8", errors="ignore").rstrip(".")
                result["dns_queries"].append({
                    "query": query,
                    "src": pkt[IP].src if pkt.haslayer(IP) else "unknown"
                })
            except Exception:
                pass

        # Limit stored details
        if i < 500:
            result["packet_details"].append(detail)

    # --- Detect suspicious patterns ---
    _detect_suspicious(result)

    # Convert sets/counters for JSON serialization
    result["unique_ips"] = list(result["unique_ips"])
    result["unique_ports"] = list(result["unique_ports"])
    result["protocols"] = dict(result["protocols"])
    result["source_ips"] = dict(result["source_ips"].most_common(20))
    result["destination_ips"] = dict(result["destination_ips"].most_common(20))
    result["source_ports"] = dict(result["source_ports"].most_common(20))
    result["destination_ports"] = dict(result["destination_ports"].most_common(20))
    result["ip_pairs"] = dict(result["ip_pairs"].most_common(20))
    result["syn_packets"] = dict(result["syn_packets"])
    result["connection_attempts"] = dict(result["connection_attempts"])
    # Limit lists
    result["connections"] = result["connections"][:200]
    result["dns_queries"] = result["dns_queries"][:100]
    result["http_data"] = result["http_data"][:50]

    return result


def _detect_suspicious(data: dict):
    """Detect suspicious patterns in parsed network data."""
    indicators = data["suspicious_indicators"]

    # Port scan detection: many different dst ports from same src
    src_dst_ports = defaultdict(set)
    for conn in data["connections"]:
        src_dst_ports[conn["src"]].add(conn["dport"])

    for src, ports in src_dst_ports.items():
        if len(ports) > 15:
            indicators.append({
                "type": "Port Scan",
                "severity": "HIGH",
                "description": f"Source {src} accessed {len(ports)} different destination ports",
                "source_ip": src,
                "ports_count": len(ports)
            })

    # Excessive connection attempts
    for key, count in data["syn_packets"].items():
        if count > 20:
            src, dst = key.split("->")
            indicators.append({
                "type": "Excessive Connections",
                "severity": "MEDIUM",
                "description": f"{count} SYN packets from {src} to {dst}",
                "source_ip": src,
                "destination_ip": dst,
                "count": count
            })

    # Suspicious DNS
    suspicious_tlds = [".xyz", ".top", ".club", ".work", ".click", ".tk", ".ml", ".ga", ".cf"]
    for dns in data["dns_queries"]:
        query = dns["query"].lower()
        for tld in suspicious_tlds:
            if query.endswith(tld):
                indicators.append({
                    "type": "Suspicious DNS",
                    "severity": "MEDIUM",
                    "description": f"DNS query to suspicious TLD: {dns['query']}",
                    "domain": dns["query"],
                    "source_ip": dns["src"]
                })
                break
        # Long domain names (possible DGA)
        if len(query) > 50:
            indicators.append({
                "type": "Suspicious DNS",
                "severity": "HIGH",
                "description": f"Unusually long domain name (possible DGA): {dns['query'][:60]}...",
                "domain": dns["query"],
                "source_ip": dns["src"]
            })

    # Suspicious ports
    suspicious_ports = {4444, 5555, 6666, 31337, 1337, 9001, 8443}
    used_ports = set()
    for conn in data["connections"]:
        if conn["dport"] in suspicious_ports and conn["dport"] not in used_ports:
            used_ports.add(conn["dport"])
            indicators.append({
                "type": "Suspicious Port",
                "severity": "HIGH",
                "description": f"Connection to suspicious port {conn['dport']} ({conn['src']} -> {conn['dst']})",
                "source_ip": conn["src"],
                "destination_ip": conn["dst"],
                "port": conn["dport"]
            })

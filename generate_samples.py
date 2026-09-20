"""Generate synthetic sample data for SentinelAI demos."""

import os
import json
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def generate_pcap_samples():
    """Generate sample PCAP files using Scapy."""
    from scapy.all import IP, TCP, UDP, DNS, DNSQR, Ether, wrpcap, Raw, RandShort

    pcap_dir = os.path.join(os.path.dirname(__file__), "sample_data", "pcaps")
    os.makedirs(pcap_dir, exist_ok=True)

    # 1. Port Scan PCAP
    print("Generating port_scan.pcap...")
    packets = []
    attacker = "192.168.1.100"
    target = "192.168.1.10"

    for port in range(20, 1025):
        pkt = IP(src=attacker, dst=target) / TCP(sport=RandShort(), dport=port, flags="S")
        packets.append(pkt)

    wrpcap(os.path.join(pcap_dir, "port_scan.pcap"), packets)
    print(f"  Created with {len(packets)} packets")

    # 2. Suspicious DNS PCAP
    print("Generating suspicious_dns.pcap...")
    packets = []
    client = "192.168.1.50"
    dns_server = "8.8.8.8"

    # Normal DNS queries
    normal_domains = ["google.com", "github.com", "stackoverflow.com", "python.org"]
    for domain in normal_domains:
        pkt = IP(src=client, dst=dns_server) / UDP(sport=RandShort(), dport=53) / DNS(rd=1, qd=DNSQR(qname=domain))
        packets.append(pkt)

    # Suspicious DNS queries
    sus_domains = [
        "evil-phishing-site.com",
        "malware-download.xyz",
        "c2-server.top",
        "data-exfil.club",
        "suspicious-login.tk",
        "a" * 55 + ".suspicious-dga.com",  # DGA-like domain
    ]
    for domain in sus_domains:
        for _ in range(3):
            pkt = IP(src=client, dst=dns_server) / UDP(sport=RandShort(), dport=53) / DNS(rd=1, qd=DNSQR(qname=domain))
            packets.append(pkt)

    wrpcap(os.path.join(pcap_dir, "suspicious_dns.pcap"), packets)
    print(f"  Created with {len(packets)} packets")

    # 3. Normal Traffic PCAP
    print("Generating normal_traffic.pcap...")
    packets = []
    hosts = ["192.168.1.10", "192.168.1.11", "192.168.1.12"]
    servers = ["93.184.216.34", "142.250.190.78", "151.101.1.69"]

    for host in hosts:
        for server in servers:
            # TCP handshake
            syn = IP(src=host, dst=server) / TCP(sport=RandShort(), dport=443, flags="S")
            sa = IP(src=server, dst=host) / TCP(sport=443, dport=syn[TCP].sport, flags="SA")
            ack = IP(src=host, dst=server) / TCP(sport=syn[TCP].sport, dport=443, flags="A")
            packets.extend([syn, sa, ack])

            # DNS queries
            dns_pkt = IP(src=host, dst="8.8.8.8") / UDP(sport=RandShort(), dport=53) / DNS(rd=1, qd=DNSQR(qname="example.com"))
            packets.append(dns_pkt)

    wrpcap(os.path.join(pcap_dir, "normal_traffic.pcap"), packets)
    print(f"  Created with {len(packets)} packets")


def generate_log_samples():
    """Generate sample log files."""
    log_dir = os.path.join(os.path.dirname(__file__), "sample_data", "logs")
    os.makedirs(log_dir, exist_ok=True)

    # 1. Failed logins (brute force pattern)
    print("Generating failed_logins.log...")
    lines = []
    lines.append("Sep 15 08:00:01 server01 sshd[1234]: Accepted password for admin from 192.168.1.10 port 22")
    lines.append("Sep 15 08:05:23 server01 sshd[1235]: Accepted password for user1 from 192.168.1.11 port 22")

    # Brute force attempt
    for i in range(25):
        lines.append(f"Sep 15 08:10:{i:02d} server01 sshd[{1240+i}]: Failed password for admin from 192.168.1.50 port {40000+i}")
    for i in range(10):
        lines.append(f"Sep 15 08:11:{i:02d} server01 sshd[{1270+i}]: Failed password for root from 192.168.1.50 port {41000+i}")

    lines.append("Sep 15 08:12:00 server01 sshd[1280]: Failed password for invalid user test from 192.168.1.50 port 41100")
    lines.append("Sep 15 08:15:00 server01 sshd[1290]: Accepted password for admin from 192.168.1.10 port 22")

    with open(os.path.join(log_dir, "failed_logins.log"), "w") as f:
        f.write("\n".join(lines))
    print(f"  Created with {len(lines)} lines")

    # 2. Normal activity log
    print("Generating normal_activity.log...")
    lines = []
    for h in range(8, 18):
        for m in [0, 15, 30, 45]:
            lines.append(f"Sep 15 {h:02d}:{m:02d}:00 server01 sshd[{2000+h*4+m//15}]: Accepted password for user{h%5} from 192.168.1.{10+h%3} port 22")
            lines.append(f"Sep 15 {h:02d}:{m:02d}:05 server01 systemd[1]: Started User Session for user{h%5}")

    with open(os.path.join(log_dir, "normal_activity.log"), "w") as f:
        f.write("\n".join(lines))
    print(f"  Created with {len(lines)} lines")

    # 3. Suspicious auth JSON log
    print("Generating suspicious_auth.json...")
    events = []
    # Normal events
    for i in range(5):
        events.append({
            "timestamp": f"2024-09-15T08:{i:02d}:00Z",
            "event_type": "login",
            "username": f"user{i+1}",
            "source_ip": f"192.168.1.{10+i}",
            "status": "success",
            "action": "authentication"
        })

    # Suspicious events
    for i in range(15):
        events.append({
            "timestamp": f"2024-09-15T08:30:{i:02d}Z",
            "event_type": "login",
            "username": "admin",
            "source_ip": "192.168.1.50",
            "status": "failure",
            "action": "Failed password authentication",
            "details": "Invalid credentials provided"
        })

    # Privilege escalation
    events.append({
        "timestamp": "2024-09-15T08:31:00Z",
        "event_type": "privilege",
        "username": "admin",
        "source_ip": "192.168.1.50",
        "status": "success",
        "action": "sudo su - root",
        "details": "Privilege escalation to root"
    })

    with open(os.path.join(log_dir, "suspicious_auth.json"), "w") as f:
        json.dump(events, f, indent=2)
    print(f"  Created with {len(events)} events")


def generate_email_samples():
    """Generate sample phishing emails."""
    email_dir = os.path.join(os.path.dirname(__file__), "sample_data", "phishing_emails")
    os.makedirs(email_dir, exist_ok=True)

    # 1. Invoice phishing
    print("Generating invoice_phish.eml...")
    eml = """From: billing@secure-banklogin.com
To: victim@company.com
Subject: URGENT: Your Invoice #INV-2024-9856 Requires Immediate Payment
Date: Mon, 15 Sep 2024 10:30:00 +0000
MIME-Version: 1.0
Content-Type: text/html; charset="UTF-8"
Message-ID: <fake-msg-001@secure-banklogin.com>
X-Mailer: PhishKit/2.0
Authentication-Results: mx.company.com; spf=softfail; dkim=fail

<html>
<body style="font-family: Arial, sans-serif;">
<div style="max-width: 600px; margin: 0 auto;">
    <img src="https://evil-phishing-site.com/logo.png" alt="Bank Logo" />
    <h2>Invoice Payment Required</h2>
    <p>Dear Valued Customer,</p>
    <p>Your invoice #INV-2024-9856 for <strong>$4,299.00</strong> is overdue and requires <strong>immediate payment</strong> to avoid account suspension.</p>
    <p>Your account will be <strong>suspended within 24 hours</strong> if payment is not received.</p>
    <p><a href="https://secure-banklogin.com/verify?user=victim&token=abc123">Click here to verify your identity and make payment</a></p>
    <p>If you have questions, contact our support team immediately.</p>
    <p>Best regards,<br/>Billing Department<br/>Secure Bank Services</p>
    <hr/>
    <small>This is an automated message. Do not reply. <a href="http://evil-phishing-site.com/login">Login to your account</a></small>
</div>
</body>
</html>
"""

    with open(os.path.join(email_dir, "invoice_phish.eml"), "w") as f:
        f.write(eml.strip())

    # 2. Credential phishing
    print("Generating credential_phish.eml...")
    eml2 = """From: security@account-verify-now.com
To: user@company.com
Subject: Action Required: Unusual Sign-in Activity Detected on Your Account
Date: Tue, 16 Sep 2024 14:22:00 +0000
MIME-Version: 1.0
Content-Type: text/html; charset="UTF-8"
Message-ID: <fake-msg-002@account-verify-now.com>
Reply-To: noreply@account-verify-now.com
Authentication-Results: mx.company.com; spf=fail; dkim=none

<html>
<body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
<div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
    <h2 style="color: #d32f2f;">⚠️ Security Alert</h2>
    <p>Dear User,</p>
    <p>We detected <strong>unusual activity</strong> on your account from an unrecognized device:</p>
    <ul>
        <li><strong>Location:</strong> Moscow, Russia</li>
        <li><strong>Device:</strong> Unknown Linux Device</li>
        <li><strong>Time:</strong> September 16, 2024 02:14 AM</li>
    </ul>
    <p>If this was not you, your account may be compromised. Please verify your identity immediately to secure your account.</p>
    <p style="text-align: center;">
        <a href="https://account-verify-now.com/signin?redirect=dashboard&user=victim" style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Your Identity</a>
    </p>
    <p><strong>Act now</strong> — failure to verify within 24 hours will result in account suspension.</p>
    <p>If you did authorize this sign-in, you can safely ignore this email.</p>
    <p>Regards,<br/>Account Security Team</p>
    <hr/>
    <small style="color: #999;">You received this email because your account has a security alert. <a href="http://suspicious-login.tk/unsubscribe">Unsubscribe</a></small>
</div>
</body>
</html>
"""

    with open(os.path.join(email_dir, "credential_phish.eml"), "w") as f:
        f.write(eml2.strip())

    # 3. Normal email
    print("Generating normal_email.eml...")
    eml3 = """From: john.smith@company.com
To: team@company.com
Subject: Weekly Team Meeting - Agenda
Date: Wed, 17 Sep 2024 09:00:00 +0000
MIME-Version: 1.0
Content-Type: text/plain; charset="UTF-8"
Message-ID: <legit-msg-001@company.com>
Authentication-Results: mx.company.com; spf=pass; dkim=pass; dmarc=pass

Hi Team,

Here is the agenda for our weekly meeting today at 2:00 PM:

1. Sprint review and progress updates
2. Q3 roadmap discussion
3. New team member introduction
4. Open floor for questions

Please join via the usual conference link.

Best,
John Smith
Engineering Manager
company.com
"""

    with open(os.path.join(email_dir, "normal_email.eml"), "w") as f:
        f.write(eml3.strip())

    print("Sample email files created!")


if __name__ == "__main__":
    print("=" * 50)
    print("Generating SentinelAI Sample Data")
    print("=" * 50)

    print("\n--- PCAP Files ---")
    generate_pcap_samples()

    print("\n--- Log Files ---")
    generate_log_samples()

    print("\n--- Email Files ---")
    generate_email_samples()

    print("\n✅ All sample data generated successfully!")

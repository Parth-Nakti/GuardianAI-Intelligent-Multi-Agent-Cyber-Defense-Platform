# SentinelAI: Multi-Agent Intelligent Cybersecurity Operations Center

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff.svg)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com)

**SentinelAI** is an autonomous, full-stack, AI-powered Security Operations Center (SOC) platform. It harnesses a coordinated swarm of 7 specialized AI agents to ingest multi-source cybersecurity telemetry (PCAP network traffic, system authentication logs, and email artifacts), detect intrusions, enrich indicators against threat intelligence databases, cross-correlate attacks, synthesize safe containment playbooks, and generate audit-ready incident reports.

---

## Architecture Overview

```
                          ┌──────────────────────────┐
                          │    SOC Analyst Web UI    │
                          │  (React + Vite + Recharts) │
                          └─────────────┬────────────┘
                                        │ REST API
                          ┌─────────────▼────────────┐
                          │     FastAPI Backend      │
                          │  (Agent Swarm Manager)   │
                          └─────────────┬────────────┘
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
┌─────────────────────────┐                             ┌─────────────────────────┐
│     Ingestion Agents    │                             │    Enrichment Agents    │
├─────────────────────────┤                             ├─────────────────────────┤
│ 1. Network Monitor      │                             │ 4. Threat Intelligence  │
│ 2. Phishing Detection   │                             │    (IOC DB & Reputation)│
│ 3. Malware Analysis     │                             └────────────┬────────────┘
└────────────┬────────────┘                                          │
             │                                                       │
             └──────────────────────────┬────────────────────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │ 5. Cross-Source Correlation │
                         │    (Attack Graph Engine)    │
                         └──────────────┬──────────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
          ┌────────────────────────────┐ ┌────────────────────────────┐
          │ 6. Incident Response Agent │ │ 7. Report Generation Agent │
          │  (MITRE-Aligned Playbooks) │ │  (Executive & PDF Exports) │
          └────────────────────────────┘ └────────────────────────────┘
```

---

## Specialized Multi-Agent Swarm

| Agent Name | Primary Responsibility | Detection & Reasoning Capabilities |
| :--- | :--- | :--- |
| **1. Network Monitor Agent** | Deep Packet Inspection (PCAP) | Detects port scanning, excessive SYN connections, anomalous protocols, and DNS tunneling using Scapy and AI heuristics. |
| **2. Phishing Detection Agent** | Email Ingestion & Linguistics | Detects SPF/DKIM header spoofing, credential harvesting URLs, urgency linguistics, and sender impersonation. |
| **3. Malware Analysis Agent** | Static Binary & File Triage | Extracts MD5/SHA-256 hashes, analyzes entropy, inspects headers, and flags suspicious executable indicators. |
| **4. Threat Intelligence Agent** | IOC Enrichment & Correlation | Queries local threat intelligence repository for known-bad IPs, C2 servers, phishing domains, and actor signatures. |
| **5. Incident Correlation Agent** | Multi-Source Attack Graphing | Evaluates cross-vector indicators, computes correlation confidence scores, and links multi-stage intrusions. |
| **6. Incident Response Agent** | Defensive Remediation | Synthesizes prioritized containment, eradication, and recovery recommendations aligned with MITRE ATT&CK. |
| **7. Report Generation Agent** | Technical & Executive Reporting | Compiles all agent findings into structured incident reports with client-side PDF export functionality. |

---

## Technology Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy (Async), aiosqlite, Scapy, Pydantic v2.
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Recharts, jsPDF, jsPDF-AutoTable.
- **Database**: SQLite (async with migration-ready SQLAlchemy models).
- **AI / LLM Integration**: Multi-provider abstraction supporting Google Gemini, OpenAI, Groq, local Ollama, and built-in Mock/Demo mode (zero API keys required).

---

## Quick Start & Setup Guide

### 1. Prerequisites
- Python 3.12+
- Node.js 18+ and npm

### 2. Backend Setup

```bash
# Clone or navigate to the project directory
cd /Users/parth/AI_CP

# Install Python dependencies
python3.12 -m pip install -r requirements.txt

# Start the FastAPI backend server (Runs on port 8001)
python3.12 -m uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload
```

The backend interactive API docs will be available at:
`http://localhost:8001/docs`

### 3. Frontend Setup

```bash
# Open a new terminal and navigate to frontend
cd /Users/parth/AI_CP/frontend

# Install dependencies (already installed)
npm install

# Start the Vite development server (Runs on port 5173)
npm run dev
```

The SOC Dashboard is accessible at:
`http://localhost:5173`

---

## Interactive Mid-Semester Demonstration Scenarios

Three pre-generated synthetic cybersecurity test scenarios are available in `sample_data/`:

### Demo 1: Port Scan & Reconnaissance Attack
1. Navigate to **Analyze Data** in the web UI (`http://localhost:5173/analyze`).
2. Select the **Network Traffic (PCAP)** tab.
3. Click the quick demo button **`port_scan.pcap`** (or browse to `sample_data/pcaps/port_scan.pcap`).
4. Click **Start Multi-Agent Analysis**.
5. Observe the live multi-agent execution pipeline:
   - **Network Monitor Agent** detects 1005 scanned destination ports.
   - **Threat Intelligence Agent** enriches involved IP addresses.
   - **Incident Correlation Agent** evaluates attack scope.
   - **Response Agent** generates immediate firewall blocking recommendations.
   - **Report Agent** generates incident record `#INC-0001`.

### Demo 2: Phishing & Credential Theft Campaign
1. In **Analyze Data**, select the **Email Artifacts** tab.
2. Click **`credential_phish.eml`** (or select `sample_data/phishing_emails/credential_phish.eml`).
3. Click **Start Multi-Agent Analysis**.
4. Observe the agents detect:
   - Urgency language and credential-harvesting keywords.
   - Domain mismatch (`suspicious-login.tk` vs claimed sender).
   - High-confidence IOC matches against the threat intelligence database.

### Demo 3: Authentication Brute-Force & Privilege Escalation
1. In **Analyze Data**, select the **Security & Auth Logs** tab.
2. Click **`failed_logins.log`**.
3. Click **Start Multi-Agent Analysis**.
4. Observe detection of 36 failed authentication attempts from `192.168.1.50`, triggering a **CRITICAL Severity Incident**.

---

## SOC Features & Navigation

- **SOC Dashboard (`/`)**: High-level telemetry cards, threat severity donut chart, timeline area chart, threat category distribution, recent incident feed, and swarm operational indicators.
- **Analyze Data (`/analyze`)**: Drag-and-drop artifact ingestion for PCAPs, logs, and emails with animated multi-agent pipeline telemetry and live log streaming.
- **Incidents Registry (`/incidents`)**: Real-time triage queue with live search, severity and status filters, and one-click status transitions (Open, Investigating, Resolved, Closed).
- **Incident Investigation View (`/incidents/:id`)**: Deep-dive forensics including executive attack narrative, raw telemetry evidence, individual agent findings, IOC threat intelligence matrix, and MITRE response playbooks.
- **AI Agents Monitor (`/agents`)**: Real-time status for all 7 agents, performance telemetry (total analyses, success rate), and interactive swarm architecture diagram.
- **Security Reports (`/reports`)**: Technical dossiers with one-click **Client-Side PDF Export** via jsPDF.

---

## Phase 2 Roadmap (Final Implementation)
- Live packet capture via Wireshark/libpcap daemon.
- Production SIEM integrations (Elasticsearch, Splunk, Wazuh).
- Bi-directional webhook automated blocking (iptables / cloud firewalls).
- Role-based Access Control (RBAC) and analyst shift handover logs.
